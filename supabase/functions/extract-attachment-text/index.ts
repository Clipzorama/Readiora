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

const NOTE_ATTACHMENTS_BUCKET = "note-attachments";
const OCR_MODEL = "gpt-5-mini";
const CHUNK_CHAR_LIMIT = 2400;
const MIN_EXTRACTED_CHARS = 60;

type AttachmentRow = {
  id: string;
  user_id: string;
  note_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  storage_bucket: string | null;
};

type ExtractionRow = {
  id: string;
  user_id: string;
  note_id: string;
  attachment_id: string;
  status: string;
};

type PageText = {
  pageNumber: number | null;
  text: string;
};

type RequestBody = {
  attachmentId?: unknown;
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

function normalizeWhitespace(value: string) {
  return value
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function estimateTokens(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
}

function decodePdfLiteralString(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(Number.parseInt(octal, 8)));
}

function extractTextFromPdfBytes(buffer: ArrayBuffer) {
  const raw = new TextDecoder("latin1").decode(buffer);
  const fragments: string[] = [];
  const textObjectPattern = /BT([\s\S]*?)ET/g;
  const literalPattern = /\((?:\\.|[^\\)])*\)\s*Tj|\[(.*?)\]\s*TJ/g;
  const nestedLiteralPattern = /\((?:\\.|[^\\)])*\)/g;
  let textObjectMatch: RegExpExecArray | null;

  while ((textObjectMatch = textObjectPattern.exec(raw))) {
    const block = textObjectMatch[1] ?? "";
    let literalMatch: RegExpExecArray | null;

    while ((literalMatch = literalPattern.exec(block))) {
      const expression = literalMatch[0] ?? "";
      let nestedMatch: RegExpExecArray | null;

      while ((nestedMatch = nestedLiteralPattern.exec(expression))) {
        const wrapped = nestedMatch[0] ?? "";
        const text = wrapped.slice(1, -1);
        const decoded = decodePdfLiteralString(text);

        if (decoded.trim()) {
          fragments.push(decoded);
        }
      }
    }
  }

  return normalizeWhitespace(fragments.join(" "));
}

async function extractImageTextWithOpenAi({
  buffer,
  contentType,
  openAiKey,
}: {
  buffer: ArrayBuffer;
  contentType: string;
  openAiKey: string | undefined;
}) {
  if (!openAiKey) {
    throw new Error("OCR requires OPENAI_API_KEY or another OCR provider. Native PDF extraction is available, but image OCR is not configured.");
  }

  const imageUrl = `data:${contentType};base64,${arrayBufferToBase64(buffer)}`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OCR_MODEL,
      max_output_tokens: 2500,
      reasoning: { effort: "minimal" },
      text: { verbosity: "low" },
      instructions:
        "Extract all readable study text from the image. Preserve useful headings, lists, equations, labels, and page-like structure. Return only the extracted text. If no readable text exists, return an empty string.",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: "Extract the readable study text from this image." },
            { type: "input_image", image_url: imageUrl },
          ],
        },
      ],
    }),
  });

  const parsed: unknown = await response.json();
  const body = isRecord(parsed) ? parsed : {};

  if (!response.ok) {
    const error = isRecord(body.error) && typeof body.error.message === "string"
      ? body.error.message
      : "OCR request failed.";
    throw new Error(error);
  }

  if (typeof body.output_text === "string") {
    return normalizeWhitespace(body.output_text);
  }

  const output = Array.isArray(body.output) ? body.output : [];
  const chunks = output
    .flatMap((item) => (isRecord(item) && Array.isArray(item.content) ? item.content : []))
    .map((content) => (isRecord(content) && typeof content.text === "string" ? content.text : ""))
    .filter((text) => text.length > 0);

  return normalizeWhitespace(chunks.join("\n"));
}

