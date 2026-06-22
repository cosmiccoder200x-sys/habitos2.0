export const LEVELS = [
  { level: 1, min: 0, title: "Seedling" },
  { level: 2, min: 100, title: "Sprout" },
  { level: 3, min: 250, title: "Grinder" },
  { level: 4, min: 500, title: "Focused" },
  { level: 5, min: 900, title: "Champion" },
  { level: 6, min: 1400, title: "Legend" },
  { level: 7, min: 2000, title: "Unstoppable" },
];

export const HABIT_ICONS = ["🏃", "📚", "💧", "🧘", "🍎", "💪", "😴", "✍️", "🎯", "🌿"];
export const TASK_PRIORITIES = ["low", "medium", "high"];
export const PRIORITY_COLOR = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };

export const QUOTES = [
  "Small steps every day lead to massive results.",
  "Discipline is choosing between what you want now and what you want most.",
  "You don't rise to your goals, you fall to your systems.",
  "Consistency beats intensity every single time.",
  "Every rep counts. Every habit compounds.",
];

export const POMODORO_PRESETS = [
  { label: "25 / 5", work: 25, rest: 5 },
  { label: "50 / 10", work: 50, rest: 10 },
  { label: "90 / 20", work: 90, rest: 20 },
];

export const BADGES = [
  { id: "first_habit", title: "First Habit", icon: "🌱", desc: "Create your first habit", unlock: (s) => s.habits.length >= 1 },
  { id: "streak_7", title: "7-Day Streak", icon: "🔥", desc: "Hit a 7-day streak", unlock: (s) => s.maxStreak >= 7 },
  { id: "streak_30", title: "30-Day Streak", icon: "🏅", desc: "Hit a 30-day streak", unlock: (s) => s.maxStreak >= 30 },
  { id: "xp_100", title: "100 XP", icon: "⚡", desc: "Earn 100 XP", unlock: (s) => s.xp >= 100 },
  { id: "xp_1000", title: "1000 XP", icon: "💠", desc: "Earn 1000 XP", unlock: (s) => s.xp >= 1000 },
  { id: "task_master", title: "Task Master", icon: "✅", desc: "Complete 20 tasks", unlock: (s) => s.doneTasks >= 20 },
  { id: "pomodoro_warrior", title: "Pomodoro Warrior", icon: "🍅", desc: "Complete 20 Pomodoros", unlock: (s) => s.pomodoros >= 20 },
];

export function todayStr(date = new Date()) {
  return date.toISOString().split("T")[0];
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function parseISODate(s) {
  return new Date(`${s}T00:00:00`);
}

export function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(date);
}

export function formatLongDate(date) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "long", month: "short", day: "numeric" }).format(date);
}

export function weekdayName(date) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date);
}

export function monthLabel(date) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(date);
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date = new Date()) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfMonth(date = new Date()) {
  const d = startOfMonth(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getLevelInfo(xp) {
  let info = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.min) info = l;
  const next = LEVELS.find((l) => l.min > xp);
  const progress = next ? Math.round(((xp - info.min) / (next.min - info.min)) * 100) : 100;
  return { ...info, next, progress };
}

export function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function buildActivityMap({ habits = [], tasks = [], sessionLog = [] }) {
  const map = new Map();
  const bump = (key, amount = 1) => map.set(key, (map.get(key) || 0) + amount);

  habits.forEach((habit) => {
    (habit.completedDates || []).forEach((d) => bump(d, 1));
  });
  tasks.forEach((task) => {
    (task.completedDates || []).forEach((d) => bump(d, 1));
  });
  sessionLog.forEach((entry) => bump(entry.date, entry.minutes ? Math.max(1, Math.round(entry.minutes / 25)) : 1));

  return map;
}

export function lastNDays(n = 365) {
  const out = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) out.push(todayStr(addDays(end, -i)));
  return out;
}

export function getIntensitiesForDateRange({ start, end, activityMap }) {
  const out = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const stop = new Date(end);
  stop.setHours(0, 0, 0, 0);
  while (cur <= stop) {
    const key = todayStr(cur);
    out.push({ date: key, value: activityMap.get(key) || 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export function intensityClass(value) {
  if (value <= 0) return "i0";
  if (value === 1) return "i1";
  if (value <= 3) return "i2";
  if (value <= 5) return "i3";
  return "i4";
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

export function average(arr) {
  if (!arr.length) return 0;
  return sum(arr) / arr.length;
}

export function createCalendarDays(date = new Date()) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = [];
  const lead = (start.getDay() + 6) % 7;
  for (let i = 0; i < lead; i++) days.push(null);
  const cur = new Date(start);
  while (cur <= end) {
    days.push(todayStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function isWeekend(isoDate) {
  const d = parseISODate(isoDate);
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function streakFromDates(dates = []) {
  const set = new Set(dates);
  let streak = 0;
  let d = new Date();
  d.setHours(0,0,0,0);
  while (set.has(todayStr(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
