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
const MAX_INPUT_CHARS = 9000;
const MAX_SOURCE_CHARS = 9000;
const MIN_CARD_COUNT = 4;
const MAX_CARD_COUNT = 12;

type NoteRow = {
  id: string;
  title: string;
  content: string | null;
  subject_id: string;
};

type GeneratedCard = {
  question: unknown;
  answer: unknown;
  difficulty?: unknown;
  sourceNoteId?: unknown;
};

type DocumentChunkRow = {
  id: string;
  note_id: string;
  attachment_id: string;
  page_number: number | null;
  chunk_index: number;
  text: string;
};

type RequestBody = {
  subjectId?: unknown;
  setId?: unknown;
  noteId?: unknown;
  count?: unknown;
  chunkIds?: unknown;
  attachmentIds?: unknown;
};

type OpenAiResponseBody = {
  output_text?: unknown;
  output?: unknown;
  status?: unknown;
  incomplete_details?: {
    reason?: unknown;
  };
  error?: {
    message?: unknown;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

// making the count between 4 and 12
function clampCount(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 8;
  }

  return Math.min(MAX_CARD_COUNT, Math.max(MIN_CARD_COUNT, Math.round(parsed)));
}

function getOutputText(response: OpenAiResponseBody) {
  if (typeof response?.output_text === "string") {
    return response.output_text.trim();
  }

  const output = Array.isArray(response.output) ? response.output : [];
  const chunks = output
    .flatMap((item) => {
      if (!isRecord(item) || !Array.isArray(item.content)) {
        return [];
      }

      return item.content;
    })
    .map((content) => (isRecord(content) && typeof content.text === "string" ? content.text : ""))
    .filter((text) => text.length > 0);

  return chunks.join("\n").trim();
}

function getOpenAiFailureMessage(response: OpenAiResponseBody) {
  if (response?.status === "incomplete") {
    const reason = response?.incomplete_details?.reason;
    return reason === "max_output_tokens"
      ? "AI Agent used the output token budget before producing flashcards. Try fewer cards or shorter notes."
      : "AI Agent did not complete the flashcard response.";
  }

  return "AI Agent returned no flashcard text.";
}

function getOpenAiErrorMessage(response: OpenAiResponseBody, fallback: string) {
  return typeof response.error?.message === "string" ? response.error.message : fallback;
}

function normalizeDifficulty(value: unknown) {
  return ["easy", "medium", "hard"].includes(String(value)) ? String(value) : "medium";
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))]
    : [];
}

// here im building a readable note text block with noteIDs and titles
function buildNoteInput(notes: NoteRow[]) {
  const chunks: string[] = [];
  let remaining = MAX_INPUT_CHARS;

  for (const note of notes) {
    const content = (note.content ?? "").trim();
    if (!content || remaining <= 0) continue;

    const header = `\n\nNOTE ID: ${note.id}\nTITLE: ${note.title}\nCONTENT:\n`;
    const slice = content.slice(0, Math.max(0, remaining - header.length));
    chunks.push(`${header}${slice}`);
    remaining -= header.length + slice.length;
  }

  return chunks.join("").trim();
}

async function getSourceChunks({
  supabase,
  userId,
  noteIds,
  chunkIds,
  attachmentIds,
}: {
  supabase: any;
  userId: string;
  noteIds: string[];
  chunkIds: string[];
  attachmentIds: string[];
}) {
  if (noteIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("document_chunks")
    .select("id, note_id, attachment_id, page_number, chunk_index, text")
    .eq("user_id", userId)
    .in("note_id", noteIds)
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

    const header = `\n\nSOURCE CHUNK ID: ${chunk.id}\nATTACHMENT ID: ${chunk.attachment_id}\nPAGE: ${chunk.page_number ?? "unknown"}\nCHUNK: ${chunk.chunk_index}\nTEXT:\n`;
    const text = (chunk.text ?? "").trim();
    const slice = text.slice(0, Math.max(0, remaining - header.length));

    if (!slice) continue;

    parts.push(`${header}${slice}`);
    remaining -= header.length + slice.length;
  }

  return parts.join("").trim();
}

