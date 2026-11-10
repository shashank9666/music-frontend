"use client";

import React, { useState, useEffect, useRef } from "react";
import { SheetCanvas } from "@/components/sheet/SheetCanvas";
import { PianoKeyboard } from "@/components/piano/PianoKeyboard";
import { BuildingBlocks } from "@/components/editor/BuildingBlocks";
import { KeyMappingPanel, DEFAULT_KEY_MAP, KeyMap } from "@/components/editor/KeyMappingPanel";
import { compileMusicCode } from "@/lib/compiler";
import { soundEngine } from "@/lib/soundEngine";
import { CompileResult, SynthInstrument } from "@/lib/types";
import { downloadMidi, saveProject } from "@/lib/api";
import {
  Play,
  Square,
  Repeat,
  Download,
  Code2,
  Save,
  Music2,
  HelpCircle,
  Plus,
  Trash2,
} from "lucide-react";

const DEMO_COMPOSITIONS = [
  {
    name: "Beethoven - Ode to Joy",
    code: `// Ode to Joy - Ludwig van Beethoven
title "Ode to Joy"
tempo 120
meter 4/4

// Theme Part 1
play E4 1/4
play E4 1/4
play F4 1/4
play G4 1/4
play G4 1/4
play F4 1/4
play E4 1/4
play D4 1/4

// Theme Part 2
play C4 1/4
play C4 1/4
play D4 1/4
play E4 1/4
play E4 1/4.
play D4 1/8
play D4 1/2
`,
  },
  {
    name: "Cyberpunk Arp Sequence",
    code: `// Cyberpunk Arpeggio Sequence
title "Cyber Arp"
tempo 130
meter 4/4

loop 2 {
    arp A3:min 1/8
    arp F3:maj 1/8
    arp C4:maj 1/8
    arp G3:maj 1/8
}

chord [A3,C4,E4] 1/1
`,
  },
  {
    name: "Lofi Chord Progression",
    code: `// Lofi Chill Progression
title "Lofi Dreams"
tempo 85
meter 4/4

chord [D4,F4,A4,C5] 1/2
chord [G3,B3,D4,F4] 1/2
chord [C4,E4,G4,B4] 1/2
chord [A3,C4,E4,G4] 1/2
`,
  },
];

