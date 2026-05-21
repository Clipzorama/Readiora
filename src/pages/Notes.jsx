import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Bold,
  BookOpen,
  CheckCircle2,
  Clock,
  Code,
  ExternalLink,
  File,
  FileText,
  Heading,
  Image,
  Italic,
  List,
  ListOrdered,
  Paperclip,
  PenLine,
  Plus,
  Quote,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  AddButton,
  CardHeader,
  CommandCard,
  WarRoomShell,
} from "../components/WarRoomLayout";
import { useAuth } from "../hooks/useAuth";
import {
  createAttachmentSignedUrl,
  deleteNoteAttachment,
  getNoteAttachments,
  MAX_ATTACHMENT_SIZE_LABEL,
  uploadNoteAttachment,
  validateNoteAttachment,
} from "../services/noteAttachmentsService";
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
} from "../services/notesService";
import { getSubjects } from "../services/subjectsService";

const emptyDraft = {
  title: "",
  subjectId: "",
  content: "",
};

const workspaceVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: 12,
    scale: 0.985,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

const toolbarActions = [
  { label: "Bold", icon: Bold, before: "**", after: "**", fallback: "important point" },
  { label: "Italic", icon: Italic, before: "*", after: "*", fallback: "emphasis" },
  { label: "Heading", icon: Heading, before: "## ", after: "", fallback: "Key concept" },
  { label: "Bullet list", icon: List, before: "- ", after: "", fallback: "Evidence or example" },
  { label: "Numbered list", icon: ListOrdered, before: "1. ", after: "", fallback: "First step" },
  { label: "Code block", icon: Code, before: "```\n", after: "\n```", fallback: "formula or snippet" },
  { label: "Quote", icon: Quote, before: "> ", after: "", fallback: "Memorable definition" },
];

