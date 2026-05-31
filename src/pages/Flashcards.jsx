import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Edit3,
  LoaderCircle,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  CommandCard,
  WarRoomShell,
} from "../components/WarRoomLayout";
import AIContentRenderer from "../components/AIContentRenderer";
import { useAuth } from "../hooks/useAuth";
import { generateFlashcards } from "../services/aiService";
import {
  createFlashcard,
  createFlashcardSet,
  deleteFlashcardSet,
  getFlashcards,
  getFlashcardSets,
  updateFlashcard,
  updateFlashcardSet,
} from "../services/flashcardsService";
import { getNotes } from "../services/notesService";
import { getSubjects } from "../services/subjectsService";

const emptySetForm = {
  title: "",
  description: "",
  subjectId: "",
};

const emptyCardForm = {
  setId: "",
  subjectId: "",
  noteId: "",
  front: "",
  back: "",
};

const emptyGenerator = {
  setId: "",
  subjectId: "",
  noteId: "",
  count: 8,
};

const flashcardContentComponents = {
  p: ({ children }) => (
    <p className="my-3 whitespace-pre-wrap wrap-break-word text-3xl font-bold leading-tight text-primary first:mt-0 last:mb-0 sm:text-5xl">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 list-disc space-y-3 pl-6 text-left text-2xl font-semibold leading-snug text-primary sm:text-4xl">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 list-decimal space-y-3 pl-6 text-left text-2xl font-semibold leading-snug text-primary sm:text-4xl">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-snug">{children}</li>,
};

const compactCardContentComponents = {
  p: ({ children }) => (
    <p className="my-0 wrap-break-word text-xs leading-5 text-secondary">{children}</p>
  ),
};

function getNextReviewAt(status) {
  const date = new Date();

  if (status === "learning") {
    date.setDate(date.getDate() + 1);
    return date.toISOString();
  }

  if (status === "reviewing") {
    date.setDate(date.getDate() + 3);
    return date.toISOString();
  }

  if (status === "mastered") {
    date.setDate(date.getDate() + 14);
    return date.toISOString();
  }

  return null;
}

function SelectField({ value, onChange, children, disabled = false, className = "" }) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="min-h-11 w-full appearance-none truncate rounded-2xl border border-border bg-background/70 py-2.5 pl-4 pr-12 text-sm font-semibold text-primary outline-none transition focus:border-strong-border disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-button-hover" />
    </div>
  );
}