async function extractPdfTextWithOpenAi({
  buffer,
  filename,
  openAiKey,
}: {
  buffer: ArrayBuffer;
  filename: string;
  openAiKey: string | undefined;
}) {
  if (!openAiKey) {
    const fallbackText = extractTextFromPdfBytes(buffer);

    if (fallbackText.length >= MIN_EXTRACTED_CHARS) {
      return normalizeWhitespace(fallbackText);
    }

    throw new Error("PDF extraction requires OPENAI_API_KEY for reliable document extraction.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OCR_MODEL,
      max_output_tokens: 8000,
      reasoning: { effort: "minimal" },
      text: { verbosity: "low" },
      instructions:
        "Extract all readable study text from the PDF. Use the PDF text and page images. Preserve headings, lists, code snippets, formulas, tables as readable text, and important labels. Prefix page sections with [[PAGE n]] when page boundaries are apparent. Return only extracted text. If a page is mostly visual, describe the useful study content briefly.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              filename,
              file_data: `data:application/pdf;base64,${arrayBufferToBase64(buffer)}`,
            },
            {
              type: "input_text",
              text: "Extract the readable study text from this PDF for later summarization, flashcards, and quizzes.",
            },
          ],
        },
      ],
    }),
  });

  const parsed: unknown = await response.json();
  const body = isRecord(parsed) ? parsed : {};

  if (!response.ok) {
    const error = isRecord(body.error) && typeof body.error.message === "string"
      ? body.error.message
      : "PDF extraction request failed.";
    throw new Error(error);
  }

  if (typeof body.output_text === "string") {
    return normalizeWhitespace(body.output_text);
  }

  const output = Array.isArray(body.output) ? body.output : [];
  const chunks = output
    .flatMap((item) => (isRecord(item) && Array.isArray(item.content) ? item.content : []))
    .map((content) => (isRecord(content) && typeof content.text === "string" ? content.text : ""))
    .filter((text) => text.length > 0);

  return normalizeWhitespace(chunks.join("\n"));
}

function splitExtractedPdfPages(text: string): PageText[] {
  const pagePattern = /\[\[PAGE\s+(\d+)\]\]/gi;
  const matches = [...text.matchAll(pagePattern)];

  if (matches.length === 0) {
    return [{ pageNumber: null, text }];
  }

  return matches
    .map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index ?? text.length : text.length;
      const pageNumber = Number.parseInt(match[1], 10);
      const pageText = normalizeWhitespace(text.slice(start, end));

      return {
        pageNumber: Number.isFinite(pageNumber) ? pageNumber : null,
        text: pageText,
      };
    })
    .filter((page) => page.text.length > 0);
}

async function extractPages({
  buffer,
  contentType,
  filename,
  openAiKey,
}: {
  buffer: ArrayBuffer;
  contentType: string;
  filename: string;
  openAiKey: string | undefined;
}): Promise<{ pages: PageText[]; method: string; provider: string }> {
  const normalizedContentType = contentType.toLowerCase();
  const normalizedFilename = filename.toLowerCase();
  const isPdf = normalizedContentType === "application/pdf" || normalizedFilename.endsWith(".pdf");

  if (isPdf) {
    const text = await extractPdfTextWithOpenAi({ buffer, filename, openAiKey });

    if (text.length >= MIN_EXTRACTED_CHARS) {
      return {
        pages: splitExtractedPdfPages(text),
        method: openAiKey ? "ai_pdf_ocr" : "native_pdf_basic",
        provider: openAiKey ? `openai:${OCR_MODEL}` : "built_in_pdf_literal_extractor",
      };
    }

    throw new Error("No usable study text was found in this PDF.");
  }

  if (normalizedContentType.startsWith("image/")) {
    const text = await extractImageTextWithOpenAi({ buffer, contentType, openAiKey });

    if (text.length < MIN_EXTRACTED_CHARS) {
      throw new Error("OCR completed, but no usable study text was found in this image.");
    }

    return {
      pages: [{ pageNumber: 1, text }],
      method: "ocr_image",
      provider: `openai:${OCR_MODEL}`,
    };
  }

  throw new Error("This attachment type is not supported for extraction.");
}

