import { getLevelInfo } from "../lib/productivity";

export default function Dashboard({
  quote,
  xp,
  habits,
  tasks,
  todayHabitsDone,
  todayTasksDone,
  focusScore,
  dailyProgress,
  streakSummary,
  missionSummary,
  petStage,
  onQuickAction,
  onGoToTab,
}) {
  const level = getLevelInfo(xp);

  const cards = [
    { label: "Daily Progress", value: `${dailyProgress}%`, hint: "Completion today", icon: "📈" },
    { label: "Focus Score", value: `${focusScore}/100`, hint: "Balanced productivity", icon: "🎯" },
    { label: "Best Streak", value: `${streakSummary.maxStreak}`, hint: "Days in a row", icon: "🔥" },
    { label: "Pet Stage", value: petStage, hint: "Progress companion", icon: "🌳" },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ background: "linear-gradient(135deg,#141427,#10101e)", border: "1px solid #26263a", borderRadius: 24, padding: 22 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 18, alignItems: "center" }}>
          <div style={{ minWidth: 240 }}>
            <div style={{ color: "#a78bfa", fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>Welcome back</div>
            <h1 style={{ margin: "8px 0 6px", color: "#f8fafc", fontSize: 30, lineHeight: 1.1 }}>HabitOS is ready for a deep work day.</h1>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>{quote}</p>
          </div>
          <div style={{ minWidth: 180, textAlign: "right" }}>
            <div style={{ color: "#f8fafc", fontSize: 28, fontWeight: 900 }}>{level.level}</div>
            <div style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>LEVEL {level.title}</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>{xp} XP total</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginTop: 18 }}>
          {cards.map((card) => (
            <div key={card.label} style={{ background: "#0d0d1a", border: "1px solid #24243a", borderRadius: 18, padding: 14 }}>
              <div style={{ fontSize: 20 }}>{card.icon}</div>
              <div style={{ color: "#f8fafc", fontSize: 22, fontWeight: 800, marginTop: 8 }}>{card.value}</div>
              <div style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700, marginTop: 4 }}>{card.label}</div>
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{card.hint}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
        <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 20, padding: 18 }}>
          <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Quick Actions</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
            {[
              ["Add Habit", "habits"],
              ["Add Task", "tasks"],
              ["Start Pomodoro", "focus"],
              ["Open Stats", "stats"],
              ["Export Data", "data"],
            ].map(([label, tab]) => (
              <button
                key={label}
                onClick={() => onQuickAction(tab)}
                style={{
                  border: "1px solid #2a2a3e",
                  background: tab === "focus" ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#0d0d1a",
                  color: tab === "focus" ? "#fff" : "#cbd5e1",
                  borderRadius: 14,
                  padding: "10px 14px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Today’s summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
              <div style={{ background: "#0d0d1a", border: "1px solid #24243a", borderRadius: 16, padding: 14 }}>
                <div style={{ color: "#22c55e", fontWeight: 900, fontSize: 22 }}>{todayHabitsDone}/{habits.length || 0}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>Habits completed</div>
              </div>
              <div style={{ background: "#0d0d1a", border: "1px solid #24243a", borderRadius: 16, padding: 14 }}>
                <div style={{ color: "#22c55e", fontWeight: 900, fontSize: 22 }}>{todayTasksDone}/{tasks.length || 0}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>Tasks completed</div>
              </div>
              <div style={{ background: "#0d0d1a", border: "1px solid #24243a", borderRadius: 16, padding: 14 }}>
                <div style={{ color: "#f59e0b", fontWeight: 900, fontSize: 22 }}>{missionSummary.available}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>Missions ready</div>
              </div>
              <div style={{ background: "#0d0d1a", border: "1px solid #24243a", borderRadius: 16, padding: 14 }}>
                <div style={{ color: "#a78bfa", fontWeight: 900, fontSize: 22 }}>{missionSummary.claimed}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>Missions claimed</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 20, padding: 18 }}>
            <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Focus card</div>
            <div style={{ color: "#f8fafc", fontSize: 44, fontWeight: 900, marginTop: 10 }}>{focusScore}</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>Your productivity score today</div>
          </div>
          <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 20, padding: 18 }}>
            <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Streak card</div>
            <div style={{ color: "#f59e0b", fontSize: 34, fontWeight: 900, marginTop: 10 }}>🔥 {streakSummary.maxStreak}</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>{streakSummary.bestHabit || "No streak yet"}</div>
          </div>
          <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 20, padding: 18 }}>
            <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Productivity Pet</div>
            <div style={{ fontSize: 42, marginTop: 10, lineHeight: 1 }}>{petStage === "Seed" ? "🌱" : petStage === "Plant" ? "🪴" : petStage === "Tree" ? "🌳" : "🌲"}</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>{petStage}</div>
          </div>
        </div>
      </div>

      <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 20, padding: 18 }}>
        <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Focus score breakdown</div>
        <div style={{ height: 10, background: "#0d0d1a", borderRadius: 999, overflow: "hidden", marginTop: 14 }}>
          <div style={{ width: `${dailyProgress}%`, height: "100%", background: "linear-gradient(90deg,#7c3aed,#4f46e5)", borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}