//  parsing the content inside of the agents responses so it looks better inside of the flashcard
function parseGeneratedCards(responseText: string, noteIds: Set<string>, fallbackNoteId: string | null) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error("AI Agent returned invalid JSON.");
  }

  const cards = isRecord(parsed) && Array.isArray(parsed.flashcards) ? parsed.flashcards : [];

  return cards
    .map((card: GeneratedCard) => {
      const question = typeof card.question === "string" ? card.question.trim() : "";
      const answer = typeof card.answer === "string" ? card.answer.trim() : "";
      const candidateNoteId = typeof card.sourceNoteId === "string" ? card.sourceNoteId : null;
      const sourceNoteId = candidateNoteId && noteIds.has(candidateNoteId)
        ? candidateNoteId
        : fallbackNoteId;

    return {
      question,
      answer,
      difficulty: normalizeDifficulty(card.difficulty),
      sourceNoteId,
    };
  })
    .filter((card) => card.question.length > 0 && card.answer.length > 0);
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

  const subjectId = typeof body?.subjectId === "string" ? body.subjectId : "";
  const setId = typeof body?.setId === "string" ? body.setId : "";
  const noteId = typeof body?.noteId === "string" && body.noteId ? body.noteId : null;
  const count = clampCount(body?.count);
  const chunkIds = normalizeStringArray(body?.chunkIds);
  const attachmentIds = normalizeStringArray(body?.attachmentIds);

  if (!subjectId) {
    return jsonResponse({ error: "subjectId is required." }, 400);
  }

  if (!setId) {
    return jsonResponse({ error: "setId is required." }, 400);
  }

  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("id", subjectId)
    .eq("user_id", user.id)
    .single();

  if (subjectError || !subject) {
    return jsonResponse({ error: "Subject not found." }, 404);
  }

  const { data: flashcardSet, error: setError } = await supabase
    .from("flashcard_sets")
    .select("id, user_id, subject_id, title")
    .eq("id", setId)
    .eq("user_id", user.id)
    .single();

  if (setError || !flashcardSet) {
    return jsonResponse({ error: "Flashcard set not found." }, 404);
  }

  let notesQuery = supabase
    .from("notes")
    .select("id, title, content, subject_id")
    .eq("user_id", user.id)
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: false });

  if (noteId) {
    notesQuery = notesQuery.eq("id", noteId);
  }

  const { data: notes, error: notesError } = await notesQuery;

  if (notesError) {
    return jsonResponse({ error: notesError.message }, 500);
  }

  const noteRows = notes ?? [];
  const sourceNotes = noteRows.filter((note: NoteRow) => (note.content ?? "").trim());
  const sourceChunks = await getSourceChunks({
    supabase,
    userId: user.id,
    noteIds: noteRows.map((note: NoteRow) => note.id),
    chunkIds,
    attachmentIds,
  });

  const noteInput = buildNoteInput(sourceNotes);
  const sourceInput = buildSourceInput(sourceChunks);

  if (!noteInput && !sourceInput) {
    return jsonResponse({
      error: noteId
        ? "This note has no markdown or extracted source content to generate flashcards from."
        : "This subject has no markdown or extracted source content to generate flashcards from.",
    }, 400);
  }

  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_output_tokens: 1800,
        reasoning: { effort: "minimal" },
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "flashcard_generation",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                flashcards: {
                  type: "array",
                  minItems: 1,
                  maxItems: MAX_CARD_COUNT,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      question: { type: "string" },
                      answer: { type: "string" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                      sourceNoteId: { type: ["string", "null"] },
                    },
                    required: ["question", "answer", "difficulty", "sourceNoteId"],
                  },
                },
              },
              required: ["flashcards"],
            },
          },
        },
        instructions:
          "You generate concise active-recall flashcards for students. Use only the supplied note content and extracted source chunks. Create cards that test definitions, cause/effect, formulas, steps, distinctions, and likely exam questions. Keep each question direct. Keep answers compact but complete. Do not invent facts outside the supplied sources. Return only JSON matching the schema.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Create exactly ${count} flashcards for subject: ${subject.name}.\nUse sourceNoteId from the matching NOTE ID when possible.\n\nMarkdown note content:\n${noteInput || "No markdown note content supplied."}\n\nExtracted source chunks:\n${sourceInput || "No extracted source chunks supplied."}`,
              },
            ],
          },
        ],
      }),
    });

    const parsedResponseBody: unknown = await openAiResponse.json();
    const responseBody = isRecord(parsedResponseBody) ? parsedResponseBody : {};

    if (!openAiResponse.ok) {
      throw new Error(getOpenAiErrorMessage(responseBody, "OpenAI flashcard request failed."));
    }

    const responseText = getOutputText(responseBody);

    if (!responseText) {
      throw new Error(getOpenAiFailureMessage(responseBody));
    }

    const noteIds = new Set(sourceNotes.map((note) => note.id));
    const fallbackNoteId = noteId && noteIds.has(noteId) ? noteId : null;
    const generatedCards = parseGeneratedCards(responseText, noteIds, fallbackNoteId).slice(0, count);

    if (generatedCards.length === 0) {
      throw new Error("AI Agent did not produce usable flashcards.");
    }

    const insertRows = generatedCards.map((card) => ({
      user_id: user.id,
      set_id: setId,
      subject_id: subjectId,
      note_id: card.sourceNoteId,
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty,
      status: "new",
    }));

    const { data: savedCards, error: insertError } = await supabase
      .from("flashcards")
      .insert(insertRows)
      .select("*, subjects (id, name, color), notes (id, title), flashcard_sets (id, title)");

    if (insertError) {
      throw insertError;
    }

    if (sourceChunks.length > 0 && savedCards?.length) {
      await supabase
        .from("ai_generation_sources")
        .insert(savedCards.flatMap((card: { id: string; note_id?: string | null }) => (
          sourceChunks.map((chunk: DocumentChunkRow) => ({
            user_id: user.id,
            artifact_type: "flashcard",
            artifact_id: card.id,
            note_id: card.note_id ?? chunk.note_id,
            attachment_id: chunk.attachment_id,
            chunk_id: chunk.id,
            page_number: chunk.page_number,
          }))
        )));
    }

    return jsonResponse({
      flashcards: savedCards ?? [],
      model: MODEL,
      inputCharCount: noteInput.length + sourceInput.length,
      sources: sourceChunks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Flashcard generation failed.";
    return jsonResponse({ error: message }, 500);
  }
});
