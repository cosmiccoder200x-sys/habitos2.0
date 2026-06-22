export default function DailyMissions({ missions, onClaim }) {
  return (
    <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 20, padding: 18 }}>
      <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Daily missions</div>
      <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
        {missions.map((mission) => (
          <div key={mission.id} style={{ background: "#0d0d1a", border: "1px solid #24243a", borderRadius: 16, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
              <div>
                <div style={{ color: "#f8fafc", fontWeight: 800 }}>{mission.title}</div>
                <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>{mission.detail}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: mission.done ? "#22c55e" : "#f59e0b", fontWeight: 900 }}>{mission.done ? "Done" : mission.progress}</div>
                <div style={{ color: "#64748b", fontSize: 11 }}>+{mission.reward} XP</div>
              </div>
            </div>
            <button
              onClick={() => onClaim(mission.id)}
              disabled={!mission.done || mission.claimed}
              style={{
                marginTop: 12,
                width: "100%",
                border: "none",
                borderRadius: 12,
                padding: "10px 12px",
                background: mission.claimed ? "#1e1e2e" : mission.done ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "#17172a",
                color: mission.claimed ? "#64748b" : "#fff",
                cursor: mission.claimed || !mission.done ? "not-allowed" : "pointer",
                fontWeight: 800,
              }}
            >
              {mission.claimed ? "Claimed" : mission.done ? "Claim reward" : "Keep going"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