function formatUpdated(note) {
  const value = note?.updated_at ?? note?.created_at;
  if (!value) return "No timestamp";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatFileSize(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function fileKind(type) {
  if (type?.startsWith("image/")) return "Image";
  if (type === "application/pdf") return "PDF";
  return "File";
}

function getNoteAttachmentStats(note) {
  const noteAttachments = note?.note_attachments ?? [];

  return {
    count: noteAttachments.length,
    pdfCount: noteAttachments.filter((item) => item.file_type === "application/pdf").length,
    imageCount: noteAttachments.filter((item) => item.file_type?.startsWith("image/")).length,
    hasMarkdown: Boolean(note?.content?.trim()),
  };
}

function renderInline(text) {
  const parts = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;
    if (token.startsWith("**")) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      parts.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      parts.push(
        <code key={key} className="rounded-md border border-border bg-background/80 px-1.5 py-0.5 text-sm text-primary">
          {token.slice(1, -1)}
        </code>,
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function MarkdownPreview({ content }) {
  const lines = content.split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <pre key={`code-${index}`} className="overflow-x-auto rounded-2xl border border-border bg-background/85 p-4 text-sm leading-7 text-secondary">
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 2;
      const text = line.replace(/^#{1,3}\s/, "");
      const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      blocks.push(
        <Tag key={`heading-${index}`} className={level === 1 ? "text-3xl font-bold text-primary" : "text-2xl font-bold text-primary"}>
          {renderInline(text)}
        </Tag>,
      );
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote key={`quote-${index}`} className="border-l-4 border-strong-border bg-button/10 px-5 py-4 text-secondary">
          {quote.map((item, itemIndex) => (
            <p key={`${item}-${itemIndex}`} className="leading-8">{renderInline(item)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    if (/^-\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const ordered = /^\d+\.\s+/.test(line);
      const items = [];
      const itemPattern = ordered ? /^\d+\.\s+/ : /^-\s+/;
      while (index < lines.length && itemPattern.test(lines[index])) {
        items.push(lines[index].replace(itemPattern, ""));
        index += 1;
      }
      const Tag = ordered ? "ol" : "ul";
      blocks.push(
        <Tag key={`list-${index}`} className={`${ordered ? "list-decimal" : "list-disc"} space-y-2 pl-6 text-secondary`}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`} className="leading-8">{renderInline(item)}</li>
          ))}
        </Tag>,
      );
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,3}\s/.test(lines[index]) &&
      !lines[index].startsWith("```") &&
      !/^>\s?/.test(lines[index]) &&
      !/^-\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }

    blocks.push(
      <p key={`paragraph-${index}`} className="leading-8 text-secondary">
        {renderInline(paragraph.join(" "))}
      </p>,
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="grid min-h-[28rem] place-items-center rounded-b-[1.5rem] bg-background/25 px-6 text-center text-secondary">
        <div>
          <FileText className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-4 text-lg font-semibold text-primary">Preview will render here</p>
          <p className="mt-2 max-w-md text-sm leading-6">
            Use markdown headings, lists, quotes, and code blocks to structure source material for future AI study tools.
          </p>
        </div>
      </div>
    );
  }

  return <div className="grid min-h-[28rem] content-start gap-5 px-5 py-6 sm:px-7">{blocks}</div>;
}

function StatusPill({ status, saving }) {
  if (saving) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs font-semibold text-warning">
        <Clock className="h-3.5 w-3.5" />
        Saving
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Saved
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 text-xs font-semibold text-muted">
      <PenLine className="h-3.5 w-3.5" />
      Draft
    </span>
  );
}

function RecentNotesLibrary({ loading, notes, selectedNoteId, onSelect }) {
  return (
    <CommandCard className="p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.22em] text-muted">
            Library
          </p>
          <h2 className="mt-3 text-lg font-semibold leading-tight text-primary">
            Recent Notes
          </h2>
        </div>
        <div
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-strong-border/80 bg-button/15 text-primary shadow-lg shadow-button/15 lg:h-14 lg:w-14"
        >
          <FileText className="h-4 w-4 lg:h-6 lg:w-6" />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border/80 bg-background/55 p-5 text-sm text-secondary">
          Loading notes...
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/90 bg-background/55 p-6">
          <FileText className="h-8 w-8 text-muted" />
          <p className="mt-4 text-base font-semibold text-primary">No saved notes yet</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
            Save a note to build a searchable study library with markdown context, subject links, and source attachments.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => {
            const stats = getNoteAttachmentStats(note);

            return (
              <button
                key={note.id}
                type="button"
                onClick={() => onSelect(note)}
                className={`rounded-2xl border p-4 transition duration-200 ${
                  note.id === selectedNoteId
                    ? "border-strong-border/90 bg-button/15 shadow-[0_0_24px_hsl(var(--button)/0.12)]"
                    : "border-border/80 bg-background/60 hover:border-strong-border/80 hover:bg-card-hover/80"
                } text-left`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-base font-semibold leading-tight text-primary">
                      {note.title}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                      <span className="rounded-full border border-border/80 bg-card/80 px-3 py-1">
                        {note.subjects?.name ?? "Unlinked"}
                      </span>
                      <span className="rounded-full border border-border/80 bg-card/80 px-3 py-1">
                        Saved {formatUpdated(note)}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted" />
                </div>

                <div className="mt-4 grid gap-2 text-xs text-secondary sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 px-3 py-2">
                    <span>Attachments</span>
                    <span className="font-semibold text-primary">{stats.count}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 px-3 py-2">
                    <span>Markdown</span>
                    <span className="font-semibold text-primary">{stats.hasMarkdown ? "Yes" : "No"}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1">
                    <FileText className="h-3.5 w-3.5" />
                    {stats.pdfCount} PDF
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1">
                    <Image className="h-3.5 w-3.5" />
                    {stats.imageCount} Image
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </CommandCard>
  );
}

function NotesHeader({
  draft,
  subjects,
  selectedNote,
  selectedSubject,
  saving,
  saveStatus,
  onChangeDraft,
  onCancel,
  onDelete,
  onSave,
}) {
  return (
    <CommandCard className="overflow-hidden p-0 shadow-2xl shadow-black/25">
      <div className="relative overflow-hidden border-b border-border/80 bg-[radial-gradient(circle_at_top_right,hsl(var(--button)/0.16),transparent_32%)] p-4 sm:p-5 lg:p-6">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-strong-border/80 to-transparent" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={saveStatus} saving={saving} />
              <span className="rounded-full border border-border/80 bg-background/65 px-3 py-1.5 text-xs font-semibold text-secondary">
                {selectedSubject?.name ?? "No subject selected"}
              </span>
            </div>
            <label htmlFor="note-title" className="sr-only">Note Title</label>
            <input
              id="note-title"
              type="text"
              value={draft.title}
              onChange={(event) => onChangeDraft({ title: event.target.value })}
              placeholder="Note Title"
              className="mt-3 min-h-12 w-full max-w-4xl rounded-2xl border border-border/70 bg-background/45 px-4 py-3 text-[clamp(1.35rem,2.4vw,2.15rem)] font-bold leading-tight text-primary outline-none transition duration-200 placeholder:text-muted focus:border-strong-border focus:bg-background/70 focus:shadow-[0_0_24px_hsl(var(--button)/0.12)] sm:min-h-14 sm:px-5"
            />
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border/80 bg-background/65 px-4 py-2 text-sm font-semibold text-secondary transition duration-200 hover:-translate-y-0.5 hover:border-strong-border hover:text-primary"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            {selectedNote && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border/80 bg-background/65 px-4 py-2 text-sm font-semibold text-secondary transition duration-200 hover:-translate-y-0.5 hover:border-danger hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-strong-border/90 bg-button px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-button/20 transition duration-200 hover:-translate-y-0.5 hover:bg-button-hover hover:shadow-button/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_13rem]">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.22em] text-muted">Subject</span>
            <div className="relative">
              <select
                value={draft.subjectId}
                onChange={(event) => onChangeDraft({ subjectId: event.target.value })}
                className="min-h-12 w-full appearance-none rounded-2xl border border-border/80 bg-background/65 py-3 pl-4 pr-14 text-sm font-semibold text-primary outline-none transition duration-200 focus:border-strong-border"
              >
                <option value="" disabled>Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-5 top-1/2 h-2.5 w-2.5 -translate-y-[60%] rotate-45 border-b-2 border-r-2 border-secondary" />
            </div>
          </label>

          <div className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.22em] text-muted">Intake</span>
            <div className="flex min-h-12 items-center rounded-2xl border border-border/80 bg-background/65 px-4 py-3">
              <p className="text-sm font-semibold text-primary">
                {selectedNote ? "Saved note" : "Unsaved draft"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </CommandCard>
  );
}

function MarkdownToolbar({ onAction }) {
  const groups = [
    toolbarActions.slice(0, 3),
    toolbarActions.slice(3, 5),
    toolbarActions.slice(5),
  ];

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
      {groups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="flex rounded-2xl border border-border/80 bg-background/55 p-1"
        >
          {group.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => onAction(action)}
              title={action.label}
              aria-label={action.label}
              className="grid h-9 w-9 place-items-center rounded-xl text-secondary transition duration-200 hover:bg-card-hover hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-strong-border sm:h-10 sm:w-10"
            >
              <action.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function MarkdownEditor({ content, mode, textareaRef, onChange, onModeChange, onToolbarAction }) {
  return (
    <CommandCard className="overflow-hidden p-0 shadow-2xl shadow-black/30">
      <div className="border-b border-border/80 bg-card/80 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-border/80 bg-background/65 text-secondary">
              <PenLine className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary">Markdown Workspace</p>
              <p className="text-xs text-muted">Structure notes for human review and future AI extraction.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 rounded-2xl border border-border/80 bg-background/60 p-1 text-sm font-semibold">
            {["write", "preview"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onModeChange(item)}
                className={`min-h-10 rounded-xl px-4 py-2 capitalize transition duration-200 ${
                  mode === item ? "bg-button text-white shadow-md shadow-button/20" : "text-secondary hover:bg-card-hover hover:text-primary"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto pb-1">
          <MarkdownToolbar onAction={onToolbarAction} />
        </div>
      </div>

      {mode === "write" ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => onChange(event.target.value)}
          placeholder={"Start writing with markdown...\n\n## Core idea\n- What happened?\n- Why does it matter?\n- What should I memorize?"}
          className="min-h-[30rem] w-full resize-y bg-background/30 px-5 pb-8 pt-10 font-dm text-base leading-8 text-primary outline-none transition placeholder:text-muted focus:bg-background/40 sm:min-h-[38rem] sm:px-7 sm:pt-12 xl:min-h-[44rem]"
        />
      ) : (
        <MarkdownPreview content={content} />
      )}
    </CommandCard>
  );
}

function AttachmentCard({ attachment, previewUrl, onOpen, onDelete, deleting }) {
  const isImage = attachment.file_type?.startsWith("image/");

  return (
    <div className="rounded-2xl border border-border/80 bg-background/60 p-3 transition duration-200 hover:border-strong-border/70 hover:bg-card-hover/70">
      <div className="flex gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border/80 bg-card/90">
          {isImage && previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : attachment.file_type === "application/pdf" ? (
            <FileText className="h-7 w-7 text-danger" />
          ) : (
            <File className="h-7 w-7 text-secondary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary">{attachment.file_name}</p>
          <p className="mt-1 text-xs text-muted">
            {fileKind(attachment.file_type)} | {formatFileSize(attachment.file_size)}
          </p>
          <p className="mt-1 text-xs text-muted">Uploaded {formatUpdated(attachment)}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onOpen(attachment)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/90 px-3 py-2 text-xs font-semibold text-secondary transition duration-200 hover:border-strong-border hover:text-primary"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open
        </button>
        <button
          type="button"
          onClick={() => onDelete(attachment)}
          disabled={deleting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/90 px-3 py-2 text-xs font-semibold text-secondary transition duration-200 hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" />
          Remove
        </button>
      </div>
    </div>
  );
}

function AttachmentUploader({
  attachments,
  previewUrls,
  uploading,
  deletingId,
  onUpload,
  onOpen,
  onDelete,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(fileList) {
    const files = Array.from(fileList ?? []);
    if (files.length) onUpload(files);
  }

  return (
    <CommandCard className="p-4 sm:p-5">
      <CardHeader eyebrow="Sources" title="Attachments" icon={Paperclip} />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-2xl border border-dashed p-5 text-center transition duration-200 sm:p-6 ${
          dragging ? "border-strong-border bg-button/15" : "border-border/90 bg-background/55 hover:border-strong-border/70 hover:bg-background/70"
        }`}
      >
        <UploadCloud className="mx-auto h-8 w-8 text-secondary" />
        <p className="mt-3 text-sm font-semibold text-primary">Drop PDFs or images</p>
        <p className="mt-2 text-xs leading-5 text-muted">PDF, JPG, PNG, and WEBP up to {MAX_ATTACHMENT_SIZE_LABEL}.</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-strong-border/90 bg-button px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-button/15 transition duration-200 hover:-translate-y-0.5 hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {uploading ? "Uploading..." : "Upload file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
          className="hidden"
        />
      </div>

      <div className="mt-4 grid gap-3">
        {attachments.length === 0 ? (
          <div className="rounded-2xl border border-border/80 bg-background/55 p-4 text-sm leading-6 text-secondary">
            Attach lecture PDFs, whiteboard photos, textbook screenshots, or diagrams. These records are ready for later OCR, summarization, flashcards, and quiz generation.
          </div>
        ) : (
          attachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              previewUrl={previewUrls[attachment.id]}
              onOpen={onOpen}
              onDelete={onDelete}
              deleting={deletingId === attachment.id}
            />
          ))
        )}
      </div>
    </CommandCard>
  );
}

function NoteSavePanel({ content, attachments }) {
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const imageCount = attachments.filter((item) => item.file_type?.startsWith("image/")).length;
  const pdfCount = attachments.filter((item) => item.file_type === "application/pdf").length;

  return (
    <CommandCard className="p-4 sm:p-5">
      <CardHeader eyebrow="AI Ready" title="Study Pipeline" icon={Sparkles} />
      <div className="grid gap-3 text-sm text-secondary">
        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 p-4">
          <span>Markdown words</span>
          <span className="font-semibold text-primary">{wordCount}</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 p-4">
          <span>PDF sources</span>
          <span className="font-semibold text-primary">{pdfCount}</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-background/60 p-4">
          <span>Image sources</span>
          <span className="font-semibold text-primary">{imageCount}</span>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-strong-border/60 bg-button/10 p-4 text-sm leading-6 text-secondary shadow-[0_0_24px_hsl(var(--button)/0.08)]">
        Future actions can read the note content plus attachment metadata from one clean context payload.
      </div>
    </CommandCard>
  );
}

export default function Notes() {
  const { user } = useAuth();
  const textareaRef = useRef(null);
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [attachments, setAttachments] = useState([]);
  const [previewUrls, setPreviewUrls] = useState({});
  const [editorMode, setEditorMode] = useState("write");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("draft");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [workspaceVisible, setWorkspaceVisible] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        setLoading(true);
        const [subjectRows, noteRows] = await Promise.all([
          getSubjects(user.id),
          getNotes(user.id),
        ]);

        setSubjects(subjectRows ?? []);
        setNotes(noteRows ?? []);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedNoteId) {
      return;
    }

    async function loadAttachments() {
      try {
        const rows = await getNoteAttachments(selectedNoteId, user.id);
        setAttachments(rows);

        const imageRows = rows.filter((item) => item.file_type?.startsWith("image/"));
        const entries = await Promise.all(
          imageRows.map(async (item) => [item.id, await createAttachmentSignedUrl(item.file_path)]),
        );
        setPreviewUrls(Object.fromEntries(entries));
      } catch (attachmentError) {
        setError(attachmentError.message);
      }
    }

    loadAttachments();
  }, [selectedNoteId, user]);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === draft.subjectId) ?? null,
    [subjects, draft.subjectId],
  );

  // Future AI jobs can use this shape to pass text plus source file metadata to OCR,
  // summarization, flashcard, quiz, weak-topic, or study-plan pipelines.
  const aiReadyContext = useMemo(
    () => ({
      noteId: selectedNoteId,
      title: draft.title,
      subject: selectedSubject?.name ?? "",
      content: draft.content,
      attachments: attachments.map(({ id, file_name, file_type, file_size, file_path }) => ({
        id,
        fileName: file_name,
        fileType: file_type,
        fileSize: file_size,
        filePath: file_path,
      })),
    }),
    [attachments, draft.content, draft.title, selectedNoteId, selectedSubject?.name],
  );

  function updateDraft(updates) {
    setDraft((current) => ({ ...current, ...updates }));
    setSaveStatus("draft");
    setNotice("");
  }

  function selectNoteDraft(note) {
    setSelectedNoteId(note.id);
    setDraft({
      title: note.title ?? "",
      subjectId: note.subject_id ?? "",
      content: note.content ?? "",
    });
    setAttachments([]);
    setPreviewUrls({});
    setSaveStatus("saved");
    setError("");
    setNotice("");
    setEditorMode("write");
    setWorkspaceVisible(true);
  }

  function startNewNote() {
    setSelectedNoteId(null);
    setDraft(emptyDraft);
    setAttachments([]);
    setPreviewUrls({});
    setSaveStatus("draft");
    setError("");
    setNotice("");
    setEditorMode("write");
    setWorkspaceVisible(true);
  }

  function cancelWorkspace() {
    setSelectedNoteId(null);
    setDraft(emptyDraft);
    setAttachments([]);
    setPreviewUrls({});
    setSaveStatus("draft");
    setError("");
    setNotice("");
    setEditorMode("write");
    setWorkspaceVisible(false);
  }

  function resetAfterSuccessfulSave(savedNote) {
    setSelectedNoteId(null);
    setDraft(emptyDraft);
    setAttachments([]);
    setPreviewUrls({});
    setSaveStatus("draft");
    setError("");
    setNotice(`Saved "${savedNote.title}". Ready for a new note.`);
    setEditorMode("write");
    setWorkspaceVisible(false);
  }

  async function persistNote() {
    if (!user || !draft.title.trim() || !draft.subjectId) {
      throw new Error("Add a title and subject before saving.");
    }

    const payload = {
      userId: user.id,
      title: draft.title.trim(),
      subjectId: draft.subjectId,
      content: draft.content.trim(),
    };

    if (selectedNoteId) {
      const updated = await updateNote(selectedNoteId, payload);
      setNotes((current) =>
        current.map((note) => (note.id === selectedNoteId ? updated : note)),
      );
      return updated;
    }

    const created = await createNote(payload);
    setNotes((current) => [created, ...current]);
    setSelectedNoteId(created.id);
    return created;
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      const saved = await persistNote();
      resetAfterSuccessfulSave(saved);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedNote) return;
    const confirmed = window.confirm(`Delete "${selectedNote.title}"?`);
    if (!confirmed) return;

    try {
      setError("");
      await deleteNote(selectedNote.id, user.id);
      const remaining = notes.filter((note) => note.id !== selectedNote.id);
      setNotes(remaining);

      setSelectedNoteId(null);
      setDraft(emptyDraft);
      setAttachments([]);
      setPreviewUrls({});
      setSaveStatus("draft");
      setWorkspaceVisible(false);
      setNotice("Note deleted.");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function insertMarkdown(action) {
    const textarea = textareaRef.current;
    const current = draft.content;
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? current.length;
    const selected = current.slice(start, end) || action.fallback;
    const next = `${current.slice(0, start)}${action.before}${selected}${action.after}${current.slice(end)}`;
    updateDraft({ content: next });

    window.requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = start + action.before.length + selected.length + action.after.length;
      textarea?.setSelectionRange(cursor, cursor);
    });
  }

  async function handleUpload(files) {
    for (const file of files) {
      try {
        validateNoteAttachment(file);
      } catch (validationError) {
        setError(validationError.message);
        setNotice("");
        return;
      }
    }

    try {
      setUploading(true);
      setError("");
      setNotice("");

      const targetNote = selectedNoteId && selectedNote
        ? selectedNote
        : await persistNote();

      const uploadedRows = [];
      for (const file of files) {
        uploadedRows.push(
          await uploadNoteAttachment({
            file,
            noteId: targetNote.id,
            userId: user.id,
          }),
        );
      }

      setAttachments((current) => [...uploadedRows, ...current]);
      setNotes((current) =>
        current.map((note) =>
          note.id === targetNote.id
            ? {
                ...note,
                note_attachments: [...uploadedRows, ...(note.note_attachments ?? [])],
              }
            : note,
        ),
      );
      const imageRows = uploadedRows.filter((item) => item.file_type?.startsWith("image/"));
      const entries = await Promise.all(
        imageRows.map(async (item) => [item.id, await createAttachmentSignedUrl(item.file_path)]),
      );
      setPreviewUrls((current) => ({ ...current, ...Object.fromEntries(entries) }));
      setSaveStatus("saved");
      setNotice(`${uploadedRows.length} file${uploadedRows.length === 1 ? "" : "s"} attached.`);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleOpenAttachment(attachment) {
    try {
      const signedUrl = await createAttachmentSignedUrl(attachment.file_path);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (openError) {
      setError(openError.message);
    }
  }

  async function handleDeleteAttachment(attachment) {
    try {
      setDeletingAttachmentId(attachment.id);
      setError("");
      await deleteNoteAttachment(attachment, user.id);
      setAttachments((current) => current.filter((item) => item.id !== attachment.id));
      setNotes((current) =>
        current.map((note) =>
          note.id === selectedNoteId
            ? {
                ...note,
                note_attachments: (note.note_attachments ?? []).filter((item) => item.id !== attachment.id),
              }
            : note,
        ),
      );
      setPreviewUrls((current) => {
        const next = { ...current };
        delete next[attachment.id];
        return next;
      });
      setNotice("Attachment removed.");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingAttachmentId(null);
    }
  }

  return (
    <WarRoomShell
      eyebrow="Knowledge Capture"
      title="AI Study War Room"
      description="Write markdown notes, attach source files, and prepare clean study context for future AI summaries, flashcards, quizzes, and weak-topic detection."
      action={
        <AddButton onClick={startNewNote} disabled={subjects.length === 0}>
          New Note
        </AddButton>
      }
    >
      <div className="grid gap-6">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/15 p-4 text-sm text-primary">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <span>{error}</span>
          </div>
        )}

        {notice && !error && (
          <div className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/15 p-4 text-sm text-primary">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>{notice}</span>
          </div>
        )}

        {subjects.length === 0 && !loading ? (
          <CommandCard>
            <CardHeader eyebrow="Setup Required" title="Create a Subject First" icon={BookOpen} />
            <p className="max-w-2xl leading-7 text-secondary">
              Notes are linked to subjects in your workspace. Create a subject before adding your first note.
            </p>
          </CommandCard>
        ) : (
          <div className="grid gap-6">
            <RecentNotesLibrary
              loading={loading}
              notes={notes}
              selectedNoteId={selectedNoteId}
              onSelect={selectNoteDraft}
            />

            <AnimatePresence initial={false}>
              {workspaceVisible && (
                <motion.div
                  key="notes-workspace"
                  variants={workspaceVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,23rem)] 2xl:grid-cols-[minmax(0,1fr)_24rem]"
                >
                  <section className="grid min-w-0 gap-6">
                    <NotesHeader
                      draft={draft}
                      subjects={subjects}
                      selectedNote={selectedNote}
                      selectedSubject={selectedSubject}
                      saving={saving}
                      saveStatus={saveStatus}
                      onChangeDraft={updateDraft}
                      onCancel={cancelWorkspace}
                      onDelete={handleDelete}
                      onSave={handleSave}
                    />

                    <MarkdownEditor
                      content={draft.content}
                      mode={editorMode}
                      textareaRef={textareaRef}
                      onChange={(content) => updateDraft({ content })}
                      onModeChange={setEditorMode}
                      onToolbarAction={insertMarkdown}
                    />
                  </section>

                  <aside className="grid min-w-0 gap-5 xl:sticky xl:top-4 xl:self-start">
                    <AttachmentUploader
                      attachments={attachments}
                      previewUrls={previewUrls}
                      uploading={uploading}
                      deletingId={deletingAttachmentId}
                      onUpload={handleUpload}
                      onOpen={handleOpenAttachment}
                      onDelete={handleDeleteAttachment}
                    />

                    <NoteSavePanel content={draft.content} attachments={attachments} aiReadyContext={aiReadyContext} />
                  </aside>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </WarRoomShell>
  );
}
