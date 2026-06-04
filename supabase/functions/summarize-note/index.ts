import { createClient } from "@supabase/supabase-js";

// Helps local TypeScript understand Supabase Edge Function globals.
declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "gpt-5-nano";
const MAX_NOTE_CHARS = 8000;
const MAX_SOURCE_CHARS = 9000;
const MAX_SUMMARY_OUTPUT_TOKENS = 1500;

type DocumentChunkRow = {
  id: string;
  note_id: string;
  attachment_id: string;
  page_number: number | null;
  chunk_index: number;
  text: string;
};

type RequestBody = {
  noteId?: unknown;
  chunkIds?: unknown;
  attachmentIds?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))]
    : [];
}

// JSON with CORS headers
function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

// extracting texts from AI response shape
function getOutputText(response: any) {
  if (typeof response?.output_text === "string") {
    return response.output_text.trim();
  }

  const chunks = response?.output
    ?.flatMap((item: any) => item?.content ?? [])
    ?.map((content: any) => content?.text)
    ?.filter((text: unknown) => typeof text === "string" && text.length > 0);

  return chunks?.join("\n").trim() ?? "";
}

// error interms of inadequate response or no response at all
function getOpenAiFailureMessage(response: any) {
  if (response?.status === "incomplete") {
    const reason = response?.incomplete_details?.reason;
    return reason === "max_output_tokens"
      ? "AI Agent used the output token budget before producing summary text. Try again with a shorter note."
      : "AI Agent did not complete the summary response.";
  }

  return "AI Agent returned no summary text.";
}

async function getSourceChunks({
  supabase,
  userId,
  noteId,
  chunkIds,
  attachmentIds,
}: {
  supabase: any;
  userId: string;
  noteId: string;
  chunkIds: string[];
  attachmentIds: string[];
}) {
  let query = supabase
    .from("document_chunks")
    .select("id, note_id, attachment_id, page_number, chunk_index, text")
    .eq("user_id", userId)
    .eq("note_id", noteId)
    .order("page_number", { ascending: true, nullsFirst: false })
    .order("chunk_index", { ascending: true });

  if (chunkIds.length > 0) {
    query = query.in("id", chunkIds);
  } else if (attachmentIds.length > 0) {
    query = query.in("attachment_id", attachmentIds);
  }

  const { data, error } = await query.limit(12);

  if (error) {
    throw error;
  }

  return data ?? [];
}

