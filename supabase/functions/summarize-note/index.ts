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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getOutputText(response: any) {
  if (typeof response?.output_text === "string") {
    return response.output_text.trim();
  }

  const chunks = response?.output
    ?.flatMap((item: any) => item?.content ?? [])
    ?.map((content: any) => content?.text)
    ?.filter(Boolean);

  return chunks?.join("\n").trim() ?? "";
}

function getOpenAiFailureMessage(response: any) {
  if (response?.status === "incomplete") {
    const reason = response?.incomplete_details?.reason;
    return reason === "max_output_tokens"
      ? "AI Agent used the output token budget before producing summary text. Try again with a shorter note."
      : "AI Agent did not complete the summary response.";
  }

  return "AI Agent returned no summary text.";
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

  let noteId: string | undefined;

  try {
    const body = await req.json();
    noteId = body?.noteId;
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON." }, 400);
  }

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

  if (!content) {
    const message = "This note has no text content to summarize.";
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
  const inputCharCount = limitedContent.length;

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
        max_output_tokens: 1200,
        reasoning: { effort: "minimal" },
        text: { verbosity: "low" },
        instructions:
          "You create compact study summaries for students. Use the user's note only. Keep the answer around 150 to 250 words. Be direct, accurate, and budget-conscious. Format the answer as clean Markdown. When writing mathematical, statistical, machine learning, reinforcement learning, scientific, or technical formulas, always use valid KaTeX-compatible LaTeX. Use $...$ for short inline formulas and $$...$$ for block/display formulas. Important equations must be written as display equations on their own lines. Do not write formulas in raw plain-text notation using symbols like Σ, ^, max_a, underscores, return statements, or messy ASCII notation when LaTeX is more appropriate. For example, write $$V^{\\pi}(s) = \\sum_a \\pi(a|s) \\sum_{s'} P(s'|s,a)[R(s,a) + \\gamma V^{\\pi}(s')]$$ instead of raw Bellman notation. Preserve formula meaning without hardcoding examples from outside the user's note.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Summarize this saved study note with these exact sections:\n\nCore idea:\nKey points:\nThings to memorize:\nPossible quiz angles:\n\nNote title: ${note.title}\n\nNote content:\n${limitedContent}`,
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

    return jsonResponse({ summary: savedSummary });
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
