import { useEffect, useMemo, useRef, useState } from "react";
import Dashboard from "./components/Dashboard";
import Heatmap from "./components/Heatmap";
import Achievements from "./components/Achievements";
import Analytics from "./components/Analytics";
import DailyMissions from "./components/DailyMissions";
import ProductivityPet from "./components/ProductivityPet";
import DataManager from "./components/DataManager";
import {
  BADGES,
  HABIT_ICONS,
  POMODORO_PRESETS,
  PRIORITY_COLOR,
  QUOTES,
  TASK_PRIORITIES,
  addDays,
  average,
  buildActivityMap,
  clamp,
  createCalendarDays,
  getLevelInfo,
  getIntensitiesForDateRange,
  isWeekend,
  lastNDays,
  monthLabel,
  parseISODate,
  safeParse,
  startOfMonth,
  startOfWeek,
  streakFromDates,
  sum,
  todayStr,
} from "./lib/productivity";

const STORAGE = {
  habits: "htp_habits",
  tasks: "htp_tasks",
  xp: "htp_xp",
  missions: "htp_missions",
  badges: "htp_badges",
  sessionLog: "htp_session_log",
  focusMinutes: "htp_focus_minutes",
  journal: "htp_journal",
};

function load(key, fallback) {
  return safeParse(localStorage.getItem(key) || JSON.stringify(fallback), fallback);
}

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCurrentDate() {
  return todayStr();
}

function getActivityCountForDay(day, habits, tasks, sessionLog) {
  const h = habits.reduce((acc, habit) => acc + ((habit.completedDates || []).includes(day) ? 1 : 0), 0);
  const t = tasks.reduce((acc, task) => acc + ((task.completedDates || []).includes(day) ? 1 : 0), 0);
  const s = sessionLog.reduce((acc, ses) => acc + (ses.date === day ? Math.max(1, Math.round((ses.minutes || 0) / 25)) : 0), 0);
  return h + t + s;
}

function calcStats({ habits, tasks, xp, sessionLog, focusMinutes }) {
  const today = getCurrentDate();
  const todayHabitsDone = habits.filter((h) => (h.completedDates || []).includes(today)).length;
  const todayTasksDone = tasks.filter((t) => (t.completedDates || []).includes(today)).length;
  const dailyProgress = habits.length ? Math.round((todayHabitsDone / habits.length) * 100) : 0;

  const maxStreak = habits.reduce((m, h) => Math.max(m, h.streak || 0), 0);
  const bestHabit = habits.reduce((best, h) => {
    const count = (h.completedDates || []).length;
    return !best || count > best.count ? { name: h.name, count, streak: h.streak || 0 } : best;
  }, null);

  const days = lastNDays(14);
  const currentWeek = days.slice(7);
  const prevWeek = days.slice(0, 7);

  const currentActivity = currentWeek.reduce((acc, d) => acc + getActivityCountForDay(d, habits, tasks, sessionLog), 0);
  const prevActivity = prevWeek.reduce((acc, d) => acc + getActivityCountForDay(d, habits, tasks, sessionLog), 0);
  const improvement = prevActivity === 0 ? (currentActivity > 0 ? 100 : 0) : Math.round(((currentActivity - prevActivity) / prevActivity) * 100);

  const currentWeekXp = currentWeek.reduce((acc, d) => {
    const habitXp = habits.reduce((a, h) => a + ((h.completedDates || []).includes(d) ? h.xp : 0), 0);
    const taskXp = tasks.reduce((a, t) => a + ((t.completedDates || []).includes(d) ? 15 : 0), 0);
    const sessionXp = sessionLog.reduce((a, s) => a + (s.date === d ? 50 : 0), 0);
    return acc + habitXp + taskXp + sessionXp;
  }, 0);

  const prevWeekXp = prevWeek.reduce((acc, d) => {
    const habitXp = habits.reduce((a, h) => a + ((h.completedDates || []).includes(d) ? h.xp : 0), 0);
    const taskXp = tasks.reduce((a, t) => a + ((t.completedDates || []).includes(d) ? 15 : 0), 0);
    const sessionXp = sessionLog.reduce((a, s) => a + (s.date === d ? 50 : 0), 0);
    return acc + habitXp + taskXp + sessionXp;
  }, 0);

  const doneTasks = tasks.filter((t) => (t.completedDates || []).length > 0).length;
  const sessions = sessionLog.length;
  const focusScore = clamp(Math.round(
    (dailyProgress * 0.35) +
    (Math.min(100, (doneTasks / Math.max(tasks.length, 1)) * 100) * 0.20) +
    (Math.min(100, (sessions / 4) * 100) * 0.25) +
    (Math.min(100, maxStreak * 5) * 0.20)
  ), 0, 100);

  const completedSet = new Set([
    ...habits.flatMap((h) => h.completedDates || []),
    ...tasks.flatMap((t) => t.completedDates || []),
  ]);

  const weeklyReview = {
    currentXp: currentWeekXp,
    tasksDone: tasks.reduce((acc, t) => acc + (t.completedDates || []).filter((d) => currentWeek.includes(d)).length, 0),
    improvement,
    completionRate: currentActivity,
    focusHours: focusMinutes / 60,
    prevWeekXp,
  };

  const insights = [
    {
      title: "Best performing habit",
      body: bestHabit ? `${bestHabit.name} has ${bestHabit.count} completions and a ${bestHabit.streak} day streak.` : "Add habits to see your strongest pattern.",
    },
    {
      title: "Longest streak",
      body: maxStreak ? `${maxStreak} days is your current best consistency.` : "No streak data yet — start completing habits daily.",
    },
    {
      title: "Most productive day",
      body: (() => {
        const weekMap = new Map();
        habits.forEach((h) => (h.completedDates || []).forEach((d) => weekMap.set(d, (weekMap.get(d) || 0) + 1)));
        tasks.forEach((t) => (t.completedDates || []).forEach((d) => weekMap.set(d, (weekMap.get(d) || 0) + 1)));
        sessionLog.forEach((s) => weekMap.set(s.date, (weekMap.get(s.date) || 0) + 1));
        const top = [...weekMap.entries()].sort((a, b) => b[1] - a[1])[0];
        return top ? `${top[0]} with ${top[1]} completed actions.` : "Complete a few actions to generate this insight.";
      })(),
    },
    {
      title: "Completion trends",
      body: currentActivity >= prevActivity
        ? `You improved by ${Math.max(0, improvement)}% compared with the previous week.`
        : `Your activity dipped by ${Math.abs(improvement)}% versus the previous week.`,
    },
  ];

  const coachTips = [];
  const exerciseHabit = habits.find((h) => /exercise|workout|gym|run|walk|yoga/i.test(h.name));
  if (exerciseHabit && (exerciseHabit.completedDates || []).some((d) => isWeekend(d))) {
    coachTips.push(`You are more consistent with ${exerciseHabit.name} on weekends. Keep that slot protected.`);
  } else if (exerciseHabit) {
    coachTips.push(`You often miss ${exerciseHabit.name} on weekends. Try scheduling it before noon.`);
  }
  if (bestHabit) coachTips.push(`${bestHabit.name} is your strongest habit. Use it as an anchor for a tougher routine.`);
  if (!coachTips.length) coachTips.push("Add more data for smarter suggestions. The coach will spot patterns automatically.");

  const petStage = xp < 100 ? "Seed" : xp < 300 ? "Plant" : xp < 800 ? "Tree" : "Forest";

  const missionSummary = { claimed: 0, available: 0 };

  return {
    todayHabitsDone,
    todayTasksDone,
    dailyProgress,
    maxStreak,
    bestHabit,
    currentWeekXp,
    weeklyReview,
    insights,
    coachTips,
    focusScore,
    completedSet,
    petStage,
    missionSummary,
  };
}

