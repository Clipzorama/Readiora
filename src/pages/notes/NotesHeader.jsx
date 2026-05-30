import {
  CheckCircle2,
  Clock,
  PenLine,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { CommandCard } from "../../components/WarRoomLayout";

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

export default function NotesHeader({
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
              <span className="pointer-events-none absolute right-5 top-1/2 h-2.5 w-2.5 translate-y-[-60%] rotate-45 border-b-2 border-r-2 border-secondary" />
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
