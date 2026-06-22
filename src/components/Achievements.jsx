export default function Achievements({ badges, unlockedIds }) {
  return (
    <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 20, padding: 18 }}>
      <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Achievements</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginTop: 14 }}>
        {badges.map((badge) => {
          const unlocked = unlockedIds.includes(badge.id);
          return (
            <div
              key={badge.id}
              style={{
                background: unlocked ? "linear-gradient(135deg,#17172d,#10101e)" : "#0d0d1a",
                border: `1px solid ${unlocked ? "#7c3aed66" : "#24243a"}`,
                borderRadius: 18,
                padding: 14,
                opacity: unlocked ? 1 : 0.75,
              }}
            >
              <div style={{ fontSize: 28 }}>{badge.icon}</div>
              <div style={{ color: "#f8fafc", fontWeight: 800, marginTop: 8 }}>{badge.title}</div>
              <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{badge.desc}</div>
              <div style={{ marginTop: 10, display: "inline-flex", padding: "4px 8px", borderRadius: 999, background: unlocked ? "#7c3aed22" : "#1e1e2e", color: unlocked ? "#c4b5fd" : "#64748b", fontSize: 11, fontWeight: 700 }}>
                {unlocked ? "Unlocked" : "Locked"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
