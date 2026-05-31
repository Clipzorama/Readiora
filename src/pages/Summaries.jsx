import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  ChevronDown,
  FileText,
  Layers3,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  CardHeader,
  CommandCard,
  WarRoomShell,
} from "../components/WarRoomLayout";
import AIContentRenderer from "../components/AIContentRenderer";
import { useAuth } from "../hooks/useAuth";
import { deleteNoteSummary, getSummarizedNotes } from "../services/notesService";

function formatGenerated(value) {
  if (!value) return "No generated date";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function groupSummaries(notes) {
  return notes.reduce((groups, note) => {
    const subjectName = note.subjects?.name ?? "Unlinked";
    groups[subjectName] = groups[subjectName] ?? [];
    groups[subjectName].push(note);
    return groups;
  }, {});
}

function SummaryPicker({
  notesBySubject,
  selectedNoteId,
  onSelect,
  open,
  onToggle,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const subjectNames = Object.keys(notesBySubject).sort((a, b) => a.localeCompare(b));
  const selectedNote = subjectNames
    .flatMap((subjectName) => notesBySubject[subjectName])
    .find((note) => note.id === selectedNoteId);
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredNotesBySubject = subjectNames.reduce((groups, subjectName) => {
    const matchingNotes = normalizedSearch
      ? notesBySubject[subjectName].filter((note) =>
          note.title?.toLowerCase().includes(normalizedSearch),
        )
      : notesBySubject[subjectName];

    if (matchingNotes.length > 0) {
      groups[subjectName] = matchingNotes;
    }

    return groups;
  }, {});
  const filteredSubjectNames = Object.keys(filteredNotesBySubject);

  return (
    <CommandCard className="overflow-visible p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <CardHeader eyebrow="Library" title="All Summaries" icon={Layers3} />

        <button
          type="button"
          onClick={onToggle}
          className="inline-flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-strong-border/80 bg-button/15 px-4 py-3 text-left text-sm font-semibold text-primary shadow-[0_0_24px_hsl(var(--button)/0.08)] transition hover:border-strong-border hover:bg-button/20 lg:w-[24rem]"
          aria-expanded={open}
        >
          <span className="min-w-0">
            <span className="block text-xs uppercase tracking-[0.18em] text-muted">
              Selected Summary
            </span>
            <span className="mt-1 block truncate">
              {selectedNote?.title ?? "Choose a summary"}
            </span>
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-button-hover transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-background/70 shadow-2xl shadow-black/25">
          <div className="flex items-center gap-3 border-b border-border/80 bg-card/60 px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-button-hover" />
            <label htmlFor="summary-search" className="sr-only">Search summaries by note name</label>
            <input
              id="summary-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search summaries by note name..."
              className="min-h-10 w-full bg-transparent text-sm font-medium text-primary outline-none placeholder:text-muted"
            />
          </div>

          <div className="max-h-[26rem] overflow-y-auto p-2">
            {filteredSubjectNames.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-card/50 p-5 text-sm leading-6 text-secondary">
                No summaries match "{searchTerm}".
              </div>
            ) : filteredSubjectNames.map((subjectName) => (
              <section key={subjectName} className="p-2">
                <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {subjectName}
                </p>
                <div className="mt-2 grid gap-2">
                  {filteredNotesBySubject[subjectName].map((note) => {
                    const selected = note.id === selectedNoteId;

                    return (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => onSelect(note.id)}
                        className={`group rounded-2xl border p-3 text-left transition ${
                          selected
                            ? "border-strong-border bg-button/20 shadow-[0_0_24px_hsl(var(--button)/0.12)]"
                            : "border-border/70 bg-card/60 hover:border-strong-border/70 hover:bg-card-hover/80"
                        }`}
                      >
                        <span className="block break-words text-sm font-semibold text-primary">
                          {note.title}
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarClock className="h-3.5 w-3.5 text-button-hover" />
                            {formatGenerated(note.ai_summary_generated_at)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </CommandCard>
  );
}

function ActiveSummary({ note }) {
  if (!note) return null;

  return (
    <CommandCard className="overflow-hidden p-0">
      <div className="border-b border-border/80 bg-[radial-gradient(circle_at_top_right,hsl(var(--button)/0.18),transparent_34%)] p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              {note.subjects?.name ?? "Unlinked"}
            </p>
            <h2 className="mt-3 break-words text-2xl font-bold leading-tight text-primary sm:text-3xl">
              {note.title}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5">
                <CalendarClock className="h-3.5 w-3.5 text-button-hover" />
                {formatGenerated(note.ai_summary_generated_at)}
              </span>
            </div>
          </div>

          <Link
            to="/notes"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-border bg-card/80 px-4 py-2 text-sm font-semibold text-secondary transition hover:border-strong-border hover:text-primary"
          >
            Open Notes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="p-5 sm:p-6 lg:p-7">
        <div className="rounded-2xl border border-strong-border/50 bg-button/10 p-4 text-sm leading-7 text-secondary shadow-[0_0_30px_hsl(var(--button)/0.08)] sm:p-5 sm:text-base sm:leading-8">
          <AIContentRenderer>{note.ai_summary}</AIContentRenderer>
        </div>
      </div>
    </CommandCard>
  );
}

export default function Summaries() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deletingSummaryId, setDeletingSummaryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadSummaries() {
      try {
        setLoading(true);
        setError("");
        const rows = await getSummarizedNotes(user.id);
        setNotes(rows ?? []);
        setSelectedNoteId((current) => current || rows?.[0]?.id || "");
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadSummaries();
  }, [user]);

  const notesBySubject = useMemo(() => groupSummaries(notes), [notes]);
  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? notes[0] ?? null,
    [notes, selectedNoteId],
  );

  function handleSelect(noteId) {
    setSelectedNoteId(noteId);
    setPickerOpen(false);
  }

  async function handleDeleteSummary(note) {
    if (!user || !note) return;

    const confirmed = window.confirm(`Delete the saved AI summary for "${note.title}"?`);
    if (!confirmed) return;

    try {
      setDeletingSummaryId(note.id);
      setError("");
      await deleteNoteSummary(note.id, user.id);

      const nextNotes = notes.filter((item) => item.id !== note.id);
      setNotes(nextNotes);
      setSelectedNoteId(nextNotes[0]?.id ?? "");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingSummaryId("");
    }
  }

  return (
    <WarRoomShell
      eyebrow="AI Study Layer"
      title="Summaries"
      description="Review one AI summary at a time, grouped by subject for quick exam prep."
    >
      <div className="grid gap-6">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/15 p-4 text-sm text-primary">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <CommandCard>
            <CardHeader eyebrow="Loading" title="Fetching Summaries" icon={Sparkles} />
            <p className="text-sm leading-6 text-secondary">Loading AI summaries...</p>
          </CommandCard>
        ) : notes.length === 0 ? (
          <CommandCard>
            <CardHeader eyebrow="No Summaries" title="Generate Your First Summary" icon={FileText} />
            <p className="max-w-2xl text-sm leading-7 text-secondary">
              Open Notes and click Summarize on a saved note. Generated summaries will appear here after they are saved.
            </p>
            <Link
              to="/notes"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-button/20 transition hover:bg-button-hover"
            >
              Go to Notes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CommandCard>
        ) : (
          <>
            <SummaryPicker
              notesBySubject={notesBySubject}
              selectedNoteId={selectedNote?.id}
              onSelect={handleSelect}
              open={pickerOpen}
              onToggle={() => setPickerOpen((current) => !current)}
            />
            <ActiveSummary note={selectedNote} />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleDeleteSummary(selectedNote)}
                disabled={deletingSummaryId === selectedNote?.id}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:-translate-y-0.5 hover:border-danger hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {deletingSummaryId === selectedNote?.id ? "Deleting..." : "Delete Summary"}
              </button>
            </div>
          </>
        )}
      </div>
    </WarRoomShell>
  );
}