function buildMissions({ habits, tasks, sessionLog, missionClaims, xp }) {
  const today = getCurrentDate();
  const completedHabits = habits.filter((h) => (h.completedDates || []).includes(today)).length;
  const completedTasks = tasks.filter((t) => (t.completedDates || []).includes(today)).length;
  const completedPomodoros = sessionLog.filter((s) => s.date === today).length;

  const raw = [
    {
      id: "habits_3",
      title: "Complete 3 habits",
      detail: "Hit three habit completions today.",
      reward: 25,
      done: completedHabits >= 3,
      progress: `${completedHabits}/3`,
    },
    {
      id: "tasks_2",
      title: "Finish 2 tasks",
      detail: "Close at least two tasks today.",
      reward: 25,
      done: completedTasks >= 2,
      progress: `${completedTasks}/2`,
    },
    {
      id: "pomodoros_2",
      title: "Complete 2 Pomodoros",
      detail: "Finish two focus sessions today.",
      reward: 50,
      done: completedPomodoros >= 2,
      progress: `${completedPomodoros}/2`,
    },
  ];

  const claims = missionClaims[today] || {};
  return raw.map((m) => ({ ...m, claimed: !!claims[m.id] }));
}

function badgeSnapshot({ habits, tasks, xp, sessionLog }) {
  const doneTasks = tasks.filter((t) => (t.completedDates || []).length > 0).length;
  const maxStreak = habits.reduce((m, h) => Math.max(m, h.streak || 0), 0);
  return { habits, tasks, xp, maxStreak, doneTasks, pomodoros: sessionLog.length };
}

