-- Production hardening for the existing Readiora project.

alter function public.handle_new_user_profile()
  set search_path = public, auth;

alter function public.set_attachment_extractions_updated_at()
  set search_path = public;

alter function public.set_flashcard_sets_updated_at()
  set search_path = public;

alter function public.set_notes_ai_summary_updated_at()
  set search_path = public;

revoke execute on function public.handle_new_user_profile() from public, anon, authenticated;

-- Public buckets can serve object URLs without a broad table-listing policy.
drop policy if exists "Public can view avatars" on storage.objects;

create index if not exists ai_generation_sources_attachment_id_idx
  on public.ai_generation_sources (attachment_id);

create index if not exists ai_generation_sources_note_id_idx
  on public.ai_generation_sources (note_id);

create index if not exists ai_messages_user_id_idx
  on public.ai_messages (user_id);

create index if not exists document_chunks_extraction_id_idx
  on public.document_chunks (extraction_id);

create index if not exists document_chunks_note_id_idx
  on public.document_chunks (note_id);

create index if not exists quiz_attempts_quiz_id_idx
  on public.quiz_attempts (quiz_id);

create index if not exists quiz_questions_source_note_id_idx
  on public.quiz_questions (source_note_id);

create index if not exists quizzes_note_id_idx
  on public.quizzes (note_id);

create index if not exists study_sessions_subject_id_idx
  on public.study_sessions (subject_id);

create index if not exists study_sessions_user_id_idx
  on public.study_sessions (user_id);

create index if not exists subjects_user_id_idx
  on public.subjects (user_id);
