export default function DataManager({ snapshot, onImportSnapshot, onResetAll }) {
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habbitos-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      onImportSnapshot(parsed);
    } catch {
      alert("Invalid backup file. Please select a valid HabitOS JSON export.");
    }
    e.target.value = "";
  };

  return (
    <div style={{ background: "#13131f", border: "1px solid #2a2a3e", borderRadius: 20, padding: 18 }}>
      <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>Data backup</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
        <button onClick={handleExport} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Export JSON</button>
        <label style={{ background: "#0d0d1a", border: "1px solid #24243a", color: "#cbd5e1", borderRadius: 12, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>
          Import JSON
          <input type="file" accept="application/json" onChange={handleImport} style={{ display: "none" }} />
        </label>
        <button onClick={onResetAll} style={{ background: "#0d0d1a", border: "1px solid #ef444466", color: "#fca5a5", borderRadius: 12, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Reset Data</button>
      </div>
      <div style={{ color: "#64748b", fontSize: 12, marginTop: 10 }}>Keeps habits, tasks, XP, pomodoros, badges, missions, and logs in one backup.</div>
    </div>
  );
}