function Journal() {
  const [entries, setEntries] = useState(() => load(STORAGE.journal, []));
  const [text, setText] = useState("");
  const [mood, setMood] = useState("😊");
  const moods = ["😊", "😤", "😌", "😴", "💪", "😰"];

  useEffect(() => persist(STORAGE.journal, entries), [entries]);

  const addEntry = () => {
    if (!text.trim()) return;
    const entry = { id: Date.now(), text: text.trim(), mood, date: getCurrentDate(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setEntries((prev) => [entry, ...prev].slice(0, 30));
    setText("");
  };

  return (
    <div style={{ background: "#13131f", borderRadius: 20, padding: 20, border: "1px solid #2a2a3e" }}>
      <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 12, letterSpacing: 2, marginBottom: 14 }}>DAILY JOURNAL</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {moods.map((m) => (
          <button key={m} onClick={() => setMood(m)} style={{
            fontSize: 18, background: mood === m ? "#2a2a3e" : "none", border: mood === m ? "1px solid #7c3aed" : "1px solid transparent",
            borderRadius: 8, padding: "4px 6px", cursor: "pointer",
          }}>{m}</button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's on your mind today?"
        style={{
          width: "100%", minHeight: 80, background: "#0d0d1a", border: "1px solid #2a2a3e",
          borderRadius: 10, color: "#e2e8f0", fontSize: 13, padding: 12,
          resize: "none", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
        }}
      />
      <button onClick={addEntry} style={{
        marginTop: 8, width: "100%", padding: "10px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
        color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
      }}>Save Entry</button>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto" }}>
        {entries.length === 0 ? (
          <div style={{ color: "#64748b", textAlign: "center", padding: "20px 0" }}>No journal entries yet.</div>
        ) : entries.map((e) => (
          <div key={e.id} style={{ background: "#0d0d1a", borderRadius: 10, padding: "10px 12px", border: "1px solid #1e1e2e" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>{e.mood}</span>
              <span style={{ color: "#3f3f5a", fontSize: 11 }}>{e.date} {e.time}</span>
            </div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>{e.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          background: t.type === "xp" ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : t.type === "badge" ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "#1e1e2e",
          color: "#fff", padding: "10px 18px", borderRadius: 12, fontSize: 13,
          fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          animation: "slideIn 0.3s ease", display: "flex", alignItems: "center", gap: 8,
        }}>
          {t.icon} {t.message}
        </div>
      ))}
    </div>
  );
}

function XPBar({ xp }) {
  const { level, title, next, progress } = getLevelInfo(xp);
  return (
    <div style={{ background: "#13131f", borderRadius: 14, padding: "14px 18px", border: "1px solid #2a2a3e" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 800, color: "#fff",
          }}>
            {level}
          </div>
          <div>
            <div style={{ color: "#a78bfa", fontSize: 12, fontWeight: 600, letterSpacing: 1 }}>LEVEL {level}</div>
            <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 700 }}>{title}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#7c3aed", fontSize: 18, fontWeight: 800 }}>{xp} XP</div>
          {next && <div style={{ color: "#64748b", fontSize: 11 }}>{next.min - xp} to Level {next.level}</div>}
        </div>
      </div>
      <div style={{ background: "#1e1e2e", borderRadius: 999, height: 7, overflow: "hidden" }}>
        <div style={{
          width: `${progress}%`, height: "100%",
          background: "linear-gradient(90deg,#7c3aed,#818cf8)",
          transition: "width 0.6s ease", borderRadius: 999,
        }} />
      </div>
    </div>
  );
}

function HabitCard({ habit, onToggle, onDelete }) {
  const done = habit.completedDates?.includes(getCurrentDate());
  const streak = habit.streak || 0;
  return (
    <div style={{
      background: done ? "linear-gradient(135deg,#1a1a2e,#16213e)" : "#13131f",
      border: `1px solid ${done ? "#7c3aed44" : "#2a2a3e"}`,
      borderRadius: 14, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 14,
      transition: "all 0.25s ease", cursor: "pointer",
      boxShadow: done ? "0 0 20px #7c3aed22" : "none",
    }}>
      <button onClick={() => onToggle(habit.id)} style={{
        width: 36, height: 36, borderRadius: "50%",
        background: done ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "transparent",
        border: `2px solid ${done ? "#7c3aed" : "#3f3f5a"}`,
        color: "#fff", fontSize: 16, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", flexShrink: 0,
      }}>
        {done ? "✓" : ""}
      </button>
      <div style={{ fontSize: 22 }}>{habit.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: done ? "#a78bfa" : "#e2e8f0", fontWeight: 700, fontSize: 15, textDecoration: done ? "line-through" : "none", opacity: done ? 0.7 : 1 }}>
          {habit.name}
        </div>
        <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>+{habit.xp} XP per day</div>
      </div>
      <div style={{ textAlign: "center", minWidth: 48 }}>
        <div style={{ fontSize: 18 }}>🔥</div>
        <div style={{ color: streak > 0 ? "#f59e0b" : "#3f3f5a", fontWeight: 800, fontSize: 15 }}>{streak}</div>
      </div>
      <button onClick={() => onDelete(habit.id)} style={{
        background: "none", border: "none", color: "#3f3f5a", fontSize: 16, cursor: "pointer", padding: 4,
      }}>✕</button>
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete }) {
  // Use completedDates for today's completion state (source of truth)
  const todayKey = todayStr();
  const isDoneToday = (task.completedDates || []).includes(todayKey);
  return (
    <div style={{
      background: isDoneToday ? "#0d0d1a" : "#13131f",
      border: `1px solid ${isDoneToday ? "#1e1e2e" : "#2a2a3e"}`,
      borderLeft: `3px solid ${PRIORITY_COLOR[task.priority]}`,
      borderRadius: 12, padding: "12px 14px",
      display: "flex", alignItems: "center", gap: 12,
      opacity: isDoneToday ? 0.5 : 1, transition: "all 0.2s",
    }}>
      <button onClick={() => onToggle(task.id)} style={{
        width: 22, height: 22, borderRadius: 6,
        background: isDoneToday ? PRIORITY_COLOR[task.priority] : "transparent",
        border: `2px solid ${isDoneToday ? PRIORITY_COLOR[task.priority] : "#3f3f5a"}`,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: 12, flexShrink: 0,
      }}>
        {isDoneToday ? "✓" : ""}
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 14, textDecoration: isDoneToday ? "line-through" : "none" }}>
          {task.task}
        </div>
        {task.note && <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{task.note}</div>}
      </div>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
        color: PRIORITY_COLOR[task.priority], background: PRIORITY_COLOR[task.priority] + "22",
        padding: "2px 8px", borderRadius: 999, textTransform: "uppercase",
      }}>
        {task.priority}
      </div>
      <button onClick={() => onDelete(task.id)} style={{
        background: "none", border: "none", color: "#3f3f5a", fontSize: 14, cursor: "pointer",
      }}>✕</button>
    </div>
  );
}

