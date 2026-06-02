import { supabase } from "../lib/supabase";

const sessionSelect = `
  *,
  subjects (
    id,
    name,
    color
  )
`;

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function normalizeMinutes(value, fallback = 30) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(1, Math.round(parsed));
}

function startOfLocalDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatWeekRange(startDate, endDate) {
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const start = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  }).format(startDate);
  const end = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(endDate);

  return `${start} - ${end}`;
}

function formatLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSundayWeekStart(date) {
  const today = startOfLocalDay(date);
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  return sunday;
}

function getSessionDate(session) {
  return new Date(session.ended_at || session.started_at || session.created_at);
}

export async function getStudySessions(userId, limit = 50) {
  const { data, error } = await supabase
    .from("study_sessions")
    .select(sessionSelect)
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function createTimerStudySession({
  userId,
  subjectId,
  title,
  durationMinutes,
  reflection,
  startedAt,
  endedAt,
}) {
  const completedAt = endedAt || new Date().toISOString();
  const started = startedAt || new Date(Date.now() - normalizeMinutes(durationMinutes) * 60000).toISOString();

  const { data, error } = await supabase
    .from("study_sessions")
    .insert({
      user_id: userId,
      subject_id: subjectId,
      title: title.trim(),
      duration_minutes: normalizeMinutes(durationMinutes),
      reflection: reflection?.trim() || null,
      completed: true,
      started_at: started,
      ended_at: completedAt,
    })
    .select(sessionSelect)
    .single();

  if (error) throw error;
  return data;
}

export async function createManualStudySession({
  userId,
  subjectId,
  title,
  durationMinutes,
  reflection,
  startedAt,
}) {
  const duration = normalizeMinutes(durationMinutes);
  const started = startedAt ? new Date(startedAt) : new Date();
  const ended = new Date(started.getTime() + duration * 60000);

  const { data, error } = await supabase
    .from("study_sessions")
    .insert({
      user_id: userId,
      subject_id: subjectId,
      title: title.trim(),
      duration_minutes: duration,
      reflection: reflection?.trim() || null,
      completed: true,
      started_at: started.toISOString(),
      ended_at: ended.toISOString(),
    })
    .select(sessionSelect)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStudySession(sessionId, userId) {
  let query = supabase
    .from("study_sessions")
    .delete()
    .eq("id", sessionId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;

  if (error) throw error;
}

export async function getStudySessionSummary(userId) {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("id, duration_minutes, completed, started_at, ended_at")
    .eq("user_id", userId)
    .eq("completed", true)
    .order("started_at", { ascending: false });

  if (error) throw error;

  const sessions = data ?? [];
  const today = startOfLocalDay(new Date());
  const weekStart = getSundayWeekStart(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weeklyMinutes = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);

    const value = sessions
      .filter((session) => {
        const sessionDay = startOfLocalDay(getSessionDate(session));
        return sessionDay.getTime() === day.getTime();
      })
      .reduce((sum, session) => sum + Number(session.duration_minutes || 0), 0);

    return {
      label: dayLabels[day.getDay()],
      dateLabel: formatShortDate(day),
      isoDate: formatLocalDateKey(day),
      isToday: day.getTime() === today.getTime(),
      value: Math.round((value / 60) * 10) / 10,
    };
  });

  const completedDates = new Set(
    sessions.map((session) => formatLocalDateKey(startOfLocalDay(getSessionDate(session)))),
  );

  let streak = 0;
  let cursor = new Date(today);

  if (!completedDates.has(formatLocalDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (completedDates.has(formatLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const totalMinutes = sessions.reduce((sum, session) => sum + Number(session.duration_minutes || 0), 0);
  const weeklyTotalMinutes = weeklyMinutes.reduce((sum, day) => sum + day.value * 60, 0);

  return {
    weeklyHours: weeklyMinutes,
    weekRangeLabel: formatWeekRange(weekStart, weekEnd),
    weekStart: formatLocalDateKey(weekStart),
    weekEnd: formatLocalDateKey(weekEnd),
    weeklyTotalHours: Math.round((weeklyTotalMinutes / 60) * 10) / 10,
    streakDays: streak,
    totalSessions: sessions.length,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
  };
}
