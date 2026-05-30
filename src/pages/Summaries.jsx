import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  CardHeader,
  CommandCard,
  WarRoomShell,
} from "../components/WarRoomLayout";
import { useAuth } from "../hooks/useAuth";
import { getSummarizedNotes } from "../services/notesService";

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

function SummaryCard({ note }) {
  return (
    <article className="rounded-[1.25rem] border border-border bg-background/65 p-4 shadow-lg shadow-black/15 transition hover:border-strong-border/70 hover:bg-card-hover/70 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {note.subjects?.name ?? "Unlinked"}
          </p>
          <h3 className="mt-2 break-word text-xl font-bold leading-tight text-primary">
            {note.title}
          </h3>
        </div>
        <Link
          to="/notes"
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 text-sm font-semibold text-secondary transition hover:border-strong-border hover:text-primary"
        >
          Open Notes
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 rounded-2xl border border-strong-border/50 bg-button/10 p-4 text-sm leading-7 text-secondary">
        <p className="whitespace-pre-line">{note.ai_summary}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5">
          <CalendarClock className="h-3.5 w-3.5" />
          {formatGenerated(note.ai_summary_generated_at)}
        </span>
        {note.ai_summary_model && (
          <span className="rounded-full border border-border bg-card/80 px-3 py-1.5">
            {note.ai_summary_model}
          </span>
        )}
        {note.ai_summary_status && (
          <span className="rounded-full border border-success/35 bg-success/10 px-3 py-1.5 font-semibold text-success">
            {note.ai_summary_status}
          </span>
        )}
      </div>
    </article>
  );
}

export default function Summaries() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
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
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadSummaries();
  }, [user]);

  const notesBySubject = useMemo(() => {
    return notes.reduce((groups, note) => {
      const subjectName = note.subjects?.name ?? "Unlinked";
      groups[subjectName] = groups[subjectName] ?? [];
      groups[subjectName].push(note);
      return groups;
    }, {});
  }, [notes]);

  const subjectNames = Object.keys(notesBySubject).sort((a, b) => a.localeCompare(b));

  return (
    <WarRoomShell
      eyebrow="AI Study Layer"
      title="Summaries"
      description="Review the AI summaries generated from your saved notes, grouped by subject for quick exam prep."
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
          subjectNames.map((subjectName) => (
            <CommandCard key={subjectName}>
              <CardHeader eyebrow="Subject" title={subjectName} icon={Sparkles} />
              <div className="grid gap-4">
                {notesBySubject[subjectName].map((note) => (
                  <SummaryCard key={note.id} note={note} />
                ))}
              </div>
            </CommandCard>
          ))
        )}
      </div>
    </WarRoomShell>
  );
}
