import { createClient } from "@supabase/supabase-js";

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

const QUIZ_MODEL = "gpt-5-mini";
const WRONG_ANSWER_MODEL = "gpt-5-nano";
const MAX_INPUT_CHARS = 10000;
const MAX_SOURCE_CHARS = 10000;
const MIN_QUESTION_COUNT = 4;
const MAX_QUESTION_COUNT = 12;

type NoteRow = {
  id: string;
  title: string;
  content: string | null;
  subject_id: string;
};

type GeneratedQuestion = {
  question: unknown;
  correctAnswer: unknown;
  explanation: unknown;
  topicName?: unknown;
  difficulty?: unknown;
  sourceNoteId?: unknown;
};

type DistractorSet = {
  questionIndex: unknown;
  wrongAnswers: unknown;
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

function clampCount(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 8;
  }

  return Math.min(MAX_QUESTION_COUNT, Math.max(MIN_QUESTION_COUNT, Math.round(parsed)));
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

function getOpenAiFailureMessage(response: OpenAiResponseBody, kind: string) {
  if (response?.status === "incomplete") {
    const reason = response?.incomplete_details?.reason;
    return reason === "max_output_tokens"
      ? `AI Agent used the output token budget before producing ${kind}. Try fewer questions or shorter notes.`
      : `AI Agent did not complete the ${kind} response.`;
  }

  return `AI Agent returned no ${kind} text.`;
}

function getOpenAiErrorMessage(response: OpenAiResponseBody, fallback: string) {
  return typeof response.error?.message === "string" ? response.error.message : fallback;
}

function getQuestionOrder(question: unknown) {
  if (!isRecord(question)) {
    return 0;
  }

  return typeof question.question_order === "number" ? question.question_order : 0;
}

function normalizeDifficulty(value: unknown) {
  return ["easy", "medium", "hard"].includes(String(value)) ? String(value) : "medium";
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))]
    : [];
}

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

function parseQuestions(responseText: string, noteIds: Set<string>, fallbackNoteId: string | null) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error("AI Agent returned invalid quiz JSON.");
  }

  const questions = isRecord(parsed) && Array.isArray(parsed.questions) ? parsed.questions : [];

  return questions
    .map((question: GeneratedQuestion, index: number) => {
      const text = typeof question.question === "string" ? question.question.trim() : "";
      const correctAnswer = typeof question.correctAnswer === "string"
        ? question.correctAnswer.trim()
        : "";
      const explanation = typeof question.explanation === "string"
        ? question.explanation.trim()
        : "";
      const topicName = typeof question.topicName === "string" ? question.topicName.trim() : "";
      const candidateNoteId = typeof question.sourceNoteId === "string" ? question.sourceNoteId : null;
      const sourceNoteId = candidateNoteId && noteIds.has(candidateNoteId)
        ? candidateNoteId
        : fallbackNoteId;

      return {
        index,
        question: text,
        correctAnswer,
        explanation,
        topicName,
      difficulty: normalizeDifficulty(question.difficulty),
      sourceNoteId,
    };
  })
    .filter((question) => (
      question.question.length > 0
      && question.correctAnswer.length > 0
      && question.explanation.length > 0
    ));
}

function parseDistractors(responseText: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error("AI Agent returned invalid wrong-answer JSON.");
  }

  const sets = isRecord(parsed) && Array.isArray(parsed.distractors) ? parsed.distractors : [];
  const byIndex = new Map<number, string[]>();

  for (const set of sets as DistractorSet[]) {
    const index = Number(set.questionIndex);
    const wrongAnswers = Array.isArray(set.wrongAnswers)
      ? set.wrongAnswers
        .map((answer) => (typeof answer === "string" ? answer.trim() : ""))
        .filter((answer) => answer.length > 0)
        .slice(0, 3)
      : [];

    if (Number.isInteger(index) && wrongAnswers.length === 3) {
      byIndex.set(index, wrongAnswers);
    }
  }

  return byIndex;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