export default function MusicStudioPage() {
  const [code, setCode] = useState<string>(DEMO_COMPOSITIONS[0].code);
  const [compiled, setCompiled] = useState<CompileResult>(() => compileMusicCode(DEMO_COMPOSITIONS[0].code));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeBeat, setActiveBeat] = useState<number>(-1);
  const [activePitch, setActivePitch] = useState<string | null>(null);
  const [tempo, setTempo] = useState<number>(120);
  const [instrument, setInstrument] = useState<SynthInstrument>("grand_piano");
  const [loopPlayback, setLoopPlayback] = useState<boolean>(false);
  const [showDocs, setShowDocs] = useState<boolean>(false);

  // Keyboard mapping state
  const [keyMap, setKeyMap] = useState<KeyMap>(DEFAULT_KEY_MAP);
  const [activePressedKey, setActivePressedKey] = useState<string | null>(null);

  // Selected note index on the sheet music
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(null);

  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scheduledNotesRef = useRef<Set<number>>(new Set());

  // Real-time compile on code change
  useEffect(() => {
    const res = compileMusicCode(code);
    setCompiled(res);
    setTempo(res.tempo);
  }, [code]);

  // Synchronize instrument with sound engine
  useEffect(() => {
    soundEngine.setInstrument(instrument);
  }, [instrument]);

  // Global Keyboard typing listener: press 'a', 's', 'd' etc to type notes!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing inside code textarea or input
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "TEXTAREA" || activeEl.tagName === "INPUT" || activeEl.tagName === "SELECT")
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (keyMap[key]) {
        e.preventDefault();
        setActivePressedKey(key);
        const pitch = keyMap[key];

        if (pitch === "REST") {
          handleAppendCode("rest 1/4\n");
        } else {
          soundEngine.playTone(pitch, 0.4);
          setActivePitch(pitch);
          handleAppendCode(`play ${pitch} 1/4\n`);
          setTimeout(() => setActivePitch(null), 300);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keyMap[key]) {
        setActivePressedKey(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [keyMap]);

  const handlePlay = () => {
    if (isPlaying) {
      handleStop();
      return;
    }

    if (compiled.notes.length === 0) return;

    setIsPlaying(true);
    const startTimestamp = performance.now();
    scheduledNotesRef.current.clear();

    const secPerBeat = 60.0 / tempo;
    const intervalMs = 25;

    playbackTimerRef.current = setInterval(() => {
      const elapsedSec = (performance.now() - startTimestamp) / 1000;
      const currentBeat = elapsedSec / secPerBeat;

      setActiveBeat(currentBeat);

      // Play notes due at this beat
      compiled.notes.forEach((note, index) => {
        if (!scheduledNotesRef.current.has(index)) {
          if (currentBeat >= note.start_time - 0.05 && currentBeat <= note.start_time + 0.1) {
            scheduledNotesRef.current.add(index);
            if (note.pitch.toUpperCase() !== "REST") {
              const durSec = note.duration * secPerBeat;
              soundEngine.playTone(note.pitch, durSec, note.velocity);
              setActivePitch(note.pitch);
              setTimeout(() => setActivePitch(null), durSec * 800);
            }
          }
        }
      });

      // End of song
      if (currentBeat >= compiled.total_beats + 0.5) {
        if (loopPlayback) {
          handlePlay();
        } else {
          handleStop();
        }
      }
    }, intervalMs);
  };

  const handleStop = () => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    setIsPlaying(false);
    setActiveBeat(-1);
    setActivePitch(null);
  };

  const handleAppendCode = (snippet: string) => {
    setCode((prev) => prev.trimEnd() + "\n" + snippet);
  };

  // Sheet Music Direct Editing Handlers
  const handleUpdateNotePitch = (index: number, newPitch: string) => {
    // Find all 'play' or note statements and update the n-th note
    const lines = code.split("\n");
    let noteCounter = 0;
    const newLines = lines.map((l) => {
      const trimmed = l.trim();
      if (trimmed.startsWith("play ") || /^[A-Ga-g][#b]?-?\d+/.test(trimmed) || trimmed.startsWith("rest ")) {
        if (noteCounter === index) {
          noteCounter++;
          const parts = trimmed.split(/\s+/);
          const dur = parts[2] || (parts[0].startsWith("play") ? parts[2] || "1/4" : parts[1] || "1/4");
          if (newPitch === "REST") {
            return `rest ${dur}`;
          }
          return `play ${newPitch} ${dur}`;
        }
        noteCounter++;
      }
      return l;
    });
    setCode(newLines.join("\n"));
    if (newPitch !== "REST") {
      soundEngine.playTone(newPitch, 0.4);
    }
  };

  const handleUpdateNoteDuration = (index: number, newDuration: number) => {
    const durStr = newDuration === 4.0 ? "1/1" : newDuration === 2.0 ? "1/2" : newDuration === 0.5 ? "1/8" : newDuration === 0.25 ? "1/16" : "1/4";
    const lines = code.split("\n");
    let noteCounter = 0;
    const newLines = lines.map((l) => {
      const trimmed = l.trim();
      if (trimmed.startsWith("play ") || /^[A-Ga-g][#b]?-?\d+/.test(trimmed) || trimmed.startsWith("rest ")) {
        if (noteCounter === index) {
          noteCounter++;
          const parts = trimmed.split(/\s+/);
          if (trimmed.startsWith("rest")) {
            return `rest ${durStr}`;
          }
          const pitch = parts[0].startsWith("play") ? parts[1] : parts[0];
          return `play ${pitch} ${durStr}`;
        }
        noteCounter++;
      }
      return l;
    });
    setCode(newLines.join("\n"));
  };

  const handleDeleteNote = (index: number) => {
    const lines = code.split("\n");
    let noteCounter = 0;
    const newLines = lines.filter((l) => {
      const trimmed = l.trim();
      if (trimmed.startsWith("play ") || /^[A-Ga-g][#b]?-?\d+/.test(trimmed) || trimmed.startsWith("rest ")) {
        if (noteCounter === index) {
          noteCounter++;
          return false; // remove line
        }
        noteCounter++;
      }
      return true;
    });
    setCode(newLines.join("\n"));
    setSelectedNoteIndex(null);
  };

  const handleSaveToBackend = async () => {
    const res = await saveProject({
      title: compiled.title,
      tempo: tempo,
      time_signature: compiled.time_signature,
      key_signature: "C",
      code: code,
    });
    if (res) {
      alert(`Saved composition "${compiled.title}" successfully to backend database!`);
    } else {
      alert("Note: Saved locally. Backend server can be started anytime with `uvicorn app.main:app`.");
    }
  };

  const handleExportMidi = () => {
    downloadMidi(code, `${compiled.title.replace(/\s+/g, "_")}.mid`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/20">
            <Music2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight flex items-center gap-2">
              NoteScript Studio
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Type-to-Compose
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Interactive Sheet Editor &bull; Custom Key Mappings &bull; Synthesizer
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <select
            onChange={(e) => {
              const found = DEMO_COMPOSITIONS.find((d) => d.name === e.target.value);
              if (found) {
                handleStop();
                setCode(found.code);
                setSelectedNoteIndex(null);
              }
            }}
            className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 px-3 py-1.5 rounded-xl hover:bg-zinc-700 transition cursor-pointer outline-none"
          >
            {DEMO_COMPOSITIONS.map((d) => (
              <option key={d.name} value={d.name}>
                Template: {d.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSaveToBackend}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition"
          >
            <Save className="w-3.5 h-3.5 text-zinc-400" /> Save
          </button>

          <button
            onClick={handleExportMidi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" /> Export MIDI
          </button>

          <button
            onClick={() => setShowDocs(!showDocs)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Guide
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="flex-1 flex flex-col p-6 gap-6 max-w-7xl w-full mx-auto">
        {/* Playback Controls & Transport Bar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlay}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                isPlaying
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-4 h-4 fill-current" /> Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Play Sheet
                </>
              )}
            </button>

            <button
              onClick={() => setLoopPlayback(!loopPlayback)}
              className={`p-2.5 rounded-xl border transition ${
                loopPlayback
                  ? "bg-amber-500/20 border-amber-500 text-amber-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200"
              }`}
              title="Toggle Loop"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Instrument Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Instrument:</span>
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value as SynthInstrument)}
              className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 px-3 py-1.5 rounded-xl outline-none"
            >
              <option value="grand_piano">Grand Piano (Warm)</option>
              <option value="synth_lead">Synth Lead (Sawtooth)</option>
              <option value="electric_organ">Electric Organ (Pure)</option>
              <option value="ambient_pad">Ambient Pad (Slow)</option>
              <option value="8bit_chiptune">8-Bit Chiptune (Square)</option>
            </select>
          </div>

          {/* Tempo & Meter Stats */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60">
              <span className="text-zinc-400">TEMPO:</span>
              <span className="font-bold text-amber-400">{tempo} BPM</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60">
              <span className="text-zinc-400">METER:</span>
              <span className="font-bold text-zinc-200">{compiled.time_signature}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60">
              <span className="text-zinc-400">NOTES:</span>
              <span className="font-bold text-blue-400">{compiled.notes.length}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60">
              <span className="text-zinc-400">DURATION:</span>
              <span className="font-bold text-zinc-200">{compiled.total_duration_sec}s</span>
            </div>
          </div>
        </div>

        {/* Dynamic Sheet Music Visualizer & Direct Click-to-Edit */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-300 flex items-center gap-2">
              <Music2 className="w-4 h-4 text-amber-400" />
              Interactive Sheet Music (Click any note to edit/delete)
            </h2>
            <span className="text-xs text-zinc-400">
              Click any notehead on the staff to change pitch, duration, or delete
            </span>
          </div>

          <SheetCanvas
            notes={compiled.notes}
            activeBeat={activeBeat}
            timeSignature={compiled.time_signature}
            selectedIndex={selectedNoteIndex}
            onSelectNote={(idx) => {
              setSelectedNoteIndex(idx);
              if (idx !== null && compiled.notes[idx]) {
                const n = compiled.notes[idx];
                soundEngine.playTone(n.pitch, 0.4);
                setActivePitch(n.pitch);
                setTimeout(() => setActivePitch(null), 300);
              }
            }}
            onUpdateNotePitch={handleUpdateNotePitch}
            onUpdateNoteDuration={handleUpdateNoteDuration}
            onDeleteNote={handleDeleteNote}
          />
        </div>

        {/* Keyboard Typing & Note Mapping Bar */}
        <KeyMappingPanel
          keyMap={keyMap}
          onUpdateKeyMap={setKeyMap}
          activeKey={activePressedKey}
          onKeyType={(pitch) => {
            if (pitch === "REST") {
              handleAppendCode("rest 1/4\n");
            } else {
              handleAppendCode(`play ${pitch} 1/4\n`);
            }
          }}
        />

        {/* Interactive Piano Preview */}
        <PianoKeyboard
          activePitch={activePitch}
          onInsertNote={(pitch) => handleAppendCode(`play ${pitch} 1/4\n`)}
        />

        {/* Studio Workspace: Code Editor on Left, Building Blocks on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code Editor */}
          <div className="lg:col-span-2 flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-zinc-900/90 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-zinc-200 font-mono">
                  {compiled.title}.ns &bull; Live Code Editor
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                Two-way sync with Sheet Music
              </span>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={14}
              spellCheck={false}
              className="w-full bg-[#121214] text-zinc-200 font-mono text-sm p-4 outline-none resize-none focus:ring-1 focus:ring-amber-500/30 leading-relaxed"
              placeholder="// Write music code or type keys (A, S, D, F, etc.)..."
            />

            {compiled.warnings.length > 0 && (
              <div className="bg-red-950/40 border-t border-red-900/40 p-3 text-xs text-red-300 font-mono">
                {compiled.warnings.map((w, idx) => (
                  <div key={idx}>⚠️ {w}</div>
                ))}
              </div>
            )}
          </div>

          {/* Building Blocks Palette */}
          <div className="lg:col-span-1">
            <BuildingBlocks onAddBlock={handleAppendCode} />
          </div>
        </div>

        {/* Syntax Quick Reference Modal */}
        {showDocs && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" /> NoteScript Programming & Typing Guide
              </h3>
              <button
                onClick={() => setShowDocs(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-zinc-300">
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                <div className="font-bold text-amber-400">Typing Directly on Keyboard:</div>
                <div>• Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-amber-300">A</kbd> for C4, <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-amber-300">S</kbd> for D4, <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-amber-300">D</kbd> for E4, etc.</div>
                <div>• Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-amber-300">Space</kbd> for a Rest.</div>
                <div>• Click any key on the **Keyboard Typing & Note Map** panel to remap it to any octave/pitch.</div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                <div className="font-bold text-amber-400">Direct Sheet Music Editing:</div>
                <div>• Click on any note directly on the staff to select it.</div>
                <div>• An inline editor appears allowing you to change pitch, note length, or delete.</div>
                <div>• Changes instantly update the code and audio in real time.</div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                <div className="font-bold text-amber-400">Chords & Arpeggios:</div>
                <div><code className="text-zinc-100">chord C4:maj 1/2</code> - Major Triad</div>
                <div><code className="text-zinc-100">arp A3:min 1/8</code> - Arpeggio sequence</div>
                <div><code className="text-zinc-100">loop 2 &#123; ... &#125;</code> - Loop block</div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-2">
                <div className="font-bold text-amber-400">Song Parameters:</div>
                <div><code className="text-zinc-100">tempo 120</code> - BPM</div>
                <div><code className="text-zinc-100">meter 4/4</code> - Time Signature</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-4 px-6 text-center text-xs text-zinc-500 flex items-center justify-between">
        <span>NoteScript Web Music Studio &bull; MIT License</span>
        <span>FastAPI + SQLite Backend &bull; Next.js Frontend</span>
      </footer>
    </div>
  );
}
