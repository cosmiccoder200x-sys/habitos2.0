import { getIntensitiesForDateRange, monthLabel, startOfMonth } from "../lib/productivity";

export default function Heatmap({ activityMap }) {
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);
  const end = new Date();

  const days = getIntensitiesForDateRange({ start, end, activityMap });
  const months = [];
  let cursor = startOfMonth(start);
  for (let i = 0; i < 12; i++) {
    months.push(monthLabel(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return (
    <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 20, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Yearly habit heatmap</div>
          <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Contribution-style activity view</div>
        </div>
        <div style={{ color: "#64748b", fontSize: 12 }}>Low → High activity</div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(53, minmax(0, 1fr))", gap: 4, overflowX: "auto", paddingBottom: 6 }}>
        {days.map((day) => (
          <div
            key={day.date}
            title={`${day.date}: ${day.value} activities`}
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: day.value === 0 ? "#1e1e2e" : day.value === 1 ? "#2f2450" : day.value <= 3 ? "#5b21b6" : day.value <= 5 ? "#7c3aed" : "#a78bfa",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 10, color: "#64748b", fontSize: 11 }}>
        {["0", "1", "2-3", "4-5", "6+"].map((t, i) => (
          <div key={t} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: i === 0 ? "#1e1e2e" : i === 1 ? "#2f2450" : i === 2 ? "#5b21b6" : i === 3 ? "#7c3aed" : "#a78bfa" }} />
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}