async function callOpenAi(openAiKey: string, body: Record<string, unknown>) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const parsedResponseBody: unknown = await response.json();
  const responseBody = isRecord(parsedResponseBody) ? parsedResponseBody : {};

  if (!response.ok) {
    throw new Error(getOpenAiErrorMessage(responseBody, "OpenAI quiz request failed."));
  }

  return responseBody;
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
  const noteId = typeof body?.noteId === "string" && body.noteId ? body.noteId : null;
  const count = clampCount(body?.count);
  const chunkIds = normalizeStringArray(body?.chunkIds);
  const attachmentIds = normalizeStringArray(body?.attachmentIds);

  if (!subjectId) {
    return jsonResponse({ error: "subjectId is required." }, 400);
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
        ? "This note has no markdown or extracted source content to generate a quiz from."
        : "This subject has no markdown or extracted source content to generate a quiz from.",
    }, 400);
  }

  try {
    const quizResponse = await callOpenAi(openAiKey, {
      model: QUIZ_MODEL,
      max_output_tokens: 2600,
      reasoning: { effort: "minimal" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "quiz_generation",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              questions: {
                type: "array",
                minItems: 1,
                maxItems: MAX_QUESTION_COUNT,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    question: { type: "string" },
                    correctAnswer: { type: "string" },
                    explanation: { type: "string" },
                    topicName: { type: "string" },
                    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                    sourceNoteId: { type: ["string", "null"] },
                  },
                  required: [
                    "question",
                    "correctAnswer",
                    "explanation",
                    "topicName",
                    "difficulty",
                    "sourceNoteId",
                  ],
                },
              },
            },
            required: ["questions"],
          },
        },
      },
      instructions:
        "You generate multiple-choice quiz questions for students. Use only the supplied note content and extracted source chunks. Create questions that test understanding, definitions, formulas, contrasts, cause/effect, and likely exam reasoning. Return only JSON matching the schema. Do not generate wrong answers.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Create exactly ${count} quiz questions for subject: ${subject.name}.\nUse sourceNoteId from the matching NOTE ID when possible.\n\nMarkdown note content:\n${noteInput || "No markdown note content supplied."}\n\nExtracted source chunks:\n${sourceInput || "No extracted source chunks supplied."}`,
            },
          ],
        },
      ],
    });

    const quizText = getOutputText(quizResponse);

    if (!quizText) {
      throw new Error(getOpenAiFailureMessage(quizResponse, "quiz"));
    }

    const noteIds = new Set(sourceNotes.map((note) => note.id));
    const fallbackNoteId = noteId && noteIds.has(noteId) ? noteId : null;
    const generatedQuestions = parseQuestions(quizText, noteIds, fallbackNoteId).slice(0, count);

    if (generatedQuestions.length === 0) {
      throw new Error("AI Agent did not produce usable quiz questions.");
    }

    const distractorInput = generatedQuestions.map((question) => ({
      questionIndex: question.index,
      question: question.question,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      topicName: question.topicName,
    }));

    const distractorResponse = await callOpenAi(openAiKey, {
      model: WRONG_ANSWER_MODEL,
      max_output_tokens: 1800,
      reasoning: { effort: "minimal" },
      text: {
        verbosity: "low",
        format: {
          type: "json_schema",
          name: "wrong_answer_generation",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              distractors: {
                type: "array",
                minItems: 1,
                maxItems: MAX_QUESTION_COUNT,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    questionIndex: { type: "integer" },
                    wrongAnswers: {
                      type: "array",
                      minItems: 3,
                      maxItems: 3,
                      items: { type: "string" },
                    },
                  },
                  required: ["questionIndex", "wrongAnswers"],
                },
              },
            },
            required: ["distractors"],
          },
        },
      },
      instructions:
        "You generate plausible but clearly incorrect multiple-choice wrong answers. Use only the supplied questions and correct answers. Each wrong answer must be distinct, concise, and not equivalent to the correct answer. Return only JSON matching the schema.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({ questions: distractorInput }),
            },
          ],
        },
      ],
    });

    const distractorText = getOutputText(distractorResponse);

    if (!distractorText) {
      throw new Error(getOpenAiFailureMessage(distractorResponse, "wrong-answer"));
    }

    const distractors = parseDistractors(distractorText);
    const completeQuestions = generatedQuestions.filter((question) => distractors.has(question.index));

    if (completeQuestions.length === 0) {
      throw new Error("AI Agent did not produce usable wrong answers.");
    }

    const quizTitle = noteId && sourceNotes[0]?.title
      ? `${sourceNotes[0].title} Quiz`
      : `${subject.name} Quiz`;

    const { data: quiz, error: quizInsertError } = await supabase
      .from("quizzes")
      .insert({
        user_id: user.id,
        subject_id: subjectId,
        note_id: noteId,
        title: quizTitle,
        source: "generated",
        question_count: completeQuestions.length,
        input_char_count: noteInput.length,
        generation_model: QUIZ_MODEL,
        wrong_answer_model: WRONG_ANSWER_MODEL,
      })
      .select("id")
      .single();

    if (quizInsertError) {
      throw quizInsertError;
    }

    const questionRows = completeQuestions.map((question, index) => {
      const wrongAnswers = distractors.get(question.index) ?? [];
      const choices = shuffle([
        question.correctAnswer,
        ...wrongAnswers,
      ]);

      return {
        quiz_id: quiz.id,
        question: question.question,
        choices,
        correct_answer: question.correctAnswer,
        explanation: question.explanation,
        topic_name: question.topicName || null,
        question_order: index + 1,
        difficulty: question.difficulty,
        source_note_id: question.sourceNoteId,
      };
    });

    const { data: savedQuestions, error: questionsInsertError } = await supabase
      .from("quiz_questions")
      .insert(questionRows)
      .select("id, question, choices, correct_answer, explanation, topic_name, question_order, difficulty, source_note_id");

    if (questionsInsertError) {
      throw questionsInsertError;
    }

    if (sourceChunks.length > 0 && savedQuestions?.length) {
      await supabase
        .from("ai_generation_sources")
        .insert(savedQuestions.flatMap((question: { id: string; source_note_id?: string | null }) => (
          sourceChunks.map((chunk: DocumentChunkRow) => ({
            user_id: user.id,
            artifact_type: "quiz_question",
            artifact_id: question.id,
            note_id: question.source_note_id ?? chunk.note_id,
            attachment_id: chunk.attachment_id,
            chunk_id: chunk.id,
            page_number: chunk.page_number,
          }))
        )));
    }

    const { data: savedQuiz, error: selectError } = await supabase
      .from("quizzes")
      .select(`
        *,
        subjects (
          id,
          name,
          color
        ),
        quiz_questions (
          id,
          question,
          choices,
          correct_answer,
          explanation,
          topic_name,
          question_order,
          difficulty,
          source_note_id
        )
      `)
      .eq("id", quiz.id)
      .single();

    if (selectError) {
      throw selectError;
    }

    return jsonResponse({
      quiz: {
        ...savedQuiz,
        quiz_questions: [...(savedQuestions ?? savedQuiz?.quiz_questions ?? [])].sort(
          (first, second) => getQuestionOrder(first) - getQuestionOrder(second),
        ),
      },
      models: {
        quiz: QUIZ_MODEL,
        wrongAnswers: WRONG_ANSWER_MODEL,
      },
      inputCharCount: noteInput.length + sourceInput.length,
      sources: sourceChunks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quiz generation failed.";
    return jsonResponse({ error: message }, 500);
  }
});
