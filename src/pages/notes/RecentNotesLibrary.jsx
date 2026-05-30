import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Image,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { CommandCard } from "../../components/WarRoomLayout";
import { formatUpdated, getNoteAttachmentStats } from "./noteUtils";

function SummaryPreview({ note }) {
  if (note.ai_summary_status === "failed") {
    return (
      <div className="mt-4 rounded-2xl border border-danger/35 bg-danger/10 p-3 text-sm leading-6 text-secondary">
        <span className="font-semibold text-danger">Summary failed:</span>{" "}
        {note.ai_summary_error ?? "Try again when the note is ready."}
      </div>
    );
  }

  if (!note.ai_summary) return null;

  return (
    <div className="mt-4 rounded-2xl border border-strong-border/50 bg-button/10 p-3 text-sm leading-6 text-secondary">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        <Sparkles className="h-3.5 w-3.5 text-button-hover" />
        AI Summary
      </div>
      <p className="line-clamp-5 whitespace-pre-line">{note.ai_summary}</p>
    </div>
  );
}

export default function RecentNotesLibrary({
  loading,
  notes,
  selectedNoteId,
  summarizingNoteId,
  onSelect,
  onSummarize,
}) {
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
              <div
                key={note.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(note)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(note);
                  }
                }}
                className={`rounded-2xl border p-4 transition duration-200 ${
                  note.id === selectedNoteId
                    ? "border-strong-border/90 bg-button/15 shadow-[0_0_24px_hsl(var(--button)/0.12)]"
                    : "border-border/80 bg-background/60 hover:border-strong-border/80 hover:bg-card-hover/80"
                } group cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-strong-border`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-base font-semibold leading-tight text-primary transition group-hover:text-button-hover">
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
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(note);
                    }}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border/70 bg-card/70 text-muted transition hover:border-strong-border hover:text-primary"
                    aria-label={`Open ${note.title}`}
                    title="Open note"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
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

                <SummaryPreview note={note} />

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSummarize(note);
                    }}
                    disabled={summarizingNoteId === note.id}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-strong-border/80 bg-button/90 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-button/15 transition hover:-translate-y-0.5 hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {summarizingNoteId === note.id ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {summarizingNoteId === note.id
                      ? "Summarizing..."
                      : note.ai_summary
                        ? "Regenerate"
                        : "Summarize"}
                  </button>
                  {note.ai_summary_status === "completed" && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-success/35 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Saved
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CommandCard>
  );
}
