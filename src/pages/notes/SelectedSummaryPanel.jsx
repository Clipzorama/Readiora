import {
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import {
  CardHeader,
  CommandCard,
} from "../../components/WarRoomLayout";
import { formatUpdated } from "./noteUtils";

export default function SelectedSummaryPanel({ note, summarizing, onSummarize }) {
  if (!note) return null;

  return (
    <CommandCard className="p-4 sm:p-5">
      <CardHeader eyebrow="AI Summary" title="Study Summary" icon={Sparkles} />

      {note.ai_summary ? (
        <div className="rounded-2xl border border-strong-border/50 bg-button/10 p-4 text-sm leading-7 text-secondary">
          <p className="whitespace-pre-line">{note.ai_summary}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
            {note.ai_summary_model && (
              <span className="rounded-full border border-border bg-card/80 px-3 py-1">
                {note.ai_summary_model}
              </span>
            )}
            {note.ai_summary_generated_at && (
              <span className="rounded-full border border-border bg-card/80 px-3 py-1">
                Generated {formatUpdated({ updated_at: note.ai_summary_generated_at })}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-background/55 p-4 text-sm leading-6 text-secondary">
          Generate a compact study summary for this saved note when you are ready.
        </div>
      )}

      {note.ai_summary_status === "failed" && note.ai_summary_error && (
        <div className="mt-3 rounded-2xl border border-danger/35 bg-danger/10 p-3 text-sm leading-6 text-secondary">
          {note.ai_summary_error}
        </div>
      )}

      <button
        type="button"
        onClick={() => onSummarize(note)}
        disabled={summarizing}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-strong-border/90 bg-button px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-button/20 transition hover:-translate-y-0.5 hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {summarizing ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {summarizing ? "Summarizing..." : note.ai_summary ? "Regenerate Summary" : "Summarize Note"}
      </button>
    </CommandCard>
  );
}
