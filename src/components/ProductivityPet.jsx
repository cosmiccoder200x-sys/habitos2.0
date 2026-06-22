export default function ProductivityPet({ xp }) {
  const stage = xp < 100 ? "Seed" : xp < 300 ? "Plant" : xp < 800 ? "Tree" : "Forest";
  const emoji = stage === "Seed" ? "🌱" : stage === "Plant" ? "🪴" : stage === "Tree" ? "🌳" : "🌲";
  const pct = Math.min(100, Math.round((xp / 1200) * 100));

  return (
    <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 20, padding: 18 }}>
      <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Productivity pet</div>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 14 }}>
        <div style={{ fontSize: 52, lineHeight: 1 }}>{emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#f8fafc", fontSize: 20, fontWeight: 900 }}>{stage}</div>
          <div style={{ color: "#94a3b8", fontSize: 13 }}>Your pet grows with XP and consistency.</div>
          <div style={{ marginTop: 12, height: 10, background: "#0d0d1a", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#22c55e,#7c3aed)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