function PomodoroTimer({ onSessionComplete }) {
  const [preset, setPreset] = useState(0);
  const [isWork, setIsWork] = useState(true);
  const [seconds, setSeconds] = useState(POMODORO_PRESETS[0].work * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [pulse, setPulse] = useState(false);
  const ref = useRef(null);

  const p = POMODORO_PRESETS[preset];
  const total = (isWork ? p.work : p.rest) * 60;
  const pct = total ? ((total - seconds) / total) * 100 : 0;
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  const [ringSize, setRingSize] = useState(300);
  useEffect(() => {
    function calcSize() {
      const vw = window.innerWidth;
      if (vw >= 1280) setRingSize(340);
      else if (vw >= 1024) setRingSize(300);
      else if (vw >= 768) setRingSize(260);
      else setRingSize(Math.min(220, vw * 0.62));
    }
    calcSize();
    window.addEventListener("resize", calcSize);
    return () => window.removeEventListener("resize", calcSize);
  }, []);

  const r = ringSize * 0.42;
  const strokeW = ringSize * 0.036;
  const cx = ringSize / 2;
  const circumference = 2 * Math.PI * r;

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(ref.current);
          if (isWork) {
            setSessions((n) => n + 1);
            onSessionComplete?.(p.work);
          }
          setIsWork((w) => !w);
          const next = !isWork ? p.work : p.rest;
          setTimeout(() => {
            setSeconds(next * 60);
            setRunning(false);
          }, 100);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running, isWork, p, onSessionComplete]);

  useEffect(() => {
    if (running) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 120);
      return () => clearTimeout(t);
    }
  }, [seconds, running]);

  const presetRef = useRef(preset);
  useEffect(() => { presetRef.current = preset; }, [preset]);

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if (e.code === "Space") { e.preventDefault(); setRunning((r) => !r); }
      if (e.code === "KeyR") {
        clearInterval(ref.current);
        setRunning(false);
        setIsWork(true);
        setSeconds(POMODORO_PRESETS[presetRef.current].work * 60);
      }
      if (e.code === "KeyF") setFocusMode((f) => !f);
      if (e.code === "Escape") setFocusMode(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function reset() {
    clearInterval(ref.current);
    setRunning(false);
    setIsWork(true);
    setSeconds(p.work * 60);
  }

  function skip() {
    clearInterval(ref.current);
    setRunning(false);
    const next = !isWork;
    setIsWork(next);
    setSeconds((next ? p.work : p.rest) * 60);
  }

  function switchPreset(i) {
    setPreset(i);
    clearInterval(ref.current);
    setRunning(false);
    setIsWork(true);
    setSeconds(POMODORO_PRESETS[i].work * 60);
  }

  const accentColor = isWork ? "#7c3aed" : "#22c55e";
  const accentGlow = isWork ? "rgba(124,58,237,0.35)" : "rgba(34,197,94,0.35)";
  const timerFontSize = ringSize * 0.215;
  const labelFontSize = Math.max(11, ringSize * 0.052);

  return (
    <div style={{
      background: "linear-gradient(160deg, #10101e 0%, #13131f 60%, #0d0d1a 100%)",
      borderRadius: 28, border: "1px solid #1e1e2e",
      padding: "32px 24px 28px",
      display: "flex", flexDirection: "column", alignItems: "center",
      position: "relative", overflow: "hidden",
    }}>
      {focusMode && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "#060610",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 32,
        }}>
          <div style={{ color: "#3f3f5a", fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
            {isWork ? "Focus Session" : "Take a Break"}
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={ringSize * 1.3} height={ringSize * 1.3} style={{ transform: "rotate(-90deg)" }}>
              <defs>
                <filter id="glow-fm">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <circle cx={ringSize * 0.65} cy={ringSize * 0.65} r={r * 1.3} fill="none" stroke="#1a1a2e" strokeWidth={strokeW * 1.3} />
              <circle
                cx={ringSize * 0.65} cy={ringSize * 0.65} r={r * 1.3} fill="none"
                stroke={accentColor} strokeWidth={strokeW * 1.3}
                strokeDasharray={circumference * 1.3}
                strokeDashoffset={(circumference * 1.3) - (pct / 100) * (circumference * 1.3)}
                strokeLinecap="round"
                filter="url(#glow-fm)"
                style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)" }}
              />
            </svg>
            <div style={{ position: "absolute", textAlign: "center" }}>
              <div style={{
                color: "#fff",
                fontSize: timerFontSize * 1.4,
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.02em",
                filter: running ? `drop-shadow(0 0 ${pulse ? "18px" : "8px"} ${accentGlow})` : "none",
                transition: "filter 0.12s ease",
              }}>
                {mins}:{secs}
              </div>
              <div style={{ color: accentColor, fontSize: labelFontSize * 1.2, fontWeight: 700, letterSpacing: 3, marginTop: 4 }}>
                {isWork ? "FOCUS" : "BREAK"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <button onClick={() => setRunning((r) => !r)} style={{
              background: running ? "#1e1e2e" : `linear-gradient(135deg, ${accentColor}, ${isWork ? "#4f46e5" : "#16a34a"})`,
              color: "#fff", border: "none", borderRadius: 16,
              padding: "16px 48px", fontWeight: 800, fontSize: 18, cursor: "pointer",
              letterSpacing: 0.5,
              boxShadow: running ? "none" : `0 0 32px ${accentGlow}`,
            }}>
              {running ? "⏸  Pause" : "▶  Start"}
            </button>
            <button onClick={reset} title="Reset (R)" style={{
              background: "#13131f", color: "#64748b", border: "1px solid #2a2a3e",
              borderRadius: 12, width: 52, height: 52, fontWeight: 700, fontSize: 20, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>↺</button>
            <button onClick={skip} title="Skip" style={{
              background: "#13131f", color: "#64748b", border: "1px solid #2a2a3e",
              borderRadius: 12, width: 52, height: 52, fontWeight: 700, fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>⏭</button>
          </div>
          <div style={{ color: "#3f3f5a", fontSize: 13 }}>
            Sessions: <span style={{ color: "#f59e0b", fontWeight: 700 }}>{sessions}</span>
            &nbsp;·&nbsp;<span style={{ color: "#3f3f5a" }}>ESC to exit focus mode</span>
          </div>
          <button onClick={() => setFocusMode(false)} style={{
            position: "absolute", top: 20, right: 24,
            background: "none", border: "1px solid #2a2a3e", color: "#64748b",
            borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600,
          }}>✕ Exit Focus</button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 20, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["FOCUS", "BREAK"].map((phase) => {
            const active = (phase === "FOCUS") === isWork;
            return (
              <div key={phase} style={{
                padding: "4px 14px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
                background: active ? accentColor + "22" : "transparent",
                color: active ? accentColor : "#3f3f5a",
                border: `1px solid ${active ? accentColor + "44" : "transparent"}`,
              }}>{phase}</div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {POMODORO_PRESETS.map((pr, i) => (
            <button key={i} onClick={() => switchPreset(i)} style={{
              padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: preset === i ? "#7c3aed22" : "transparent",
              color: preset === i ? "#a78bfa" : "#3f3f5a",
              border: `1px solid ${preset === i ? "#7c3aed44" : "#2a2a3e"}`,
              cursor: "pointer",
            }}>{pr.label}</button>
          ))}
        </div>
      </div>

      <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
        <svg width={ringSize} height={ringSize} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isWork ? "#7c3aed" : "#22c55e"} />
              <stop offset="100%" stopColor={isWork ? "#a78bfa" : "#4ade80"} />
            </linearGradient>
            <filter id="ring-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#1e1e2e" strokeWidth={strokeW} />
          <circle
            cx={cx} cy={cx} r={r} fill="none"
            stroke="url(#ring-grad)" strokeWidth={strokeW}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (pct / 100) * circumference}
            strokeLinecap="round"
            filter="url(#ring-glow)"
            style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>
        <div style={{ position: "absolute", textAlign: "center" }}>
          <div style={{
            color: "#f1f5f9",
            fontSize: timerFontSize,
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.03em",
            lineHeight: 1,
            filter: running ? `drop-shadow(0 0 ${pulse ? "16px" : "6px"} ${accentGlow})` : "none",
            transition: "filter 0.12s ease",
          }}>
            {mins}:{secs}
          </div>
          <div style={{
            color: accentColor,
            fontSize: labelFontSize,
            fontWeight: 700,
            letterSpacing: 3,
            marginTop: ringSize * 0.025,
            textTransform: "uppercase",
            transition: "color 0.3s",
          }}>
            {isWork ? "Focus" : "Break"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 28, zIndex: 1 }}>
        <button onClick={reset} title="Reset (R)" style={{
          background: "#13131f", color: "#64748b",
          border: "1px solid #2a2a3e",
          borderRadius: 14, width: 52, height: 52,
          fontWeight: 700, fontSize: 20, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>↺</button>
        <button onClick={() => setRunning((r) => !r)} title="Start/Pause (Space)" style={{
          background: running ? "#1e1e2e" : `linear-gradient(135deg, ${accentColor}, ${isWork ? "#4f46e5" : "#16a34a"})`,
          color: "#fff", border: "none",
          borderRadius: 18,
          padding: "0 40px",
          height: 60,
          fontWeight: 800, fontSize: 17, cursor: "pointer",
          letterSpacing: 0.5,
          boxShadow: running ? "none" : `0 4px 28px ${accentGlow}`,
          minWidth: 160,
        }}>
          {running ? "⏸  Pause" : "▶  Start"}
        </button>
        <button onClick={skip} title="Skip to next phase" style={{
          background: "#13131f", color: "#64748b",
          border: "1px solid #2a2a3e",
          borderRadius: 14, width: 52, height: 52,
          fontWeight: 700, fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>⏭</button>
      </div>

      <div style={{
        display: "flex", gap: 24, marginTop: 22, zIndex: 1,
        padding: "12px 20px", background: "#0d0d1a", borderRadius: 12,
        border: "1px solid #1e1e2e",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 20 }}>{sessions}</div>
          <div style={{ color: "#3f3f5a", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>SESSIONS</div>
        </div>
        <div style={{ width: 1, background: "#1e1e2e" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ color: accentColor, fontWeight: 800, fontSize: 20 }}>{Math.round((total - seconds) / 60)}m</div>
          <div style={{ color: "#3f3f5a", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>ELAPSED</div>
        </div>
        <div style={{ width: 1, background: "#1e1e2e" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: 20 }}>{sessions * p.work}m</div>
          <div style={{ color: "#3f3f5a", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>FOCUSED</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 14, alignItems: "center", zIndex: 1, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[["Space","Play/Pause"], ["R","Reset"], ["F","Focus Mode"]].map(([key, label]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <kbd style={{
                background: "#1e1e2e", border: "1px solid #2a2a3e", borderRadius: 5,
                padding: "2px 7px", fontSize: 10, color: "#64748b", fontWeight: 700,
                fontFamily: "monospace",
              }}>{key}</kbd>
              <span style={{ color: "#3f3f5a", fontSize: 10 }}>{label}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setFocusMode(true)} style={{
          marginLeft: "auto",
          background: "linear-gradient(135deg,#7c3aed22,#4f46e522)",
          color: "#a78bfa", border: "1px solid #7c3aed44",
          borderRadius: 8, padding: "5px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}>⛶ Fullscreen</button>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [habits, setHabits] = useState(() => load(STORAGE.habits, []));
  const [tasks, setTasks] = useState(() => load(STORAGE.tasks, []));
  const [xp, setXp] = useState(() => Number(localStorage.getItem(STORAGE.xp) || 0));
  const [sessionLog, setSessionLog] = useState(() => load(STORAGE.sessionLog, []));
  const [focusMinutes, setFocusMinutes] = useState(() => Number(localStorage.getItem(STORAGE.focusMinutes) || 0));
  const [missionClaims, setMissionClaims] = useState(() => load(STORAGE.missions, {}));
  const [unlockedBadges, setUnlockedBadges] = useState(() => load(STORAGE.badges, []));
  const [toasts, setToasts] = useState([]);
  const [newHabit, setNewHabit] = useState("");
  const [habitIcon, setHabitIcon] = useState("🎯");
  const [habitXP, setHabitXP] = useState(20);
  const [newTask, setNewTask] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  useEffect(() => persist(STORAGE.habits, habits), [habits]);
  useEffect(() => persist(STORAGE.tasks, tasks), [tasks]);
  useEffect(() => localStorage.setItem(STORAGE.xp, String(xp)), [xp]);
  useEffect(() => persist(STORAGE.sessionLog, sessionLog), [sessionLog]);
  useEffect(() => localStorage.setItem(STORAGE.focusMinutes, String(focusMinutes)), [focusMinutes]);
  useEffect(() => persist(STORAGE.missions, missionClaims), [missionClaims]);
  useEffect(() => persist(STORAGE.badges, unlockedBadges), [unlockedBadges]);

  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const today = getCurrentDate();
  const activityMap = useMemo(() => buildActivityMap({ habits, tasks, sessionLog }), [habits, tasks, sessionLog]);
  const missions = useMemo(() => buildMissions({ habits, tasks, sessionLog, missionClaims, xp }), [habits, tasks, sessionLog, missionClaims, xp]);
  const stats = useMemo(() => calcStats({ habits, tasks, xp, sessionLog, focusMinutes }), [habits, tasks, xp, sessionLog, focusMinutes]);

  function addToast(message, type = "info", icon = "✨") {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }

  function toggleTabFromQuickAction(action) {
    if (action === "data") setTab("stats");
    else setTab(action);
  }

  function addHabit() {
    if (!newHabit.trim()) return;
    const h = { id: Date.now(), name: newHabit.trim(), icon: habitIcon, xp: habitXP, completedDates: [], streak: 0 };
    setHabits((prev) => [...prev, h]);
    setNewHabit("");
    addToast("Habit created", "info", "🌿");
  }

  function toggleHabit(id) {
    setHabits((prev) => prev.map((h) => {
      if (h.id !== id) return h;
      const dates = h.completedDates || [];
      if (dates.includes(today)) {
        const newDates = dates.filter((d) => d !== today);
        const streak = Math.max(0, (h.streak || 0) - 1);
        setXp((x) => Math.max(0, x - h.xp));
        return { ...h, completedDates: newDates, streak };
      }
      const yesterday = todayStr(addDays(new Date(), -1));
      const streak = (dates.includes(yesterday) ? (h.streak || 0) : 0) + 1;
      setXp((x) => x + h.xp);
      addToast(`+${h.xp} XP — ${h.name}`, "xp", h.icon);
      if (streak > 1) addToast(`🔥 ${streak} day streak!`, "badge", "🔥");
      return { ...h, completedDates: [...dates, today], streak };
    }));
  }

  function deleteHabit(id) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  function addTask() {
    if (!newTask.trim()) return;
    const t = { id: Date.now(), task: newTask.trim(), note: taskNote.trim(), priority: taskPriority, done: false, completedDates: [] };
    setTasks((prev) => [...prev, t]);
    setNewTask("");
    setTaskNote("");
  }

  function toggleTask(id) {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const isDone = t.completedDates?.includes(today);
      const completedDates = t.completedDates || [];
      if (isDone) return { ...t, done: false, completedDates: completedDates.filter((d) => d !== today) };
      setXp((x) => x + 15);
      addToast("+15 XP — Task done!", "xp", "✅");
      return { ...t, done: true, completedDates: [...completedDates, today] };
    }));
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handlePomodoroComplete(minutes) {
    setSessionLog((prev) => [...prev, { date: today, minutes, id: Date.now() }]);
    setFocusMinutes((m) => m + minutes);
    setXp((x) => x + 50);
    addToast("+50 XP — Pomodoro complete! 🍅", "xp", "🍅");
  }

  function claimMission(id) {
    const todayClaims = missionClaims[today] || {};
    const mission = missions.find((m) => m.id === id);
    if (!mission || !mission.done || mission.claimed) return;
    setMissionClaims((prev) => ({
      ...prev,
      [today]: { ...(prev[today] || {}), [id]: true },
    }));
    setXp((x) => x + mission.reward);
    addToast(`+${mission.reward} XP — Mission complete!`, "xp", "🎯");
  }

  useEffect(() => {
    const state = badgeSnapshot({ habits, tasks, xp, sessionLog });
    const unlockedNow = BADGES.filter((b) => b.unlock(state)).map((b) => b.id);
    const newOnes = unlockedNow.filter((id) => !unlockedBadges.includes(id));
    if (newOnes.length) {
      const badgeMap = Object.fromEntries(BADGES.map((b) => [b.id, b]));
      newOnes.forEach((id) => {
        const badge = badgeMap[id];
        addToast(`Badge unlocked: ${badge.title}`, "badge", badge.icon);
      });
      setUnlockedBadges((prev) => [...new Set([...prev, ...newOnes])]);
    }
  }, [habits, tasks, xp, sessionLog]);

  function exportSnapshot() {
    return {
      version: 1,
      habits,
      tasks,
      xp,
      sessionLog,
      focusMinutes,
      missionClaims,
      unlockedBadges,
    };
  }

  function importSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;
    setHabits(Array.isArray(snapshot.habits) ? snapshot.habits : []);
    setTasks(Array.isArray(snapshot.tasks) ? snapshot.tasks : []);
    setXp(Number(snapshot.xp || 0));
    setSessionLog(Array.isArray(snapshot.sessionLog) ? snapshot.sessionLog : []);
    setFocusMinutes(Number(snapshot.focusMinutes || 0));
    setMissionClaims(snapshot.missionClaims && typeof snapshot.missionClaims === "object" ? snapshot.missionClaims : {});
    setUnlockedBadges(Array.isArray(snapshot.unlockedBadges) ? snapshot.unlockedBadges : []);
    addToast("Backup imported", "info", "📦");
  }

  function resetAll() {
    if (!window.confirm("Reset all HabitOS data? This cannot be undone.")) return;
    setHabits([]);
    setTasks([]);
    setXp(0);
    setSessionLog([]);
    setFocusMinutes(0);
    setMissionClaims({});
    setUnlockedBadges([]);
    addToast("All data reset", "info", "🧹");
  }

  const todayCompletedSet = stats.completedSet;
  const allTasksDone = tasks.filter((t) => t.completedDates?.includes(today)).length;
  const completedHabits = habits.filter((h) => h.completedDates?.includes(today)).length;
  const missionsSummary = {
    available: missions.filter((m) => m.done && !m.claimed).length,
    claimed: missions.filter((m) => m.claimed).length,
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "focus", label: "Focus", icon: "⏱" },
    { id: "habits", label: "Habits", icon: "🌿" },
    { id: "tasks", label: "Tasks", icon: "✅" },
    { id: "stats", label: "Stats", icon: "📊" },
    { id: "journal", label: "Journal", icon: "📓" },
  ];

  const insights = stats.insights;
  const coachTips = stats.coachTips;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a14", color: "#e2e8f0", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0d0d1a; }
        ::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 99px; }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        input, textarea, select { font-family: inherit; }
        button { font-family: inherit; }
        button:focus-visible { outline: 2px solid #7c3aed; outline-offset: 2px; }
        @media (min-width: 1024px) {
          .focus-layout { display: grid !important; grid-template-columns: 1fr 340px !important; gap: 24px !important; align-items: start !important; max-width: 1100px !important; }
          .focus-sidebar { display: flex !important; flex-direction: column !important; gap: 16px !important; }
        }
        @media (max-width: 1023px) {
          .focus-layout { display: flex !important; flex-direction: column !important; gap: 16px !important; }
        }
      `}</style>

      <Toast toasts={toasts} />

      <div style={{
        background: "#0d0d1a", borderBottom: "1px solid #1e1e2e",
        padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, background: "linear-gradient(90deg,#a78bfa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            HabitOS ⚡
          </div>
          <div style={{ color: "#3f3f5a", fontSize: 11 }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#f59e0b", fontWeight: 800, fontSize: 16 }}>{completedHabits}/{habits.length}</div>
            <div style={{ color: "#3f3f5a", fontSize: 10 }}>Habits</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#22c55e", fontWeight: 800, fontSize: 16 }}>{allTasksDone}/{tasks.length}</div>
            <div style={{ color: "#3f3f5a", fontSize: 10 }}>Tasks</div>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 14, color: "#fff",
          }}>
            {getLevelInfo(xp).level}
          </div>
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg,#16213e,#1a1a2e)", padding: "8px 24px", borderBottom: "1px solid #1e1e2e" }}>
        <div style={{ color: "#64748b", fontSize: 12, fontStyle: "italic", textAlign: "center" }}>"{quote}"</div>
      </div>

      <div style={{ maxWidth: tab === "focus" ? 1140 : 1200, margin: "0 auto", padding: "20px 16px 100px", transition: "max-width 0.3s ease" }}>
        <div style={{ marginBottom: 20 }}>
          <XPBar xp={xp} />
        </div>

        {tab === "dashboard" && (
          <div style={{ display: "grid", gap: 16 }}>
            <Dashboard
              quote={quote}
              xp={xp}
              habits={habits}
              tasks={tasks}
              todayHabitsDone={completedHabits}
              todayTasksDone={allTasksDone}
              focusScore={stats.focusScore}
              dailyProgress={stats.dailyProgress}
              streakSummary={{ maxStreak: stats.maxStreak, bestHabit: stats.bestHabit?.name }}
              missionSummary={missionsSummary}
              petStage={stats.petStage}
              onQuickAction={toggleTabFromQuickAction}
              onGoToTab={setTab}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
              <DailyMissions missions={missions} onClaim={claimMission} />
              <ProductivityPet xp={xp} />
            </div>
          </div>
        )}

        {tab === "focus" && (
          <div className="focus-layout">
            <div>
              <PomodoroTimer onSessionComplete={handlePomodoroComplete} />
            </div>
            <div className="focus-sidebar">
              <div style={{ background: "#13131f", borderRadius: 18, padding: 18, border: "1px solid #2a2a3e" }}>
                <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>ACTIVE TASKS</div>
                {tasks.filter((t) => !t.completedDates?.includes(today)).length === 0 && (
                  <div style={{ color: "#3f3f5a", fontSize: 13, textAlign: "center", padding: "12px 0" }}>No active tasks</div>
                )}
                {tasks.filter((t) => !t.completedDates?.includes(today)).slice(0, 5).map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1a1a2e" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLOR[t.priority], flexShrink: 0 }} />
                    <div style={{ color: "#e2e8f0", fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.task}</div>
                  </div>
                ))}
                <button onClick={() => setTab("tasks")} style={{
                  marginTop: 10, width: "100%", background: "none", border: "1px solid #2a2a3e",
                  color: "#64748b", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer", fontWeight: 600,
                }}>Manage tasks →</button>
              </div>
              <div style={{ background: "#13131f", borderRadius: 18, padding: 18, border: "1px solid #2a2a3e" }}>
                <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>TODAY'S HABITS</div>
                {habits.length === 0 && (
                  <div style={{ color: "#3f3f5a", fontSize: 13, textAlign: "center", padding: "12px 0" }}>No habits yet</div>
                )}
                {habits.slice(0, 6).map((h) => {
                  const done = h.completedDates?.includes(today);
                  return (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #1a1a2e" }}>
                      <span style={{ fontSize: 16 }}>{h.icon}</span>
                      <span style={{ color: done ? "#64748b" : "#e2e8f0", fontSize: 13, flex: 1, textDecoration: done ? "line-through" : "none" }}>{h.name}</span>
                      {done && <span style={{ color: "#7c3aed", fontSize: 14 }}>✓</span>}
                    </div>
                  );
                })}
                <button onClick={() => setTab("habits")} style={{
                  marginTop: 10, width: "100%", background: "none", border: "1px solid #2a2a3e",
                  color: "#64748b", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer", fontWeight: 600,
                }}>Manage habits →</button>
              </div>
            </div>
          </div>
        )}

        {tab === "habits" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#13131f", borderRadius: 16, padding: 16, border: "1px solid #2a2a3e" }}>
              <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 12, letterSpacing: 2, marginBottom: 12 }}>ADD HABIT</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                {HABIT_ICONS.map((ic) => (
                  <button key={ic} onClick={() => setHabitIcon(ic)} style={{
                    fontSize: 18, background: habitIcon === ic ? "#2a2a3e" : "none",
                    border: habitIcon === ic ? "1px solid #7c3aed" : "1px solid transparent",
                    borderRadius: 8, padding: "4px 6px", cursor: "pointer",
                  }}>{ic}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input value={newHabit} onChange={(e) => setNewHabit(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addHabit()}
                  placeholder="Habit name..." style={{
                    flex: 1, minWidth: 180, background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 10,
                    color: "#e2e8f0", fontSize: 13, padding: "10px 12px", outline: "none",
                  }} />
                <select value={habitXP} onChange={(e) => setHabitXP(+e.target.value)} style={{
                  background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 10,
                  color: "#a78bfa", fontSize: 13, padding: "10px 10px", outline: "none", cursor: "pointer",
                }}>
                  {[10, 20, 30, 50].map((v) => <option key={v} value={v}>{v} XP</option>)}
                </select>
                <button onClick={addHabit} style={{
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff",
                  border: "none", borderRadius: 10, padding: "0 16px", fontWeight: 700,
                  fontSize: 18, cursor: "pointer",
                }}>+</button>
              </div>
            </div>
            {habits.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#3f3f5a" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🌿</div>
                <div style={{ fontWeight: 600 }}>No habits yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Add your first habit above</div>
              </div>
            ) : habits.map((h) => <HabitCard key={h.id} habit={h} onToggle={toggleHabit} onDelete={deleteHabit} />)}
          </div>
        )}

        {tab === "tasks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#13131f", borderRadius: 16, padding: 16, border: "1px solid #2a2a3e" }}>
              <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 12, letterSpacing: 2, marginBottom: 12 }}>ADD TASK</div>
              <input value={newTask} onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="Task name..." style={{
                  width: "100%", background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 10,
                  color: "#e2e8f0", fontSize: 13, padding: "10px 12px", outline: "none", marginBottom: 8,
                }} />
              <input value={taskNote} onChange={(e) => setTaskNote(e.target.value)}
                placeholder="Note (optional)..." style={{
                  width: "100%", background: "#0d0d1a", border: "1px solid #2a2a3e", borderRadius: 10,
                  color: "#e2e8f0", fontSize: 13, padding: "10px 12px", outline: "none", marginBottom: 8,
                }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TASK_PRIORITIES.map((p) => (
                  <button key={p} onClick={() => setTaskPriority(p)} style={{
                    flex: 1, minWidth: 80, padding: "8px", borderRadius: 8, fontWeight: 700, fontSize: 12,
                    background: taskPriority === p ? PRIORITY_COLOR[p] + "33" : "#0d0d1a",
                    color: taskPriority === p ? PRIORITY_COLOR[p] : "#3f3f5a",
                    border: `1px solid ${taskPriority === p ? PRIORITY_COLOR[p] : "#2a2a3e"}`,
                    cursor: "pointer", textTransform: "capitalize",
                  }}>{p}</button>
                ))}
                <button onClick={addTask} style={{
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff",
                  border: "none", borderRadius: 8, padding: "0 16px", fontWeight: 700, fontSize: 18, cursor: "pointer",
                }}>+</button>
              </div>
            </div>
            {tasks.filter((t) => !t.completedDates?.includes(today)).length > 0 && (
              <>
                <div style={{ color: "#3f3f5a", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>ACTIVE</div>
                {tasks.filter((t) => !t.completedDates?.includes(today)).map((t) => <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}
              </>
            )}
            {tasks.filter((t) => t.completedDates?.includes(today)).length > 0 && (
              <>
                <div style={{ color: "#3f3f5a", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginTop: 8 }}>COMPLETED</div>
                {tasks.filter((t) => t.completedDates?.includes(today)).map((t) => <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />)}
              </>
            )}
            {tasks.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#3f3f5a" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 600 }}>No tasks yet</div>
              </div>
            )}
          </div>
        )}

        {tab === "stats" && (
          <div style={{ display: "grid", gap: 14 }}>
            <Heatmap activityMap={activityMap} />
            <Achievements badges={BADGES} unlockedIds={unlockedBadges} />
            <Analytics
              focusHours={stats.weeklyReview.focusHours}
              avgSessionMinutes={average(sessionLog.map((s) => s.minutes || 0))}
              weeklyReview={stats.weeklyReview}
              insights={insights}
              coachTips={coachTips}
              calendarMonth={calendarMonth}
              completedSet={todayCompletedSet}
              onPrevMonth={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              onNextMonth={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            />
            <DataManager snapshot={exportSnapshot()} onImportSnapshot={importSnapshot} onResetAll={resetAll} />
          </div>
        )}

        {tab === "journal" && <Journal />}
      </div>

      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#0d0d1a", borderTop: "1px solid #1e1e2e",
        display: "flex", padding: "10px 0 max(10px, env(safe-area-inset-bottom))",
        zIndex: 200,
      }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer", padding: "4px 0",
          }}>
            <div style={{ fontSize: 20, filter: tab === t.id ? "none" : "grayscale(1) opacity(0.4)", transition: "all 0.2s" }}>{t.icon}</div>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
              color: tab === t.id ? "#a78bfa" : "#3f3f5a",
              transition: "color 0.2s",
            }}>{t.label.toUpperCase()}</div>
            {tab === t.id && <div style={{ width: 20, height: 2, background: "#7c3aed", borderRadius: 99, marginTop: 1 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
