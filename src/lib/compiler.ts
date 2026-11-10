import { NoteEvent, CompileResult } from "../types";

const DURATION_MAP: Record<string, number> = {
  "1": 4.0,
  "w": 4.0,
  "whole": 4.0,
  "1/2": 2.0,
  "h": 2.0,
  "half": 2.0,
  "1/4": 1.0,
  "q": 1.0,
  "quarter": 1.0,
  "1/8": 0.5,
  "e": 0.5,
  "eighth": 0.5,
  "1/16": 0.25,
  "s": 0.25,
  "16th": 0.25,
  "1/32": 0.125,
  "32nd": 0.125,
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const CHORD_SHAPES: Record<string, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  "7": [0, 4, 7, 10],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
};

export function pitchToMidi(pitch: string): number {
  if (pitch.toUpperCase() === "REST") return -1;
  const m = pitch.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!m) return 60;
  let note = m[1].toUpperCase();
  const octave = parseInt(m[2], 10);

  const flatMap: Record<string, string> = {
    DB: "C#",
    EB: "D#",
    GB: "F#",
    AB: "G#",
    BB: "A#",
  };
  note = flatMap[note] || note;
  const idx = NOTE_NAMES.indexOf(note);
  if (idx === -1) return 60;
  return (octave + 1) * 12 + idx;
}

