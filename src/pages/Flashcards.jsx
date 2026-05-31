import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  LoaderCircle,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import {
  CommandCard,
  WarRoomShell,
} from "../components/WarRoomLayout";
import { useAuth } from "../hooks/useAuth";
import { generateFlashcards } from "../services/aiService";
import {
  createFlashcard,
  createFlashcardSet,
  getFlashcards,
  getFlashcardSets,
  updateFlashcard,
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

function Modal({ title, eyebrow, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-end bg-background/75 p-3 backdrop-blur-sm sm:place-items-center sm:p-6">
      <div className="w-full max-w-2xl overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-2xl shadow-black/50">
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

function SetCard({ set, selected, cardCount, masteredCount, onSelect }) {
  const progress = cardCount ? Math.round((masteredCount / cardCount) * 100) : 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(set.id)}
      className={`min-w-0 rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-strong-border bg-button/15 shadow-[0_0_24px_hsl(var(--button)/0.12)]"
          : "border-border bg-background/55 hover:border-strong-border/70 hover:bg-card-hover/70"
      }`}
    >
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
  );
}

function StudyCard({ card, flipped, onFlip }) {
  return (
    <button
      type="button"
      onClick={onFlip}
      className="group flex min-h-[24rem] w-full items-center justify-center rounded-[1.5rem] border border-strong-border/70 bg-[linear-gradient(145deg,hsl(var(--card)/0.98),hsl(var(--button)/0.16))] p-6 text-center shadow-[0_0_42px_hsl(var(--button)/0.12)] transition hover:-translate-y-0.5 hover:border-strong-border sm:min-h-[30rem] sm:p-10"
    >
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
          {flipped ? "Back" : "Front"}
        </p>
        <p className="mt-8 whitespace-pre-wrap break-words text-3xl font-bold leading-tight text-primary sm:text-5xl">
          {flipped ? card.answer : card.question}
        </p>
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
              <span key={card.id} className="rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-secondary">
                {card.question}
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

  async function handleCreateSet(event) {
    event.preventDefault();
    if (!setForm.title.trim()) return;

    try {
      setSaving(true);
      setError("");
      const created = await createFlashcardSet({
        userId: user.id,
        ...setForm,
      });
      setSets((current) => [created, ...current]);
      setSetForm({ ...emptySetForm, subjectId: subjects[0]?.id ?? "" });
      setSetModalOpen(false);
      setSelectedSetId(created.id);
      setCardIndex(0);
      setFlipped(false);
      setResults({});
      setCardForm((current) => ({
        ...current,
        setId: created.id,
        subjectId: created.subject_id || current.subjectId || subjects[0]?.id || "",
      }));
      setGenerator((current) => ({
        ...current,
        setId: created.id,
        subjectId: created.subject_id || current.subjectId || subjects[0]?.id || "",
      }));
    } catch (saveError) {
      setError(saveError.message);
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
      setFlashcards((current) => [...current, ...generatedRows]);
      chooseSet(generator.setId);
      setNotice(`${generatedRows.length} flashcard${generatedRows.length === 1 ? "" : "s"} generated.`);
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
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_9rem]">
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
                  <SelectField
                    value={String(generator.count)}
                    onChange={(count) => setGenerator((current) => ({ ...current, count: Number(count) }))}
                  >
                    {[4, 6, 8, 10, 12].map((count) => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                  </SelectField>
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

            <section className="grid gap-5 xl:grid-cols-[17rem_minmax(0,1fr)]">
              <aside className="grid gap-3 xl:self-start">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Sets</p>
                  <button
                    type="button"
                    onClick={() => setSetModalOpen(true)}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-card/80 px-3 text-xs font-semibold text-secondary transition hover:border-strong-border hover:text-primary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Set
                  </button>
                </div>

                {sets.length === 0 ? (
                  <CommandCard className="p-4">
                    <p className="text-sm leading-6 text-secondary">
                      Create your first set to start adding cards.
                    </p>
                  </CommandCard>
                ) : (
                  sets.map((set) => {
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
                      />
                    );
                  })
                )}
              </aside>

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
                          <Check className="h-4 w-4" />
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
            </section>
          </>
        )}
      </div>

      {setModalOpen && (
        <Modal title="Create Set" eyebrow="Flashcard Sets" onClose={() => setSetModalOpen(false)}>
          <form onSubmit={handleCreateSet} className="grid gap-4">
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
              {saving ? "Saving..." : "Create Set"}
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
