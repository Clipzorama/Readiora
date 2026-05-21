import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  FileText,
  PenLine,
  Save,
  Trash2,
} from "lucide-react";
import {
  AddButton,
  CardHeader,
  CommandCard,
  WarRoomShell,
} from "../components/WarRoomLayout";
import { useAuth } from "../hooks/useAuth";
import { getSubjects } from "../services/subjectsService";
import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
} from "../services/notesService";

const emptyDraft = {
  title: "",
  subjectId: "",
  content: "",
};

function formatUpdated(note) {
  const value = note.updated_at ?? note.created_at;
  if (!value) return "No timestamp";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function Notes() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

        if (noteRows?.length) {
          const firstNote = noteRows[0];
          setSelectedNoteId(firstNote.id);
          setDraft({
            title: firstNote.title,
            subjectId: firstNote.subject_id,
            content: firstNote.content,
          });
        }
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === draft.subjectId) ?? null,
    [subjects, draft.subjectId],
  );

  function startNewNote() {
    setSelectedNoteId(null);
    setDraft(emptyDraft);
    setError("");
  }

  function selectNote(note) {
    setSelectedNoteId(note.id);
    setDraft({
      title: note.title,
      subjectId: note.subject_id,
      content: note.content,
    });
    setError("");
  }

  async function handleSave() {
    if (!user || !draft.title.trim() || !draft.subjectId || !draft.content.trim()) {
      setError("Add a title, subject, and note content before saving.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (selectedNoteId) {
        const updated = await updateNote(selectedNoteId, {
          userId: user.id,
          title: draft.title.trim(),
          subjectId: draft.subjectId,
          content: draft.content.trim(),
        });
        setNotes((current) =>
          current.map((note) => (note.id === selectedNoteId ? updated : note)),
        );
      } else {
        const created = await createNote({
          userId: user.id,
          subjectId: draft.subjectId,
          title: draft.title.trim(),
          content: draft.content.trim(),
        });
        setNotes((current) => [created, ...current]);
        setSelectedNoteId(null);
        setDraft(emptyDraft);
      }
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

      if (remaining.length) {
        selectNote(remaining[0]);
      } else {
        setSelectedNoteId(null);
        setDraft(emptyDraft);
      }
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <WarRoomShell
      eyebrow="Knowledge Capture"
      title="Notes"
      description="Write, paste, and refine study notes connected to your own subjects."
      action={
        <AddButton onClick={startNewNote} disabled={subjects.length === 0}>
          New Note
        </AddButton>
      }
    >
      <div className="grid gap-6">
        {error && (
          <div className="rounded-2xl border border-danger/40 bg-danger/15 p-4 text-sm text-primary">
            {error}
          </div>
        )}

        {subjects.length === 0 && !loading ? (
          <CommandCard>
            <CardHeader eyebrow="Setup Required" title="Create a Subject First" icon={BookOpen} />
            <p className="max-w-2xl leading-7 text-secondary">
              Notes are linked to subjects in your workspace. Create a subject
              before adding your first note.
            </p>
          </CommandCard>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.45fr)_minmax(280px,0.82fr)]">
            <CommandCard className="xl:sticky xl:top-4 xl:self-start">
              <CardHeader eyebrow="Library" title="Recent Notes" icon={FileText} />
              {loading ? (
                <p className="text-secondary">Loading notes...</p>
              ) : notes.length === 0 ? (
                <p className="leading-7 text-secondary">
                  No notes yet. Start a new note to save real study material.
                </p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => selectNote(note)}
                      className={`w-full rounded-[1.25rem] border p-5 text-left transition ${
                        note.id === selectedNoteId
                          ? "border-strong-border bg-button/15"
                          : "border-border bg-background/70 hover:border-strong-border"
                      }`}
                    >
                      <p className="break-words text-lg font-semibold leading-tight">
                        {note.title}
                      </p>
                      <p className="mt-2 text-sm text-secondary">
                        {note.subjects?.name ?? "Unlinked subject"}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-border bg-card px-3 py-1 text-muted">
                          Updated {formatUpdated(note)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CommandCard>

            <section className="grid gap-6">
              <CommandCard>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.78fr)]">
                  <label className="grid gap-3">
                    <span className="text-xs uppercase tracking-[0.22em] text-muted">
                      Note Title
                    </span>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(event) =>
                        setDraft({ ...draft, title: event.target.value })
                      }
                      placeholder="Untitled note"
                      className="min-h-16 w-full rounded-[1.35rem] border border-border bg-background/70 px-5 py-4 text-2xl font-bold leading-tight text-primary outline-none transition placeholder:text-muted focus:border-strong-border sm:text-3xl"
                    />
                  </label>
                  <label className="grid gap-3">
                    <span className="text-xs uppercase tracking-[0.22em] text-muted">
                      Subject
                    </span>
                    <div className="relative">
                      <select
                        value={draft.subjectId}
                        onChange={(event) =>
                          setDraft({ ...draft, subjectId: event.target.value })
                        }
                        className="min-h-16 w-full appearance-none rounded-[1.35rem] border border-border bg-background/70 px-5 py-4 pr-12 text-lg font-semibold text-primary outline-none transition focus:border-strong-border"
                      >
                        <option value="" disabled>
                          Select subject
                        </option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-secondary" />
                    </div>
                  </label>
                </div>
              </CommandCard>

              <CommandCard className="p-0">
                <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-background/70">
                      <PenLine className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Markdown editor</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedNote && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background/70 px-4 py-2 text-sm font-semibold text-secondary transition hover:border-danger hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-4 py-2 text-sm font-semibold text-white transition hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>

                <textarea
                  value={draft.content}
                  onChange={(event) =>
                    setDraft({ ...draft, content: event.target.value })
                  }
                  placeholder="Start writing your note..."
                  className="min-h-[24rem] w-full resize-y bg-transparent px-5 py-6 font-dm text-base leading-8 text-primary outline-none placeholder:text-muted sm:min-h-[34rem] sm:px-7"
                />
              </CommandCard>
            </section>

            <aside className="grid gap-6 xl:sticky xl:top-4 xl:self-start">
              <CommandCard>
                <CardHeader eyebrow="Save Target" title="Subject Link" icon={BookOpen} />
                <div className="rounded-[1.25rem] border border-border bg-background/70 p-5">
                  <p className="break-words text-xl font-bold leading-tight">
                    {selectedSubject?.name ?? "No subject selected"}
                  </p>
                  <p className="mt-4 text-base leading-7 text-secondary">
                    This note will be saved securely to your account and linked
                    to the selected subject.
                  </p>
                </div>
              </CommandCard>

              <CommandCard>
                <CardHeader eyebrow="Workspace" title="Empty Systems" icon={FileText} />
                <div className="grid gap-3 text-sm text-secondary">
                  <p className="rounded-[1.25rem] border border-border bg-background/70 p-5">
                    AI summaries: 0
                  </p>
                  <p className="rounded-[1.25rem] border border-border bg-background/70 p-5">
                    Flashcards generated: 0
                  </p>
                  <p className="rounded-[1.25rem] border border-border bg-background/70 p-5">
                    Quizzes generated: 0
                  </p>
                </div>
              </CommandCard>
            </aside>
          </div>
        )}
      </div>
    </WarRoomShell>
  );
}