function chunkPages(pages: PageText[]) {
  const rows: Array<{ page_number: number | null; chunk_index: number; text: string; char_count: number; token_estimate: number }> = [];

  pages.forEach((page) => {
    const paragraphs = page.text
      .split(/\n{2,}/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const parts = paragraphs.length ? paragraphs : [page.text];
    let current = "";
    let chunkIndex = 1;

    parts.forEach((part) => {
      const candidate = current ? `${current}\n\n${part}` : part;

      if (candidate.length > CHUNK_CHAR_LIMIT && current) {
        rows.push({
          page_number: page.pageNumber,
          chunk_index: chunkIndex,
          text: current,
          char_count: current.length,
          token_estimate: estimateTokens(current),
        });
        chunkIndex += 1;
        current = part;
      } else {
        current = candidate;
      }
    });

    if (current) {
      rows.push({
        page_number: page.pageNumber,
        chunk_index: chunkIndex,
        text: current,
        char_count: current.length,
        token_estimate: estimateTokens(current),
      });
    }
  });

  return rows;
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

  const attachmentId = typeof body.attachmentId === "string" ? body.attachmentId : "";

  if (!attachmentId) {
    return jsonResponse({ error: "attachmentId is required." }, 400);
  }

  const { data: attachment, error: attachmentError } = await supabase
    .from("note_attachments")
    .select("id, user_id, note_id, file_name, file_path, file_type, storage_bucket")
    .eq("id", attachmentId)
    .eq("user_id", user.id)
    .single();

  if (attachmentError || !attachment) {
    return jsonResponse({ error: "Attachment not found." }, 404);
  }

  let extraction: ExtractionRow | null = null;

  try {
    const { data: upsertedExtraction, error: extractionError } = await supabase
      .from("attachment_extractions")
      .upsert({
        user_id: user.id,
        note_id: (attachment as AttachmentRow).note_id,
        attachment_id: attachment.id,
        status: "processing",
        extraction_method: null,
        provider: null,
        page_count: null,
        text_char_count: null,
        chunk_count: null,
        error: null,
      }, { onConflict: "attachment_id" })
      .select()
      .single();

    if (extractionError) {
      throw extractionError;
    }

    extraction = upsertedExtraction;

    const bucket = (attachment as AttachmentRow).storage_bucket || NOTE_ATTACHMENTS_BUCKET;
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(bucket)
      .download((attachment as AttachmentRow).file_path);

    if (downloadError || !fileBlob) {
      throw downloadError ?? new Error("Attachment file could not be downloaded.");
    }

    const buffer = await fileBlob.arrayBuffer();
    const { pages, method, provider } = await extractPages({
      buffer,
      contentType: (attachment as AttachmentRow).file_type,
      filename: (attachment as AttachmentRow).file_name,
      openAiKey,
    });
    const chunks = chunkPages(pages);
    const fullTextLength = pages.reduce((sum, page) => sum + page.text.length, 0);

    if (chunks.length === 0) {
      throw new Error("Extraction produced no usable chunks.");
    }

    const { error: deleteChunksError } = await supabase
      .from("document_chunks")
      .delete()
      .eq("extraction_id", extraction.id)
      .eq("user_id", user.id);

    if (deleteChunksError) {
      throw deleteChunksError;
    }

    const { data: savedChunks, error: insertChunksError } = await supabase
      .from("document_chunks")
      .insert(chunks.map((chunk) => ({
        user_id: user.id,
        extraction_id: extraction?.id,
        attachment_id: attachment.id,
        note_id: (attachment as AttachmentRow).note_id,
        ...chunk,
      })))
      .select("id, attachment_id, note_id, page_number, chunk_index, text, char_count, token_estimate");

    if (insertChunksError) {
      throw insertChunksError;
    }

    const { data: completedExtraction, error: completeError } = await supabase
      .from("attachment_extractions")
      .update({
        status: "completed",
        extraction_method: method,
        provider,
        page_count: pages.length,
        text_char_count: fullTextLength,
        chunk_count: savedChunks?.length ?? chunks.length,
        error: null,
      })
      .eq("id", extraction.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (completeError) {
      throw completeError;
    }

    return jsonResponse({
      extraction: completedExtraction,
      chunks: savedChunks ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment extraction failed.";

    if (extraction?.id) {
      const { data: failedExtraction } = await supabase
        .from("attachment_extractions")
        .update({
          status: "failed",
          error: message,
        })
        .eq("id", extraction.id)
        .eq("user_id", user.id)
        .select()
        .single();

      return jsonResponse({ error: message, extraction: failedExtraction }, 500);
    }

    return jsonResponse({ error: message }, 500);
  }
});