function FieldLabel({ label, children }) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, eyebrow, children, onClose }) {
  return (
    <div className="fixed inset-0 z-90 grid place-items-end bg-background/75 p-3 backdrop-blur-sm sm:place-items-center sm:p-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-background/45 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">{eyebrow}</p>
            <h2 className="mt-2 text-xl font-bold text-primary">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-background/70 text-secondary transition hover:border-strong-border hover:text-primary"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[75dvh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function SetCard({ set, selected, cardCount, masteredCount, onSelect, onEdit, onDelete }) {
  const progress = cardCount ? Math.round((masteredCount / cardCount) * 100) : 0;

  return (
    <div
      className={`min-w-[16rem] max-w-[18rem] flex-1 rounded-2xl border p-4 transition ${
        selected
          ? "border-strong-border bg-button/15 shadow-[0_0_24px_hsl(var(--button)/0.12)]"
          : "border-border bg-background/55 hover:border-strong-border/70 hover:bg-card-hover/70"
      }`}
    >
      <button type="button" onClick={() => onSelect(set.id)} className="block w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-primary">{set.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-secondary">
              {set.description || set.subjects?.name || "Flashcard set"}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-semibold text-secondary">
            {cardCount}
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-background">
          <div className="h-full rounded-full bg-button" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted">{progress}% mastered</p>
      </button>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(set)}
          className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-3 text-xs font-semibold text-secondary transition hover:border-strong-border hover:text-primary"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(set)}
          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-danger/35 bg-danger/10 px-3 text-danger transition hover:border-danger"
          aria-label={`Delete ${set.title}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function StudyCard({ card, flipped, onFlip }) {
  const content = flipped ? card.answer : card.question;
  const mastered = card.status === "mastered";

  return (
    <button
      type="button"
      onClick={onFlip}
      className={`group relative flex min-h-96 w-full items-center justify-center overflow-hidden rounded-3xl border p-6 text-center transition hover:-translate-y-0.5 sm:min-h-120 sm:p-10 ${
        mastered
          ? "border-success/60 bg-[linear-gradient(145deg,hsl(var(--card)/0.98),hsl(var(--success)/0.16))] shadow-[0_0_46px_hsl(var(--success)/0.14)] hover:border-success"
          : "border-strong-border/70 bg-[linear-gradient(145deg,hsl(var(--card)/0.98),hsl(var(--button)/0.16))] shadow-[0_0_42px_hsl(var(--button)/0.12)] hover:border-strong-border"
      }`}
    >
      {mastered && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-success" />
          <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-success/35 bg-success/15 px-3 py-1.5 text-xs font-semibold text-success shadow-lg shadow-success/10">
            <Check className="h-3.5 w-3.5" />
          </div>
        </>
      )}
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
          {flipped ? "Back" : "Front"}
        </p>
        <AIContentRenderer
          className="mt-8 text-primary [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:pb-2 [&_.katex-display]:text-left sm:[&_.katex-display]:text-center"
          components={flashcardContentComponents}
        >
          {content}
        </AIContentRenderer>
        <p className="mt-8 text-sm font-semibold text-secondary transition group-hover:text-primary">
          Tap card to {flipped ? "show front" : "reveal answer"}
        </p>
      </div>
    </button>
  );
}

function ResultsPanel({ results, cards, onReset }) {
  const mastered = cards.filter((card) => results[card.id] === "mastered");
  const learning = cards.filter((card) => results[card.id] === "learning");

  return (
    <CommandCard className="p-5 sm:p-7">
      <p className="text-xs uppercase tracking-[0.24em] text-muted">Test Results</p>
      <h2 className="mt-3 text-3xl font-bold text-primary">Review complete</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-success/35 bg-success/10 p-4">
          <p className="text-3xl font-bold text-success">{mastered.length}</p>
          <p className="mt-2 text-sm font-semibold text-primary">Mastered</p>
        </div>
        <div className="rounded-2xl border border-warning/35 bg-warning/10 p-4">
          <p className="text-3xl font-bold text-warning">{learning.length}</p>
          <p className="mt-2 text-sm font-semibold text-primary">Keep learning</p>
        </div>
      </div>
      {learning.length > 0 && (
        <div className="mt-5 rounded-2xl border border-border bg-background/60 p-4">
          <p className="text-sm font-semibold text-primary">Cards to revisit</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {learning.map((card) => (
              <span key={card.id} className="max-w-full rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-secondary">
                <AIContentRenderer clamp components={compactCardContentComponents}>
                  {card.question}
                </AIContentRenderer>
              </span>
            ))}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onReset}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl border border-strong-border bg-button px-5 py-2 text-sm font-semibold text-white transition hover:bg-button-hover"
      >
        Study again
      </button>
    </CommandCard>
  );
}

export default function Flashcards() {
  const { user } = useAuth();
  const studySectionRef = useRef(null);
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [sets, setSets] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState({});
  const [setModalOpen, setSetModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingSetId, setEditingSetId] = useState("");
  const [setForm, setSetForm] = useState(emptySetForm);
  const [cardForm, setCardForm] = useState(emptyCardForm);
  const [generator, setGenerator] = useState(emptyGenerator);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const [subjectRows, noteRows, setRows, cardRows] = await Promise.all([
          getSubjects(user.id),
          getNotes(user.id),
          getFlashcardSets(user.id),
          getFlashcards(user.id),
        ]);

        setSubjects(subjectRows ?? []);
        setNotes(noteRows ?? []);
        setSets(setRows ?? []);
        setFlashcards(cardRows ?? []);
        const firstSetId = setRows?.[0]?.id ?? "";
        setSelectedSetId((current) => current || firstSetId);
        setSetForm((current) => ({ ...current, subjectId: current.subjectId || subjectRows?.[0]?.id || "" }));
        setCardForm((current) => ({
          ...current,
          setId: current.setId || firstSetId,
          subjectId: current.subjectId || setRows?.[0]?.subject_id || subjectRows?.[0]?.id || "",
        }));
        setGenerator((current) => ({
          ...current,
          setId: current.setId || firstSetId,
          subjectId: current.subjectId || setRows?.[0]?.subject_id || subjectRows?.[0]?.id || "",
        }));
      } catch (loadError) {
        setError(
          loadError.message.includes("flashcard_sets")
            ? "Flashcard sets are not installed yet. Run supabase/sql/flashcard_sets.sql, then reload this page."
            : loadError.message,
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const selectedSet = useMemo(
    () => sets.find((set) => set.id === selectedSetId) ?? sets[0] ?? null,
    [selectedSetId, sets],
  );

  const selectedCards = useMemo(
    () => flashcards.filter((card) => card.set_id === selectedSet?.id),
    [flashcards, selectedSet?.id],
  );

  const currentCard = selectedCards[cardIndex % Math.max(selectedCards.length, 1)] ?? null;
  const subjectNotes = notes.filter((note) => note.subject_id === generator.subjectId);
  const cardSubjectNotes = notes.filter((note) => note.subject_id === cardForm.subjectId);
  const progress = selectedCards.length ? ((cardIndex + 1) / selectedCards.length) * 100 : 0;
  const complete = selectedCards.length > 0 && Object.keys(results).length >= selectedCards.length;

  function chooseSet(setId) {
    const nextSet = sets.find((set) => set.id === setId);
    setSelectedSetId(setId);
    setCardIndex(0);
    setFlipped(false);
    setResults({});
    setCardForm((current) => ({
      ...current,
      setId,
      subjectId: nextSet?.subject_id || current.subjectId || subjects[0]?.id || "",
    }));
    setGenerator((current) => ({
      ...current,
      setId,
      subjectId: nextSet?.subject_id || current.subjectId || subjects[0]?.id || "",
    }));
  }

  function openCreateSet() {
    setEditingSetId("");
    setSetForm({ ...emptySetForm, subjectId: subjects[0]?.id ?? "" });
    setSetModalOpen(true);
  }

  function openEditSet(set) {
    setEditingSetId(set.id);
    setSetForm({
      title: set.title ?? "",
      description: set.description ?? "",
      subjectId: set.subject_id ?? "",
    });
    setSetModalOpen(true);
  }

  function closeSetModal() {
    setSetModalOpen(false);
    setEditingSetId("");
    setSetForm({ ...emptySetForm, subjectId: subjects[0]?.id ?? "" });
  }

  function nextCard() {
    setFlipped(false);
    setCardIndex((current) => Math.min(current + 1, Math.max(selectedCards.length - 1, 0)));
  }

  function previousCard() {
    setFlipped(false);
    setCardIndex((current) => Math.max(current - 1, 0));
  }

  async function markCard(status) {
    if (!currentCard) return;

    try {
      const updated = await updateFlashcard(currentCard.id, {
        userId: user.id,
        status,
        nextReviewAt: getNextReviewAt(status),
      });
      setFlashcards((current) => current.map((card) => (card.id === updated.id ? updated : card)));
      setResults((current) => ({ ...current, [updated.id]: status }));
      if (cardIndex < selectedCards.length - 1) nextCard();
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function handleSaveSet(event) {
    event.preventDefault();
    if (!setForm.title.trim()) return;

    try {
      setSaving(true);
      setError("");
      const saved = editingSetId
        ? await updateFlashcardSet(editingSetId, {
          userId: user.id,
          ...setForm,
        })
        : await createFlashcardSet({
          userId: user.id,
          ...setForm,
        });

      setSets((current) => (
        editingSetId
          ? current.map((set) => (set.id === saved.id ? saved : set))
          : [saved, ...current]
      ));
      closeSetModal();
      setSelectedSetId(saved.id);
      setCardIndex(0);
      setFlipped(false);
      setResults({});
      setCardForm((current) => ({
        ...current,
        setId: saved.id,
        subjectId: saved.subject_id || current.subjectId || subjects[0]?.id || "",
      }));
      setGenerator((current) => ({
        ...current,
        setId: saved.id,
        subjectId: saved.subject_id || current.subjectId || subjects[0]?.id || "",
      }));
      setNotice(editingSetId ? "Flashcard set updated." : "Flashcard set created.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSet(set) {
    const confirmed = window.confirm(`Delete "${set.title}"? Existing cards will stay in your account, but they will no longer belong to this set.`);
    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      await deleteFlashcardSet(set.id, user.id);
      const remainingSets = sets.filter((currentSet) => currentSet.id !== set.id);
      setSets(remainingSets);
      setFlashcards((current) => current.map((card) => (
        card.set_id === set.id ? { ...card, set_id: null, flashcard_sets: null } : card
      )));

      if (selectedSetId === set.id) {
        const nextSet = remainingSets[0] ?? null;
        setSelectedSetId(nextSet?.id ?? "");
        setCardIndex(0);
        setFlipped(false);
        setResults({});
      }

      setNotice("Flashcard set deleted.");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCard(event) {
    event.preventDefault();
    if (!cardForm.setId || !cardForm.subjectId || !cardForm.front.trim() || !cardForm.back.trim()) return;

    try {
      setSaving(true);
      setError("");
      const created = await createFlashcard({
        userId: user.id,
        setId: cardForm.setId,
        subjectId: cardForm.subjectId,
        noteId: cardForm.noteId,
        question: cardForm.front,
        answer: cardForm.back,
        status: "new",
      });
      setFlashcards((current) => [...current, created]);
      setCardForm((current) => ({ ...current, front: "", back: "", noteId: "" }));
      setCardModalOpen(false);
      chooseSet(cardForm.setId);
      setNotice("Flashcard added.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate(event) {
    event.preventDefault();
    if (!generator.setId || !generator.subjectId) return;

    try {
      setGenerating(true);
      setError("");
      setNotice("");
      const generatedRows = await generateFlashcards(generator);
      const normalizedGeneratedRows = generatedRows.map((card) => ({
        ...card,
        set_id: card.set_id || generator.setId,
        subject_id: card.subject_id || generator.subjectId,
      }));
      const cardsNeedingSet = generatedRows.filter((card) => card.id && card.set_id !== generator.setId);

      if (cardsNeedingSet.length > 0) {
        await Promise.all(cardsNeedingSet.map((card) => updateFlashcard(card.id, {
          userId: user.id,
          setId: generator.setId,
          subjectId: card.subject_id || generator.subjectId,
        })));
      }

      const [setRows, cardRows] = await Promise.all([
        getFlashcardSets(user.id),
        getFlashcards(user.id),
      ]);
      const refreshedCards = (cardRows?.length ? cardRows : normalizedGeneratedRows).map((card) => (
        generatedRows.some((generatedCard) => generatedCard.id === card.id)
          ? { ...card, set_id: card.set_id || generator.setId }
          : card
      ));
      const generatedIds = new Set(normalizedGeneratedRows.map((card) => card.id));
      const firstGeneratedIndex = refreshedCards
        .filter((card) => card.set_id === generator.setId)
        .findIndex((card) => generatedIds.has(card.id));

      setSets(setRows ?? []);
      setFlashcards(refreshedCards);
      setSelectedSetId(generator.setId);
      setCardIndex(firstGeneratedIndex >= 0 ? firstGeneratedIndex : 0);
      setFlipped(false);
      setResults({});
      setNotice(`${normalizedGeneratedRows.length} flashcard${normalizedGeneratedRows.length === 1 ? "" : "s"} generated. Ready to study.`);
      window.requestAnimationFrame(() => {
        studySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (generateError) {
      setError(generateError.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <WarRoomShell
      eyebrow="Active Recall"
      title="Flashcards"
      description="Study one clean set at a time with large front-and-back cards."
    >
      <div className="grid min-w-0 gap-5">
        {error && (
          <div className="rounded-2xl border border-danger/40 bg-danger/15 p-4 text-sm text-primary">
            {error}
          </div>
        )}

        {notice && !error && (
          <div className="rounded-2xl border border-success/40 bg-success/15 p-4 text-sm text-primary">
            {notice}
          </div>
        )}

        {loading ? (
          <CommandCard>
            <p className="text-sm text-secondary">Loading flashcards...</p>
          </CommandCard>
        ) : subjects.length === 0 ? (
          <CommandCard>
            <div className="flex items-start gap-4">
              <BookOpen className="h-5 w-5 text-button-hover" />
              <div>
                <h2 className="text-xl font-bold text-primary">Create a subject first</h2>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  Flashcard sets need a subject before you can study.
                </p>
                <Link
                  to="/subjects"
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl border border-strong-border bg-button px-4 py-2 text-sm font-semibold text-white"
                >
                  Go to Subjects
                </Link>
              </div>
            </div>
          </CommandCard>
        ) : (
          <>
            <CommandCard className="overflow-hidden p-0">
              <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_9rem]">
                  <FieldLabel label="Set">
                    <SelectField
                      value={generator.setId}
                      onChange={(setId) => {
                        const nextSet = sets.find((set) => set.id === setId);
                        setGenerator((current) => ({
                          ...current,
                          setId,
                          subjectId: nextSet?.subject_id || current.subjectId,
                          noteId: "",
                        }));
                      }}
                    >
                      <option value="">Choose set</option>
                      {sets.map((set) => (
                        <option key={set.id} value={set.id}>{set.title}</option>
                      ))}
                    </SelectField>
                  </FieldLabel>
                  <FieldLabel label="Subject">
                    <SelectField
                      value={generator.subjectId}
                      onChange={(subjectId) => setGenerator((current) => ({ ...current, subjectId, noteId: "" }))}
                    >
                      <option value="">Choose subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </SelectField>
                  </FieldLabel>
                  <FieldLabel label="Source Notes">
                    <SelectField
                      value={generator.noteId}
                      onChange={(noteId) => setGenerator((current) => ({ ...current, noteId }))}
                      disabled={!generator.subjectId}
                    >
                      <option value="">All notes in subject</option>
                      {subjectNotes.map((note) => (
                        <option key={note.id} value={note.id}>{note.title}</option>
                      ))}
                    </SelectField>
                  </FieldLabel>
                  <FieldLabel label="Card Count">
                    <SelectField
                      value={String(generator.count)}
                      onChange={(count) => setGenerator((current) => ({ ...current, count: Number(count) }))}
                    >
                      {[4, 6, 8, 10, 12].map((count) => (
                        <option key={count} value={count}>{count}</option>
                      ))}
                    </SelectField>
                  </FieldLabel>
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || !generator.setId || !generator.subjectId}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-button/20 transition hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60 xl:w-auto"
                >
                  {generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? "Generating..." : "Generate"}
                </button>
              </div>
            </CommandCard>

            <section ref={studySectionRef} className="grid gap-5 scroll-mt-4">
              <div className="grid min-w-0 gap-5">
                <CommandCard className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted">
                        {selectedSet?.subjects?.name ?? "Flashcard Set"}
                      </p>
                      <h2 className="mt-2 truncate text-2xl font-bold text-primary sm:text-3xl">
                        {selectedSet?.title ?? "No set selected"}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-secondary">
                        {selectedCards.length} card{selectedCards.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCardForm((current) => ({
                          ...current,
                          setId: selectedSet?.id ?? "",
                          subjectId: selectedSet?.subject_id || current.subjectId || subjects[0]?.id || "",
                        }));
                        setCardModalOpen(true);
                      }}
                      disabled={!selectedSet}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-strong-border bg-button px-4 py-2 text-sm font-semibold text-white transition hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus className="h-4 w-4" />
                      Add card
                    </button>
                  </div>
                </CommandCard>

                {complete ? (
                  <ResultsPanel
                    results={results}
                    cards={selectedCards}
                    onReset={() => {
                      setResults({});
                      setCardIndex(0);
                      setFlipped(false);
                    }}
                  />
                ) : currentCard ? (
                  <div className="grid gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-secondary">
                        {cardIndex + 1} / {selectedCards.length}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-card">
                        <div className="h-full rounded-full bg-button" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <StudyCard card={currentCard} flipped={flipped} onFlip={() => setFlipped((current) => !current)} />

                    <div className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                      <button
                        type="button"
                        onClick={previousCard}
                        disabled={cardIndex === 0}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-card/80 px-4 py-2 text-sm font-semibold text-secondary transition hover:border-strong-border hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Previous
                      </button>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => markCard("learning")}
                          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 px-4 py-2 text-sm font-semibold text-primary transition hover:border-warning"
                        >
                          Still learning
                        </button>
                        <button
                          type="button"
                          onClick={() => markCard("mastered")}
                          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-success/40 bg-success/15 px-4 py-2 text-sm font-semibold text-success transition hover:border-success"
                        >
                          Mastered
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={nextCard}
                        disabled={cardIndex >= selectedCards.length - 1}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-card/80 px-4 py-2 text-sm font-semibold text-secondary transition hover:border-strong-border hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <CommandCard className="grid min-h-80 place-items-center p-8 text-center">
                    <div>
                      <RotateCcw className="mx-auto h-8 w-8 text-muted" />
                      <h2 className="mt-4 text-2xl font-bold text-primary">No cards in this set</h2>
                      <p className="mt-2 text-sm leading-6 text-secondary">
                        Add cards manually or generate them from your notes.
                      </p>
                    </div>
                  </CommandCard>
                )}
              </div>

              <CommandCard className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Sets</p>
                  </div>
                  <button
                    type="button"
                    onClick={openCreateSet}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-strong-border bg-button px-4 py-2 text-sm font-semibold text-white transition hover:bg-button-hover"
                  >
                    <Plus className="h-4 w-4" />
                    New set
                  </button>
                </div>

                {sets.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-border bg-background/55 p-4">
                    <p className="text-sm leading-6 text-secondary">
                      Create your first set to start adding cards.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 flex justify-center md:justify-start gap-3 overflow-x-auto pb-2">
                    {sets.map((set) => {
                      const setCards = flashcards.filter((card) => card.set_id === set.id);
                      const mastered = setCards.filter((card) => card.status === "mastered").length;
                      return (
                        <SetCard
                          key={set.id}
                          set={set}
                          selected={set.id === selectedSet?.id}
                          cardCount={setCards.length}
                          masteredCount={mastered}
                          onSelect={chooseSet}
                          onEdit={openEditSet}
                          onDelete={handleDeleteSet}
                        />
                      );
                    })}
                  </div>
                )}
              </CommandCard>
            </section>
          </>
        )}
      </div>

      {setModalOpen && (
        <Modal
          title={editingSetId ? "Edit Set" : "Create Set"}
          eyebrow="Flashcard Sets"
          onClose={closeSetModal}
        >
          <form onSubmit={handleSaveSet} className="grid gap-4">
            <input
              type="text"
              value={setForm.title}
              onChange={(event) => setSetForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Set name"
              className="min-h-12 rounded-2xl border border-border bg-background/70 px-4 py-3 text-primary outline-none placeholder:text-muted focus:border-strong-border"
            />
            <SelectField
              value={setForm.subjectId}
              onChange={(subjectId) => setSetForm((current) => ({ ...current, subjectId }))}
            >
              <option value="">No subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </SelectField>
            <textarea
              value={setForm.description}
              onChange={(event) => setSetForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Optional description"
              className="min-h-24 rounded-2xl border border-border bg-background/70 px-4 py-3 text-primary outline-none placeholder:text-muted focus:border-strong-border"
            />
            <button
              type="submit"
              disabled={saving || !setForm.title.trim()}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-strong-border bg-button px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : editingSetId ? "Save Changes" : "Create Set"}
            </button>
          </form>
        </Modal>
      )}

      {cardModalOpen && (
        <Modal title="Add Card" eyebrow="Manual Card" onClose={() => setCardModalOpen(false)}>
          <form onSubmit={handleCreateCard} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                value={cardForm.setId}
                onChange={(setId) => {
                  const nextSet = sets.find((set) => set.id === setId);
                  setCardForm((current) => ({
                    ...current,
                    setId,
                    subjectId: nextSet?.subject_id || current.subjectId,
                  }));
                }}
              >
                <option value="">Choose set</option>
                {sets.map((set) => (
                  <option key={set.id} value={set.id}>{set.title}</option>
                ))}
              </SelectField>
              <SelectField
                value={cardForm.subjectId}
                onChange={(subjectId) => setCardForm((current) => ({ ...current, subjectId, noteId: "" }))}
              >
                <option value="">Choose subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </SelectField>
            </div>
            <SelectField
              value={cardForm.noteId}
              onChange={(noteId) => setCardForm((current) => ({ ...current, noteId }))}
              disabled={!cardForm.subjectId}
            >
              <option value="">No source note</option>
              {cardSubjectNotes.map((note) => (
                <option key={note.id} value={note.id}>{note.title}</option>
              ))}
            </SelectField>
            <input
              type="text"
              value={cardForm.front}
              onChange={(event) => setCardForm((current) => ({ ...current, front: event.target.value }))}
              placeholder="Front / title"
              className="min-h-12 rounded-2xl border border-border bg-background/70 px-4 py-3 text-primary outline-none placeholder:text-muted focus:border-strong-border"
            />
            <textarea
              value={cardForm.back}
              onChange={(event) => setCardForm((current) => ({ ...current, back: event.target.value }))}
              placeholder="Back / answer"
              className="min-h-32 rounded-2xl border border-border bg-background/70 px-4 py-3 text-primary outline-none placeholder:text-muted focus:border-strong-border"
            />
            <button
              type="submit"
              disabled={saving || !cardForm.setId || !cardForm.subjectId || !cardForm.front.trim() || !cardForm.back.trim()}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-strong-border bg-button px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Card"}
            </button>
          </form>
        </Modal>
      )}
    </WarRoomShell>
  );
}
