import { useEffect, useMemo, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import {
  BookOpen,
  CalendarClock,
  Clock3,
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
  examTime: "",
  color: "#0ea5c8",
};

const colorPresets = [
  "#dc2626",
  "#ea580c",
  "#facc15",
  "#16a34a",
  "#0d9488",
  "#0891b2",
  "#2563eb",
  "#4f46e5",
  "#7c3aed",
  "#db2777",
];

const legacyColors = {
  blue: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
  yellow: "#facc15",
};

function SubjectStat({ icon: Icon, label, value }) {
  return (
    <div className="flex min-h-24 items-center gap-4 rounded-[1.25rem] border border-border bg-background/70 p-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-button/20 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
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

function formatExamTime(value) {
  if (!value) return "No exam time";

  const [hours = "00", minutes = "00"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function normalizeColor(value) {
  if (!value) return emptyForm.color;
  if (legacyColors[value]) return legacyColors[value];
  return /^#[0-9a-f]{6}$/i.test(value) ? value : emptyForm.color;
}

export default function Subjects() {
  const { user } = useAuth();
  const examDateInputRef = useRef(null);
  const examTimeInputRef = useRef(null);
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
      examTime: subject.exam_time?.slice(0, 5) ?? "",
      color: normalizeColor(subject.color),
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
      const subjectColor = normalizeColor(form.color);

      if (editingId) {
        const updated = await updateSubject(editingId, {
          userId: user.id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          examDate: form.examDate || null,
          examTime: form.examTime || null,
          color: subjectColor,
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
          examTime: form.examTime || null,
          color: subjectColor,
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
      await deleteNotesBySubject(subject.id, user.id);
      await deleteSubject(subject.id, user.id);
      setSubjects((current) => current.filter((item) => item.id !== subject.id));
      setNotes((current) => current.filter((note) => note.subject_id !== subject.id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function openInputPicker(inputRef) {
    const input = inputRef.current;
    if (!input) return;

    input.focus();

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.click();
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

            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_13rem_11rem]">
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted">
                    Subject
                  </span>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="New subject name"
                    className="min-h-14 rounded-2xl border border-border bg-background/70 px-4 py-3 text-base font-semibold text-primary outline-none transition placeholder:text-muted focus:border-strong-border"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted">
                    Description
                  </span>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    placeholder="What this subject covers"
                    className="min-h-14 rounded-2xl border border-border bg-background/70 px-4 py-3 text-primary outline-none transition placeholder:text-muted focus:border-strong-border"
                  />
                </label>
                <div className="grid gap-2">
                  <label htmlFor="subject-exam-date" className="text-xs uppercase tracking-[0.18em] text-muted">
                    Exam Date
                  </label>
                  <div className="relative">
                    <input
                      id="subject-exam-date"
                      ref={examDateInputRef}
                      type="date"
                      value={form.examDate}
                      onChange={(event) =>
                        setForm({ ...form, examDate: event.target.value })
                      }
                      className="min-h-14 w-full rounded-2xl border border-border bg-background/70 px-4 py-3 pr-12 text-primary outline-none transition focus:border-strong-border [&::-webkit-calendar-picker-indicator]:opacity-0"
                    />
                    <button
                      type="button"
                      onClick={() => openInputPicker(examDateInputRef)}
                      className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-primary transition hover:bg-button/15 focus:outline-none focus:ring-2 focus:ring-strong-border"
                      aria-label="Open exam date picker"
                      title="Open exam date picker"
                    >
                      <CalendarClock className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="subject-exam-time" className="text-xs uppercase tracking-[0.18em] text-muted">
                    Exam Time
                  </label>
                  <div className="relative">
                    <input
                      id="subject-exam-time"
                      ref={examTimeInputRef}
                      type="time"
                      value={form.examTime}
                      onChange={(event) =>
                        setForm({ ...form, examTime: event.target.value })
                      }
                      className="min-h-14 w-full rounded-2xl border border-border bg-background/70 px-4 py-3 pr-12 text-primary outline-none transition focus:border-strong-border [&::-webkit-calendar-picker-indicator]:opacity-0"
                    />
                    <button
                      type="button"
                      onClick={() => openInputPicker(examTimeInputRef)}
                      className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-primary transition hover:bg-button/15 focus:outline-none focus:ring-2 focus:ring-strong-border"
                      aria-label="Open exam time picker"
                      title="Open exam time picker"
                    >
                      <Clock3 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      Subject Color
                    </span>
                    <span
                      className="h-6 w-6 rounded-full border border-strong-border"
                      style={{ backgroundColor: normalizeColor(form.color) }}
                    />
                  </div>
                  <HexColorPicker
                    color={normalizeColor(form.color)}
                    onChange={(color) => setForm({ ...form, color })}
                    className="!h-44 !w-full"
                  />
                </div>

                <div className="grid content-between gap-4">
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-muted">
                      Hex Value
                    </span>
                    <input
                      type="text"
                      value={form.color}
                      onChange={(event) => {
                        const nextColor = event.target.value.trim();
                        setForm({ ...form, color: nextColor });
                      }}
                      onBlur={() =>
                        setForm((current) => ({
                          ...current,
                          color: normalizeColor(current.color),
                        }))
                      }
                      placeholder="#0ea5c8"
                      className="min-h-14 rounded-2xl border border-border bg-background/70 px-4 py-3 font-mono text-sm uppercase text-primary outline-none transition placeholder:text-muted focus:border-strong-border"
                    />
                  </label>
                  <div className="grid grid-cols-5 gap-2 sm:grid-cols-10 lg:grid-cols-5 xl:grid-cols-10">
                    {colorPresets.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm({ ...form, color })}
                        className={`h-10 rounded-xl border transition hover:scale-105 ${
                          normalizeColor(form.color).toLowerCase() === color
                            ? "border-primary"
                            : "border-border"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                        aria-label={`Use ${color}`}
                      />
                    ))}
                  </div>
                  <div
                    className="min-h-24 rounded-2xl border border-border p-4"
                    style={{
                      background: `linear-gradient(135deg, ${normalizeColor(
                        form.color,
                      )}, hsl(var(--card)))`,
                    }}
                  >
                    <p className="text-sm font-semibold text-primary">
                      {form.name.trim() || "Subject preview"}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-primary/80">
                      {form.description.trim() || "No description added."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl border border-strong-border bg-button px-5 py-3 font-semibold text-white shadow-lg shadow-button/20 transition hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Subject"}
                </button>
              </div>
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
          <section className="grid gap-6 xl:grid-cols-2">
            {subjects.map((subject) => (
              <CommandCard key={subject.id} className="overflow-hidden p-0">
                <div
                  className="h-3"
                  style={{
                    background: `linear-gradient(90deg, ${normalizeColor(
                      subject.color,
                    )}, hsla(var(--button), 0.2))`,
                  }}
                />
                <div className="p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="grid h-16 w-16 place-items-center rounded-[1.35rem]"
                      style={{
                        backgroundColor: `${normalizeColor(subject.color)}33`,
                      }}
                    >
                      <BookOpen className="h-7 w-7" />
                    </div>
                    <div className="flex gap-3 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => openEditForm(subject)}
                        className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-background/70 text-secondary transition hover:border-strong-border hover:text-primary"
                        title="Edit subject"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(subject)}
                        className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-background/70 text-secondary transition hover:border-danger hover:text-danger"
                        title="Delete subject"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 min-w-0">
                    <h2 className="break-words text-3xl font-bold leading-tight sm:text-4xl">
                      {subject.name}
                    </h2>
                    <p className="mt-5 w-full text-base leading-8 text-secondary">
                      {subject.description || "No description added."}
                    </p>
                  </div>

                  <div className="mt-8">
                    <ProgressBar value={0} label="Exam readiness" />
                  </div>

                  <div className="mt-7 grid gap-4 md:grid-cols-2">
                    <SubjectStat
                      icon={FileText}
                      label="Notes"
                      value={notesBySubject[subject.id] ?? 0}
                    />
                    <SubjectStat icon={Layers3} label="Flashcards" value={0} />
                    <SubjectStat icon={MessageSquareText} label="Quizzes" value={0} />
                    <SubjectStat icon={Target} label="Weak Topics" value={0} />
                  </div>

                  <div className="mt-7 grid gap-3 rounded-[1.25rem] border border-border bg-background/70 p-4 text-base text-secondary sm:grid-cols-2">
                    <span className="flex items-center gap-3">
                      <CalendarClock className="h-5 w-5 text-warning" />
                      {formatExamDate(subject.exam_date)}
                    </span>
                    <span className="flex items-center gap-3">
                      <Clock3 className="h-5 w-5 text-warning" />
                      {formatExamTime(subject.exam_time)}
                    </span>
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