function buildSourceInput(chunks: DocumentChunkRow[]) {
  const parts: string[] = [];
  let remaining = MAX_SOURCE_CHARS;

  for (const chunk of chunks) {
    if (remaining <= 0) break;

    const pageLabel = chunk.page_number ? `Page ${chunk.page_number}` : "Attachment text";
    const header = `\n\n${pageLabel}\nTEXT:\n`;
    const text = (chunk.text ?? "").trim();
    const slice = text.slice(0, Math.max(0, remaining - header.length));

    if (!slice) continue;

    parts.push(`${header}${slice}`);
    remaining -= header.length + slice.length;
  }

  return parts.join("").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  const authorization = req.headers.get("Authorization");

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Supabase function environment is missing." }, 500);
  }

  if (!openAiKey) {
    return jsonResponse({ error: "OPENAI_API_KEY is not configured." }, 500);
  }

  if (!authorization) {
    return jsonResponse({ error: "Authentication required." }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authorization },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: "Authentication required." }, 401);
  }

  let body: RequestBody;

  try {
    const parsedBody: unknown = await req.json();
    body = isRecord(parsedBody) ? parsedBody : {};
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

  const noteId = typeof body.noteId === "string" ? body.noteId : "";
  const chunkIds = normalizeStringArray(body.chunkIds);
  const attachmentIds = normalizeStringArray(body.attachmentIds);

  if (!noteId) {
    return jsonResponse({ error: "noteId is required." }, 400);
  }

  const { data: note, error: noteError } = await supabase
    .from("notes")
    .select("id, user_id, title, content, subject_id")
    .eq("id", noteId)
    .eq("user_id", user.id)
    .single();

  if (noteError || !note) {
    return jsonResponse({ error: "Note not found." }, 404);
  }

  const content = (note.content ?? "").trim();
  const sourceChunks = await getSourceChunks({
    supabase,
    userId: user.id,
    noteId,
    chunkIds,
    attachmentIds,
  });
  const sourceInput = buildSourceInput(sourceChunks);

  if (!content && !sourceInput) {
    const message = "This note has no text content or extracted source text to summarize.";
    const { data } = await supabase
      .from("notes")
      .update({
        ai_summary_status: "failed",
        ai_summary_model: MODEL,
        ai_summary_error: message,
        ai_summary_input_char_count: 0,
      })
      .eq("id", note.id)
      .eq("user_id", user.id)
      .select("*, subjects (id, name, color), note_attachments (id, file_type, file_size)")
      .single();

    return jsonResponse({ error: message, summary: data }, 400);
  }

  const limitedContent = content.slice(0, MAX_NOTE_CHARS);
  const inputCharCount = limitedContent.length + sourceInput.length;

  await supabase
    .from("notes")
    .update({
      ai_summary_status: "pending",
      ai_summary_model: MODEL,
      ai_summary_error: null,
      ai_summary_input_char_count: inputCharCount,
    })
    .eq("id", note.id)
    .eq("user_id", user.id);

  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_output_tokens: MAX_SUMMARY_OUTPUT_TOKENS,
        reasoning: { effort: "minimal" },
        text: { verbosity: "low" },
        instructions:
          "You create study summaries for students. Use only the supplied note content and attachment/source text. Keep the answer around 250 to 400 words unless the source is very short. Be direct, accurate, and budget-conscious. Format the answer as clean Markdown. For programming or command-line material, wrap inline code terms, functions, methods, operators, keywords, file names, shell commands, and syntax examples in backticks. Use fenced code blocks with a language tag, such as ```python, for multi-line snippets or when showing an example that should be copied. Do not overuse code blocks for normal prose. Do not include internal source references, chunk IDs, attachment IDs, citations, or URLs unless an actual web URL appears verbatim in the supplied material and is important to the topic. When writing mathematical, statistical, machine learning, reinforcement learning, scientific, or technical formulas, always use valid KaTeX-compatible LaTeX. Use $...$ for short inline formulas and $$...$$ for block/display formulas. Important equations must be written as display equations on their own lines. Do not write formulas in raw plain-text notation using symbols like Σ, ^, max_a, underscores, return statements, or messy ASCII notation when LaTeX is more appropriate. Preserve formula meaning without hardcoding examples from outside the supplied material.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Summarize this saved study material with these exact sections:\n\nCore idea:\nKey points:\nThings to memorize:\nPossible quiz angles:\n\nUse only the supplied note content and attachment/source text. Do not add a Source references section. Do not mention chunk IDs, attachment IDs, or internal source labels. If the supplied material includes a real web URL that matters, you may mention it naturally inside the relevant section. If the material is code-related, make code syntax visually distinct with inline backticks and short fenced code blocks where useful.\n\nNote title: ${note.title}\n\nNote content:\n${limitedContent || "No markdown note content supplied."}\n\nAttachment/source text:\n${sourceInput || "No attachment/source text supplied."}`,
              },
            ],
          },
        ],
      }),
    });

    const responseBody = await openAiResponse.json();

    if (!openAiResponse.ok) {
      throw new Error(responseBody?.error?.message ?? "OpenAI summary request failed.");
    }

    const summaryText = getOutputText(responseBody);

    if (!summaryText) {
      throw new Error(getOpenAiFailureMessage(responseBody));
    }

    const { data: savedSummary, error: updateError } = await supabase
      .from("notes")
      .update({
        ai_summary: summaryText,
        ai_summary_status: "completed",
        ai_summary_model: MODEL,
        ai_summary_generated_at: new Date().toISOString(),
        ai_summary_error: null,
        ai_summary_input_char_count: inputCharCount,
      })
      .eq("id", note.id)
      .eq("user_id", user.id)
      .select("*, subjects (id, name, color), note_attachments (id, file_type, file_size)")
      .single();

    if (updateError) {
      throw updateError;
    }

    if (sourceChunks.length > 0) {
      await supabase
        .from("ai_generation_sources")
        .insert(sourceChunks.map((chunk) => ({
          user_id: user.id,
          artifact_type: "summary",
          artifact_id: note.id,
          note_id: note.id,
          attachment_id: chunk.attachment_id,
          chunk_id: chunk.id,
          page_number: chunk.page_number,
        })));
    }

    return jsonResponse({ summary: savedSummary, sources: sourceChunks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Summary generation failed.";

    const { data: failedSummary } = await supabase
      .from("notes")
      .update({
        ai_summary_status: "failed",
        ai_summary_model: MODEL,
        ai_summary_error: message,
        ai_summary_input_char_count: inputCharCount,
      })
      .eq("id", note.id)
      .eq("user_id", user.id)
      .select("*, subjects (id, name, color), note_attachments (id, file_type, file_size)")
      .single();

    return jsonResponse({ error: message, summary: failedSummary }, 500);
  }
});