export function midiToPitch(midi: number): string {
  if (midi < 0) return "REST";
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

export function parseDuration(dStr: string): number {
  let d = dStr.trim().toLowerCase();
  let dotted = false;
  if (d.endsWith(".")) {
    dotted = true;
    d = d.slice(0, -1);
  }
  let val = DURATION_MAP[d];
  if (val === undefined) {
    if (d.includes("/")) {
      const [num, den] = d.split("/");
      val = (parseFloat(num) / parseFloat(den)) * 4.0;
    } else {
      val = parseFloat(d) || 1.0;
    }
  }
  if (dotted) val *= 1.5;
  return val;
}

function getDurationName(dur: number): string {
  if (dur >= 4.0) return "whole";
  if (dur >= 2.0) return "half";
  if (dur >= 1.0) return "quarter";
  if (dur >= 0.5) return "eighth";
  return "16th";
}

function expandLoops(lines: string[]): string[] {
  const expanded: string[] = [];
  let i = 0;
  const n = lines.length;

  while (i < n) {
    const raw = lines[i];
    const line = raw.trim();
    const match = line.match(/^(?:loop|repeat)\s+(\d+)\s*\{?$/i);
    if (match) {
      const count = parseInt(match[1], 10);
      const blockLines: string[] = [];
      i++;
      let bracketDepth = line.includes("{") ? 1 : 0;
      while (i < n) {
        const sub = lines[i].trim();
        if (sub.includes("{")) bracketDepth++;
        if (sub === "}" || (bracketDepth === 1 && sub.endsWith("}"))) {
          bracketDepth--;
          if (bracketDepth <= 0) break;
        } else if (sub === "end") {
          break;
        }
        blockLines.push(lines[i]);
        i++;
      }
      const subExpanded = expandLoops(blockLines);
      for (let c = 0; c < count; c++) {
        expanded.push(...subExpanded);
      }
    } else {
      expanded.push(raw);
    }
    i++;
  }
  return expanded;
}

export function compileMusicCode(code: string): CompileResult {
  let tempo = 120;
  let timeSig = "4/4";
  let title = "Untitled";
  const notes: NoteEvent[] = [];
  const warnings: string[] = [];
  let cursor = 0.0;

  const rawLines = code.split("\n");
  const lines = expandLoops(rawLines);

  for (let idx = 0; idx < lines.length; idx++) {
    const raw = lines[idx];
    const line = raw.trim();
    if (!line || line.startsWith("//") || line.startsWith("#")) continue;

    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === "tempo" && parts[1]) {
      const t = parseInt(parts[1], 10);
      if (!isNaN(t)) tempo = t;
    } else if (["timesig", "time_signature", "meter"].includes(cmd) && parts[1]) {
      timeSig = parts[1];
    } else if (cmd === "title" && parts.length > 1) {
      title = parts.slice(1).join(" ").replace(/['"]/g, "");
    } else if (cmd === "note" || cmd === "play") {
      const pitch = (parts[1] || "C4").toUpperCase();
      const dur = parseDuration(parts[2] || "1/4");
      const vel = parts[3] ? parseInt(parts[3], 10) : 80;
      const midi = pitchToMidi(pitch);
      notes.push({
        pitch,
        duration: dur,
        duration_name: getDurationName(dur),
        velocity: isNaN(vel) ? 80 : vel,
        start_time: cursor,
        track: 1,
        clef: midi >= 0 && midi < 60 ? "bass" : "treble",
      });
      cursor += dur;
    } else if (cmd === "rest") {
      const dur = parseDuration(parts[1] || "1/4");
      notes.push({
        pitch: "REST",
        duration: dur,
        duration_name: getDurationName(dur),
        velocity: 0,
        start_time: cursor,
        track: 1,
        clef: "treble",
      });
      cursor += dur;
    } else if (cmd === "chord") {
      const target = parts[1] || "[C4,E4,G4]";
      const dur = parseDuration(parts[2] || "1/2");
      let pitches: string[] = [];

      if (target.startsWith("[") && target.endsWith("]")) {
        pitches = target.slice(1, -1).split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      } else if (target.includes(":")) {
        const [root, shapeName] = target.split(":");
        const rootMidi = pitchToMidi(root);
        const shape = CHORD_SHAPES[shapeName.toLowerCase()] || [0, 4, 7];
        pitches = shape.map((semi) => midiToPitch(rootMidi + semi));
      } else {
        pitches = [target.toUpperCase()];
      }

      for (const p of pitches) {
        const midi = pitchToMidi(p);
        notes.push({
          pitch: p,
          duration: dur,
          duration_name: getDurationName(dur),
          velocity: 80,
          start_time: cursor,
          track: 1,
          clef: midi >= 0 && midi < 60 ? "bass" : "treble",
        });
      }
      cursor += dur;
    } else if (cmd === "arpeggio" || cmd === "arp") {
      const target = parts[1] || "[C4,E4,G4]";
      const stepDur = parseDuration(parts[2] || "1/8");
      let pitches: string[] = [];

      if (target.startsWith("[") && target.endsWith("]")) {
        pitches = target.slice(1, -1).split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      } else if (target.includes(":")) {
        const [root, shapeName] = target.split(":");
        const rootMidi = pitchToMidi(root);
        const shape = CHORD_SHAPES[shapeName.toLowerCase()] || [0, 4, 7];
        pitches = shape.map((semi) => midiToPitch(rootMidi + semi));
      }

      for (const p of pitches) {
        const midi = pitchToMidi(p);
        notes.push({
          pitch: p,
          duration: stepDur,
          duration_name: getDurationName(stepDur),
          velocity: 85,
          start_time: cursor,
          track: 1,
          clef: midi >= 0 && midi < 60 ? "bass" : "treble",
        });
        cursor += stepDur;
      }
    } else if (/^[A-Ga-g][#b]?-?\d+$/.test(parts[0]) || parts[0].toUpperCase() === "REST") {
      const pitch = parts[0].toUpperCase();
      const dur = parseDuration(parts[1] || "1/4");
      const midi = pitchToMidi(pitch);
      notes.push({
        pitch,
        duration: dur,
        duration_name: getDurationName(dur),
        velocity: 80,
        start_time: cursor,
        track: 1,
        clef: midi >= 0 && midi < 60 ? "bass" : "treble",
      });
      cursor += dur;
    } else {
      warnings.push(`Line ${idx + 1}: Unrecognized syntax '${parts[0]}'`);
    }
  }

  const totalBeats = cursor;
  const secPerBeat = 60.0 / Math.max(20, tempo);
  const totalSec = totalBeats * secPerBeat;

  return {
    title,
    tempo,
    time_signature: timeSig,
    notes,
    total_beats: Math.round(totalBeats * 1000) / 1000,
    total_duration_sec: Math.round(totalSec * 100) / 100,
    warnings,
  };
}
