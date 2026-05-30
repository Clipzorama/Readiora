import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

import {
  AddButton,
  CardHeader,
  CommandCard,
  WarRoomShell,
} from "../../components/WarRoomLayout";

import { useAuth } from "../../hooks/useAuth";
import {
  createAttachmentSignedUrl,
  deleteNoteAttachment,
  getNoteAttachments,
  uploadNoteAttachment,
  validateNoteAttachment,
} from "../../services/noteAttachmentsService";

import {
  createNote,
  deleteNote,
  getNotes,
  updateNote,
} from "../../services/notesService";

import { summarizeNote } from "../../services/aiService";
import { getSubjects } from "../../services/subjectsService";
import AttachmentUploader from "./AttachmentUploader";
import MarkdownEditor from "./MarkdownEditor";
import NoteSavePanel from "./NoteSavePanel";
import NotesHeader from "./NotesHeader";
import RecentNotesLibrary from "./RecentNotesLibrary";
import SelectedSummaryPanel from "./SelectedSummaryPanel";
import { emptyDraft, workspaceVariants } from "./constants";

export default function Notes() {
  const { user } = useAuth();
  const textareaRef = useRef(null);
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [attachments, setAttachments] = useState([]);
  const [previewUrls, setPreviewUrls] = useState({});
  const [editorMode, setEditorMode] = useState("write");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [summarizingNoteId, setSummarizingNoteId] = useState(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("draft");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [workspaceVisible, setWorkspaceVisible] = useState(false);

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

  useEffect(() => {
    if (!user || !selectedNoteId) {
      return;
    }

    async function loadAttachments() {
      try {
        const rows = await getNoteAttachments(selectedNoteId, user.id);
        setAttachments(rows);

        const imageRows = rows.filter((item) => item.file_type?.startsWith("image/"));
        const entries = await Promise.all(
          imageRows.map(async (item) => [item.id, await createAttachmentSignedUrl(item.file_path)]),
        );
        setPreviewUrls(Object.fromEntries(entries));
      } catch (attachmentError) {
        setError(attachmentError.message);
      }
    }

    loadAttachments();
  }, [selectedNoteId, user]);

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId],
  );

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === draft.subjectId) ?? null,
    [subjects, draft.subjectId],
  );

  // Future AI jobs can use this shape to pass text plus source file metadata to OCR,
  // summarization, flashcard, quiz, weak-topic, or study-plan pipelines.
  const aiReadyContext = useMemo(
    () => ({
      noteId: selectedNoteId,
      title: draft.title,
      subject: selectedSubject?.name ?? "",
      content: draft.content,
      attachments: attachments.map(({ id, file_name, file_type, file_size, file_path }) => ({
        id,
        fileName: file_name,
        fileType: file_type,
        fileSize: file_size,
        filePath: file_path,
      })),
    }),
    [attachments, draft.content, draft.title, selectedNoteId, selectedSubject?.name],
  );

  function updateDraft(updates) {
    setDraft((current) => ({ ...current, ...updates }));
    setSaveStatus("draft");
    setNotice("");
  }

  function selectNoteDraft(note) {
    setSelectedNoteId(note.id);
    setDraft({
      title: note.title ?? "",
      subjectId: note.subject_id ?? "",
      content: note.content ?? "",
    });
    setAttachments([]);
    setPreviewUrls({});
    setSaveStatus("saved");
    setError("");
    setNotice("");
    setEditorMode("write");
    setWorkspaceVisible(true);
  }

  function startNewNote() {
    setSelectedNoteId(null);
    setDraft(emptyDraft);
    setAttachments([]);
    setPreviewUrls({});
    setSaveStatus("draft");
    setError("");
    setNotice("");
    setEditorMode("write");
    setWorkspaceVisible(true);
  }

  function cancelWorkspace() {
    setSelectedNoteId(null);
    setDraft(emptyDraft);
    setAttachments([]);
    setPreviewUrls({});
    setSaveStatus("draft");
    setError("");
    setNotice("");
    setEditorMode("write");
    setWorkspaceVisible(false);
  }

  function resetAfterSuccessfulSave(savedNote) {
    setSelectedNoteId(null);
    setDraft(emptyDraft);
    setAttachments([]);
    setPreviewUrls({});
    setSaveStatus("draft");
    setError("");
    setNotice(`Saved "${savedNote.title}". Ready for a new note.`);
    setEditorMode("write");
    setWorkspaceVisible(false);
  }

  async function persistNote() {
    if (!user || !draft.title.trim() || !draft.subjectId) {
      throw new Error("Add a title and subject before saving.");
    }

    const payload = {
      userId: user.id,
      title: draft.title.trim(),
      subjectId: draft.subjectId,
      content: draft.content.trim(),
    };

    if (selectedNoteId) {
      const updated = await updateNote(selectedNoteId, payload);
      setNotes((current) =>
        current.map((note) => (note.id === selectedNoteId ? updated : note)),
      );
      return updated;
    }

    const created = await createNote(payload);
    setNotes((current) => [created, ...current]);
    setSelectedNoteId(created.id);
    return created;
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      const saved = await persistNote();
      resetAfterSuccessfulSave(saved);
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

      setSelectedNoteId(null);
      setDraft(emptyDraft);
      setAttachments([]);
      setPreviewUrls({});
      setSaveStatus("draft");
      setWorkspaceVisible(false);
      setNotice("Note deleted.");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function insertMarkdown(action) {
    const textarea = textareaRef.current;
    const current = draft.content;
    const start = textarea?.selectionStart ?? current.length;
    const end = textarea?.selectionEnd ?? current.length;
    const selected = current.slice(start, end) || action.fallback;
    const next = `${current.slice(0, start)}${action.before}${selected}${action.after}${current.slice(end)}`;
    updateDraft({ content: next });

    window.requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = start + action.before.length + selected.length + action.after.length;
      textarea?.setSelectionRange(cursor, cursor);
    });
  }

  async function handleUpload(files) {
    for (const file of files) {
      try {
        validateNoteAttachment(file);
      } catch (validationError) {
        setError(validationError.message);
        setNotice("");
        return;
      }
    }

    try {
      setUploading(true);
      setError("");
      setNotice("");

      const targetNote = selectedNoteId && selectedNote
        ? selectedNote
        : await persistNote();

      const uploadedRows = [];
      for (const file of files) {
        uploadedRows.push(
          await uploadNoteAttachment({
            file,
            noteId: targetNote.id,
            userId: user.id,
          }),
        );
      }

      setAttachments((current) => [...uploadedRows, ...current]);
      setNotes((current) =>
        current.map((note) =>
          note.id === targetNote.id
            ? {
                ...note,
                note_attachments: [...uploadedRows, ...(note.note_attachments ?? [])],
              }
            : note,
        ),
      );
      const imageRows = uploadedRows.filter((item) => item.file_type?.startsWith("image/"));
      const entries = await Promise.all(
        imageRows.map(async (item) => [item.id, await createAttachmentSignedUrl(item.file_path)]),
      );
      setPreviewUrls((current) => ({ ...current, ...Object.fromEntries(entries) }));
      setSaveStatus("saved");
      setNotice(`${uploadedRows.length} file${uploadedRows.length === 1 ? "" : "s"} attached.`);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleOpenAttachment(attachment) {
    try {
      const signedUrl = await createAttachmentSignedUrl(attachment.file_path);
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (openError) {
      setError(openError.message);
    }
  }

  async function handleDeleteAttachment(attachment) {
    try {
      setDeletingAttachmentId(attachment.id);
      setError("");
      await deleteNoteAttachment(attachment, user.id);
      setAttachments((current) => current.filter((item) => item.id !== attachment.id));
      setNotes((current) =>
        current.map((note) =>
          note.id === selectedNoteId
            ? {
                ...note,
                note_attachments: (note.note_attachments ?? []).filter((item) => item.id !== attachment.id),
              }
            : note,
        ),
      );
      setPreviewUrls((current) => {
        const next = { ...current };
        delete next[attachment.id];
        return next;
      });
      setNotice("Attachment removed.");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingAttachmentId(null);
    }
  }

  async function handleSummarize(note) {
    if (!note?.id || summarizingNoteId === note.id) return;

    try {
      setSummarizingNoteId(note.id);
      setError("");
      setNotice("");
      setNotes((current) =>
        current.map((item) =>
          item.id === note.id
            ? { ...item, ai_summary_status: "pending", ai_summary_error: null }
            : item,
        ),
      );

      const summary = await summarizeNote(note.id);

      setNotes((current) =>
        current.map((item) => (item.id === note.id ? summary : item)),
      );
      setNotice(`Summary saved for "${summary.title}".`);
    } catch (summaryError) {
      setError(summaryError.message);
    } finally {
      setSummarizingNoteId(null);
    }
  }

  return (
    <WarRoomShell
      eyebrow="Knowledge Capture"
      title="AI Study War Room"
      description="Write markdown notes, attach source files, and prepare clean study context for future AI summaries, flashcards, quizzes, and weak-topic detection."
      action={
        <AddButton onClick={startNewNote} disabled={subjects.length === 0}>
          New Note
        </AddButton>
      }
    >
      <div className="grid gap-6">
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/15 p-4 text-sm text-primary">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <span>{error}</span>
          </div>
        )}

        {notice && !error && (
          <div className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/15 p-4 text-sm text-primary">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>{notice}</span>
          </div>
        )}

        {subjects.length === 0 && !loading ? (
          <CommandCard>
            <CardHeader eyebrow="Setup Required" title="Create a Subject First" icon={BookOpen} />
            <p className="max-w-2xl leading-7 text-secondary">
              Notes are linked to subjects in your workspace. Create a subject before adding your first note.
            </p>
          </CommandCard>
        ) : (
          <div className="grid gap-6">
            <RecentNotesLibrary
              loading={loading}
              notes={notes}
              selectedNoteId={selectedNoteId}
              summarizingNoteId={summarizingNoteId}
              onSelect={selectNoteDraft}
              onSummarize={handleSummarize}
            />

            <AnimatePresence initial={false}>
              {workspaceVisible && (
                <motion.div
                  key="notes-workspace"
                  variants={workspaceVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,23rem)] 2xl:grid-cols-[minmax(0,1fr)_24rem]"
                >
                  <section className="grid min-w-0 gap-6">
                    <NotesHeader
                      draft={draft}
                      subjects={subjects}
                      selectedNote={selectedNote}
                      selectedSubject={selectedSubject}
                      saving={saving}
                      saveStatus={saveStatus}
                      onChangeDraft={updateDraft}
                      onCancel={cancelWorkspace}
                      onDelete={handleDelete}
                      onSave={handleSave}
                    />

                    <MarkdownEditor
                      content={draft.content}
                      mode={editorMode}
                      textareaRef={textareaRef}
                      onChange={(content) => updateDraft({ content })}
                      onModeChange={setEditorMode}
                      onToolbarAction={insertMarkdown}
                    />
                  </section>

                  <aside className="grid min-w-0 gap-5 xl:sticky xl:top-4 xl:self-start">
                    <AttachmentUploader
                      attachments={attachments}
                      previewUrls={previewUrls}
                      uploading={uploading}
                      deletingId={deletingAttachmentId}
                      onUpload={handleUpload}
                      onOpen={handleOpenAttachment}
                      onDelete={handleDeleteAttachment}
                    />

                    <SelectedSummaryPanel
                      note={selectedNote}
                      summarizing={summarizingNoteId === selectedNote?.id}
                      onSummarize={handleSummarize}
                    />

                    <NoteSavePanel content={draft.content} attachments={attachments} aiReadyContext={aiReadyContext} />
                  </aside>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </WarRoomShell>
  );
}
