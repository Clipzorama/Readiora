import { Sparkles } from "lucide-react";
import {
  CardHeader,
  CommandCard,
} from "../../components/WarRoomLayout";

export default function NoteSavePanel({ content, attachments }) {
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
