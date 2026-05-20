import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarClock,
  FileText,
  Layers3,
  MessageSquareText,
  Pencil,
  Target,
  Trash2,
  X,
} from "lucide-react";
import {
  AddButton,
  CardHeader,
  CommandCard,
  ProgressBar,
  WarRoomShell,
} from "../components/WarRoomLayout";
import { useAuth } from "../hooks/useAuth";
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from "../services/subjectsService";
import { deleteNotesBySubject, getNotes } from "../services/notesService";

const emptyForm = {
  name: "",
  description: "",
  examDate: "",
  color: "blue",
};

const accentByColor = {
  blue: "from-button/40 to-danger/20",
  red: "from-danger/35 to-button/20",
  green: "from-success/30 to-button/20",
  yellow: "from-warning/35 to-button/20",
};

function SubjectStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-button/20 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold">{value}</p>
        <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      </div>
    </div>
  );
}

function formatExamDate(value) {
  if (!value) return "No exam date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export default function Subjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
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
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const notesBySubject = useMemo(() => {
    return notes.reduce((counts, note) => {
      counts[note.subject_id] = (counts[note.subject_id] ?? 0) + 1;
      return counts;
    }, {});
  }, [notes]);

  const statSummary = [
    { label: "Active Subjects", value: subjects.length },
    { label: "Total Notes", value: notes.length },
    { label: "Flashcards", value: 0 },
    { label: "Quizzes", value: 0 },
  ];

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  }

  function openEditForm(subject) {
    setEditingId(subject.id);
    setForm({
      name: subject.name,
      description: subject.description ?? "",
      examDate: subject.exam_date ?? "",
      color: subject.color ?? "blue",
    });
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user || !form.name.trim()) return;

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        const updated = await updateSubject(editingId, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          examDate: form.examDate || null,
          color: form.color,
        });
        setSubjects((current) =>
          current.map((subject) => (subject.id === editingId ? updated : subject)),
        );
      } else {
        const created = await createSubject({
          userId: user.id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          examDate: form.examDate || null,
          color: form.color,
        });
        setSubjects((current) => [created, ...current]);
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(subject) {
    const noteCount = notesBySubject[subject.id] ?? 0;
    const confirmed = window.confirm(
      noteCount > 0
        ? `Delete "${subject.name}" and its ${noteCount} note${noteCount === 1 ? "" : "s"}?`
        : `Delete "${subject.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteNotesBySubject(subject.id);
      await deleteSubject(subject.id);
      setSubjects((current) => current.filter((item) => item.id !== subject.id));
      setNotes((current) => current.filter((note) => note.subject_id !== subject.id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <WarRoomShell
      eyebrow="Knowledge Domains"
      title="Subjects"
      description="Create and manage the study domains that organize your real notes and future study assets."
      action={<AddButton onClick={openCreateForm}>Add Subject</AddButton>}
    >
      <div className="grid gap-6">
        {error && (
          <div className="rounded-2xl border border-danger/40 bg-danger/15 p-4 text-sm text-primary">
            {error}
          </div>
        )}

        {showForm && (
          <CommandCard>
            <div className="mb-5 flex items-center justify-between gap-4">
              <CardHeader
                eyebrow={editingId ? "Update Domain" : "New Domain"}
                title={editingId ? "Edit Subject" : "Create Subject"}
                icon={BookOpen}
              />
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/70 text-secondary transition hover:border-strong-border hover:text-primary"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-4">
              <input
                type="text"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Subject name"
                className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-primary outline-none transition placeholder:text-muted focus:border-strong-border"
              />
              <input
                type="text"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Description"
                className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-primary outline-none transition placeholder:text-muted focus:border-strong-border lg:col-span-2"
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <input
                  type="date"
                  value={form.examDate}
                  onChange={(event) =>
                    setForm({ ...form, examDate: event.target.value })
                  }
                  className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-primary outline-none transition focus:border-strong-border"
                />
                <select
                  value={form.color}
                  onChange={(event) => setForm({ ...form, color: event.target.value })}
                  className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-primary outline-none transition focus:border-strong-border"
                >
                  <option value="blue">Blue</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl border border-strong-border bg-button px-5 py-3 font-semibold text-white shadow-lg shadow-button/20 transition hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60 lg:col-start-4"
              >
                {saving ? "Saving..." : editingId ? "Save Changes" : "Create Subject"}
              </button>
            </form>
          </CommandCard>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statSummary.map((stat) => (
            <CommandCard key={stat.label} className="p-4">
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">
                {stat.label}
              </p>
            </CommandCard>
          ))}
        </section>

        {loading ? (
          <CommandCard>
            <p className="text-secondary">Loading subjects...</p>
          </CommandCard>
        ) : subjects.length === 0 ? (
          <CommandCard>
            <CardHeader eyebrow="Empty Workspace" title="No Subjects Yet" icon={BookOpen} />
            <p className="max-w-2xl leading-7 text-secondary">
              Create your first subject to start organizing notes. New accounts do not
              include sample study data.
            </p>
          </CommandCard>
        ) : (
          <section className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-4">
            {subjects.map((subject) => (
              <CommandCard key={subject.id} className="overflow-hidden p-0">
                <div
                  className={`h-2 bg-gradient-to-r ${
                    accentByColor[subject.color] ?? accentByColor.blue
                  }`}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-strong-border bg-button/20">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <h2 className="text-2xl font-bold leading-tight">
                        {subject.name}
                      </h2>
                      <p className="mt-3 min-h-14 text-sm leading-6 text-secondary">
                        {subject.description || "No description added."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(subject)}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/70 text-secondary transition hover:border-strong-border hover:text-primary"
                        title="Edit subject"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(subject)}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background/70 text-secondary transition hover:border-danger hover:text-danger"
                        title="Delete subject"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6">
                    <ProgressBar value={0} label="Exam readiness" />
                  </div>

                  <div className="mt-5 grid gap-3">
                    <SubjectStat
                      icon={FileText}
                      label="Notes"
                      value={notesBySubject[subject.id] ?? 0}
                    />
                    <SubjectStat icon={Layers3} label="Flashcards" value={0} />
                    <SubjectStat icon={MessageSquareText} label="Quizzes" value={0} />
                    <SubjectStat icon={Target} label="Weak Topics" value={0} />
                  </div>

                  <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-4 text-sm text-secondary">
                    <CalendarClock className="h-4 w-4 text-warning" />
                    <span>{formatExamDate(subject.exam_date)}</span>
                  </div>
                </div>
              </CommandCard>
            ))}
          </section>
        )}
      </div>
    </WarRoomShell>
  );
}
