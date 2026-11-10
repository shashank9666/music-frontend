const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchProjects() {
  try {
    const res = await fetch(`${API_BASE}/api/projects`);
    if (!res.ok) throw new Error("Failed to load projects");
    return await res.json();
  } catch (err) {
    console.warn("Backend not reached, using offline storage:", err);
    return null;
  }
}

export async function saveProject(project: {
  title: string;
  description?: string;
  author?: string;
  tempo: number;
  time_signature: string;
  key_signature: string;
  code: string;
}) {
  try {
    const res = await fetch(`${API_BASE}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!res.ok) throw new Error("Failed to save project");
    return await res.json();
  } catch (err) {
    console.warn("Backend save failed, saved locally:", err);
    return null;
  }
}

export async function downloadMidi(code: string, filename: string = "music.mid") {
  try {
    const res = await fetch(`${API_BASE}/api/export/midi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error("MIDI generation failed");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    console.error("Export MIDI error:", err);
    alert("Could not export MIDI. Ensure backend is running or check server logs.");
  }
}

