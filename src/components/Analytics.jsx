import { createCalendarDays, formatLongDate, monthLabel, parseISODate } from "../lib/productivity";

function StatCard({ label, value, hint, icon }) {
  return (
    <div style={{ background: "#0d0d1a", border: "1px solid #24243a", borderRadius: 18, padding: 14 }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ color: "#f8fafc", fontWeight: 900, fontSize: 24, marginTop: 8 }}>{value}</div>
      <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 12, marginTop: 4 }}>{label}</div>
      <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>{hint}</div>
    </div>
  );
}

export default function Analytics({
  focusHours,
  avgSessionMinutes,
  weeklyReview,
  insights,
  coachTips,
  calendarMonth,
  completedSet,
  onPrevMonth,
  onNextMonth,
}) {
  const days = createCalendarDays(calendarMonth);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
        <StatCard label="Focus hours" value={focusHours.toFixed(1)} hint="Total time spent" icon="⏱" />
        <StatCard label="Avg session" value={`${Math.round(avgSessionMinutes || 0)}m`} hint="Per Pomodoro" icon="🎯" />
        <StatCard label="This week XP" value={weeklyReview.currentXp} hint={`${weeklyReview.improvement >= 0 ? "+" : ""}${weeklyReview.improvement}% vs last week`} icon="⚡" />
        <StatCard label="Tasks done" value={weeklyReview.tasksDone} hint="Completed this week" icon="✅" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16 }}>
        <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 20, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Productivity insights</div>
              <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Automatic patterns detected from your logs</div>
            </div>
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {insights.map((item) => (
              <div key={item.title} style={{ background: "#0d0d1a", border: "1px solid #24243a", borderRadius: 16, padding: 14 }}>
                <div style={{ color: "#f8fafc", fontWeight: 800 }}>{item.title}</div>
                <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>{item.body}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 20, padding: 18 }}>
          <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>AI productivity coach</div>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {coachTips.map((tip, i) => (
              <div key={i} style={{ background: "#0d0d1a", border: "1px solid #24243a", borderRadius: 14, padding: 12, color: "#cbd5e1", fontSize: 13 }}>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 20, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Monthly habit calendar</div>
              <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>{monthLabel(calendarMonth)}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onPrevMonth} style={{ background: "#0d0d1a", border: "1px solid #24243a", color: "#cbd5e1", borderRadius: 12, padding: "8px 12px", cursor: "pointer" }}>←</button>
              <button onClick={onNextMonth} style={{ background: "#0d0d1a", border: "1px solid #24243a", color: "#cbd5e1", borderRadius: 12, padding: "8px 12px", cursor: "pointer" }}>→</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 8, marginTop: 16 }}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <div key={d} style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textAlign: "center" }}>{d}</div>
            ))}
            {days.map((d, idx) => {
              if (!d) {
                return <div key={`empty-${idx}`} style={{ height: 44, borderRadius: 12, background: "transparent" }} />;
              }
              const active = completedSet.has(d);
              const dt = parseISODate(d);
              return (
                <div
                  key={d}
                  title={`${formatLongDate(dt)}${active ? " • completed" : ""}`}
                  style={{
                    height: 44,
                    borderRadius: 12,
                    background: active ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#0d0d1a",
                    border: `1px solid ${active ? "#7c3aed66" : "#24243a"}`,
                    color: active ? "#fff" : "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {dt.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
