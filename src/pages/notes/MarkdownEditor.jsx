import {
  Bold,
  Code,
  FileText,
  Heading,
  Italic,
  List,
  ListOrdered,
  PenLine,
  Quote,
} from "lucide-react";
import AIContentRenderer from "../../components/AIContentRenderer";
import { CommandCard } from "../../components/WarRoomLayout";

const toolbarActions = [
  { label: "Bold", icon: Bold, before: "**", after: "**", fallback: "important point" },
  { label: "Italic", icon: Italic, before: "*", after: "*", fallback: "emphasis" },
  { label: "Heading", icon: Heading, before: "## ", after: "", fallback: "Key concept" },
  { label: "Bullet list", icon: List, before: "- ", after: "", fallback: "Evidence or example" },
  { label: "Numbered list", icon: ListOrdered, before: "1. ", after: "", fallback: "First step" },
  { label: "Code block", icon: Code, before: "```\n", after: "\n```", fallback: "formula or snippet" },
  { label: "Quote", icon: Quote, before: "> ", after: "", fallback: "Memorable definition" },
];

function MarkdownPreview({ content }) {
  if (!content.trim()) {
    return (
      <div className="grid min-h-112 place-items-center rounded-b-3xl bg-background/25 px-6 text-center text-secondary">
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

  return (
    <div className="min-h-112 px-5 py-6 sm:px-7">
      <AIContentRenderer>{content}</AIContentRenderer>
    </div>
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
              className="grid h-9 w-9 place-items-center rounded-xl text-secondary transition duration-200 hover:bg-card-hover hover:text-primary focus-visible:outline-2 focus-visible:outline-strong-border sm:h-10 sm:w-10"
            >
              <action.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function MarkdownEditor({ content, mode, textareaRef, onChange, onModeChange, onToolbarAction }) {
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
          className="min-h-120 w-full resize-y bg-background/30 px-5 pb-8 pt-10 font-dm text-base leading-8 text-primary outline-none transition placeholder:text-muted focus:bg-background/40 sm:min-h-152 sm:px-7 sm:pt-12 xl:min-h-176"
        />
      ) : (
        <MarkdownPreview content={content} />
      )}
    </CommandCard>
  );
}
