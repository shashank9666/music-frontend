"use client";

import React, { useRef } from "react";
import { NoteEvent } from "@/lib/types";
import { pitchToMidi } from "@/lib/compiler";
import { Trash2, Music } from "lucide-react";

interface SheetCanvasProps {
  notes: NoteEvent[];
  activeBeat: number;
  timeSignature: string;
  selectedIndex: number | null;
  onSelectNote: (index: number | null) => void;
  onUpdateNotePitch: (index: number, newPitch: string) => void;
  onUpdateNoteDuration: (index: number, newDuration: number) => void;
  onDeleteNote: (index: number) => void;
}

const ALL_PITCHES = [
  "REST",
  "C3", "D3", "E3", "F3", "G3", "A3", "B3",
  "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
  "C5", "C#5", "D5", "D#5", "E5", "F5", "G5", "A5"
];

const DURATION_CHOICES = [
  { label: "Whole (1)", val: 4.0 },
  { label: "Half (1/2)", val: 2.0 },
  { label: "Quarter (1/4)", val: 1.0 },
  { label: "Eighth (1/8)", val: 0.5 },
  { label: "16th (1/16)", val: 0.25 },
];

export const SheetCanvas: React.FC<SheetCanvasProps> = ({
  notes,
  activeBeat,
  timeSignature,
  selectedIndex,
  onSelectNote,
  onUpdateNotePitch,
  onUpdateNoteDuration,
  onDeleteNote,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [numStr] = timeSignature.split("/");
  const beatsPerMeasure = parseFloat(numStr) || 4;

  const BEAT_WIDTH = 55;
  const STAFF_TOP = 50;
  const LINE_SPACING = 11;
  const STAFF_HEIGHT = LINE_SPACING * 4;

  const totalBeats = notes.reduce((max, n) => Math.max(max, n.start_time + n.duration), 8);
  const totalWidth = Math.max(880, (totalBeats + 4) * BEAT_WIDTH + 140);

  const getNoteY = (pitch: string, clef: "treble" | "bass") => {
    const midi = pitchToMidi(pitch);
    if (midi < 0) return STAFF_TOP + STAFF_HEIGHT / 2;
    const semitonesFromE4 = midi - 64;
    const step = semitonesFromE4 * 0.58; 
    return (STAFF_TOP + STAFF_HEIGHT) - (step * LINE_SPACING);
  };

  const numMeasures = Math.ceil(totalBeats / beatsPerMeasure) + 1;
  const selectedNote = selectedIndex !== null && selectedIndex >= 0 && selectedIndex < notes.length ? notes[selectedIndex] : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Selected Note Inline Editor Toolbar - Glassmorphic Pill */}
      {selectedNote && selectedIndex !== null && (
        <div className="glass-panel rounded-2xl px-5 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs shadow-2xl animate-in fade-in duration-200 border border-amber-500/30">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-amber-400 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" /> Note #{selectedIndex + 1}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Pitch:</span>
              <select
                value={selectedNote.pitch}
                onChange={(e) => onUpdateNotePitch(selectedIndex, e.target.value)}
                className="bg-zinc-800/80 border border-white/10 text-zinc-100 rounded-xl px-2.5 py-1 font-mono font-bold outline-none cursor-pointer hover:bg-zinc-750 transition"
              >
                {ALL_PITCHES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Duration:</span>
              <select
                value={selectedNote.duration}
                onChange={(e) => onUpdateNoteDuration(selectedIndex, parseFloat(e.target.value))}
                className="bg-zinc-800/80 border border-white/10 text-zinc-100 rounded-xl px-2.5 py-1 font-mono outline-none cursor-pointer hover:bg-zinc-750 transition"
              >
                {DURATION_CHOICES.map((d) => (
                  <option key={d.val} value={d.val}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDeleteNote(selectedIndex)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition shadow-sm"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button
              onClick={() => onSelectNote(null)}
              className="text-zinc-400 hover:text-white px-3 py-1 rounded-xl hover:bg-white/5 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Sheet Music Canvas with Apple-like Glass Container */}
      <div
        className="w-full overflow-x-auto glass-panel p-6 rounded-3xl shadow-2xl select-none transition-colors border border-white/10"
        ref={containerRef}
      >
        <div className="relative min-w-max pb-2" style={{ width: totalWidth, height: 215 }}>
          <svg width={totalWidth} height="215" className="overflow-visible">
            {/* Clef label */}
            <text
              x="22"
              y={STAFF_TOP + STAFF_HEIGHT * 0.72}
              className="font-serif text-[38px] fill-zinc-300 font-bold drop-shadow"
            >
              𝄞
            </text>

            {/* Time Signature */}
            <text x="56" y={STAFF_TOP + 15} className="font-bold text-sm fill-zinc-200">
              {timeSignature.split("/")[0]}
            </text>
            <text x="56" y={STAFF_TOP + 36} className="font-bold text-sm fill-zinc-200">
              {timeSignature.split("/")[1]}
            </text>

            {/* 5 Staff Lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = STAFF_TOP + i * LINE_SPACING;
              return (
                <line
                  key={`line-${i}`}
                  x1="12"
                  y1={y}
                  x2={totalWidth - 20}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.25)"
                  strokeWidth="1.2"
                />
              );
            })}

            {/* Measure Barlines */}
            {Array.from({ length: numMeasures }).map((_, mIdx) => {
              const x = 75 + mIdx * beatsPerMeasure * BEAT_WIDTH;
              return (
                <g key={`bar-${mIdx}`}>
                  <line
                    x1={x}
                    y1={STAFF_TOP}
                    x2={x}
                    y2={STAFF_TOP + STAFF_HEIGHT}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="1.5"
                  />
                  <text x={x + 4} y={STAFF_TOP - 10} className="text-[10px] fill-zinc-500 font-mono">
                    m.{mIdx + 1}
                  </text>
                </g>
              );
            })}

            {/* Notes rendering */}
            {notes.map((n, idx) => {
              const isRest = n.pitch.toUpperCase() === "REST";
              const x = 80 + n.start_time * BEAT_WIDTH;
              const y = getNoteY(n.pitch, n.clef);
              const isPlaying = activeBeat >= n.start_time && activeBeat < n.start_time + n.duration;
              const isSelected = selectedIndex === idx;

              if (isRest) {
                return (
                  <g
                    key={`rest-${idx}`}
                    onClick={() => onSelectNote(isSelected ? null : idx)}
                    transform={`translate(${x}, ${STAFF_TOP + 12})`}
                    className="cursor-pointer group pointer-events-auto"
                    style={{ cursor: "pointer" }}
                  >
                    <rect
                      width="8"
                      height="15"
                      fill={isPlaying ? "#60a5fa" : isSelected ? "#f59e0b" : "#71717a"}
                      rx="2"
                      className="transition-colors group-hover:fill-amber-400"
                      style={{ cursor: "pointer" }}
                    />
                    <text x="-4" y="26" className="text-[9px] fill-zinc-500 font-mono" style={{ cursor: "pointer" }}>𝄽</text>
                  </g>
                );
              }

              const isHalf = n.duration > 1.0 && n.duration < 4.0;
              const isWhole = n.duration >= 4.0;

              return (
                <g
                  key={`note-${idx}`}
                  onClick={() => onSelectNote(isSelected ? null : idx)}
                  className="cursor-pointer group pointer-events-auto"
                  style={{ cursor: "pointer" }}
                >
                  {/* Invisible enlarged hit target for easy clicking */}
                  <rect
                    x={x - 10}
                    y={Math.min(y - 30, STAFF_TOP - 10)}
                    width={32}
                    height={STAFF_HEIGHT + 60}
                    fill="transparent"
                    style={{ cursor: "pointer" }}
                  />

                  {/* Clean, static selection glow (No spinning dotted circles) */}
                  {isSelected && (
                    <ellipse
                      cx={x + 4}
                      cy={y}
                      rx="14"
                      ry="12"
                      fill="rgba(245, 158, 11, 0.15)"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      style={{ cursor: "pointer" }}
                    />
                  )}

                  {/* Ledger lines */}
                  {y > STAFF_TOP + STAFF_HEIGHT + 2 && (
                    <line
                      x1={x - 8}
                      y1={STAFF_TOP + STAFF_HEIGHT + LINE_SPACING}
                      x2={x + 16}
                      y2={STAFF_TOP + STAFF_HEIGHT + LINE_SPACING}
                      stroke="rgba(255, 255, 255, 0.3)"
                      strokeWidth="1.2"
                    />
                  )}
                  {y < STAFF_TOP - 2 && (
                    <line
                      x1={x - 8}
                      y1={STAFF_TOP - LINE_SPACING}
                      x2={x + 16}
                      y2={STAFF_TOP - LINE_SPACING}
                      stroke="rgba(255, 255, 255, 0.3)"
                      strokeWidth="1.2"
                    />
                  )}

                  {/* Note Head */}
                  <ellipse
                    cx={x + 4}
                    cy={y}
                    rx="6.5"
                    ry="5"
                    transform={`rotate(-25 ${x + 4} ${y})`}
                    fill={
                      isPlaying
                        ? "#38bdf8"
                        : isSelected
                        ? "#f59e0b"
                        : isWhole || isHalf
                        ? "transparent"
                        : "#fafafa"
                    }
                    stroke={
                      isPlaying
                        ? "#38bdf8"
                        : isSelected
                        ? "#f59e0b"
                        : "#fafafa"
                    }
                    strokeWidth={isWhole || isHalf ? "2.2" : "1"}
                    className="transition-all duration-100 group-hover:scale-110"
                    style={{
                      cursor: "pointer",
                      filter: isPlaying
                        ? "drop-shadow(0 0 8px rgba(56, 189, 248, 0.8))"
                        : isSelected
                        ? "drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))"
                        : "none",
                    }}
                  />

                  {/* Stem */}
                  {!isWhole && (
                    <line
                      x1={x + 9.5}
                      y1={y}
                      x2={x + 9.5}
                      y2={y - 28}
                      stroke={
                        isPlaying
                          ? "#38bdf8"
                          : isSelected
                          ? "#f59e0b"
                          : "#fafafa"
                      }
                      strokeWidth="1.6"
                      style={{ cursor: "pointer" }}
                    />
                  )}

                  {/* Pitch Label */}
                  <text
                    x={x + 4}
                    y={STAFF_TOP + STAFF_HEIGHT + 30}
                    textAnchor="middle"
                    style={{ cursor: "pointer" }}
                    className={`text-[10px] font-mono font-medium transition-colors ${
                      isPlaying
                        ? "fill-sky-400 font-bold"
                        : isSelected
                        ? "fill-amber-400 font-bold"
                        : "fill-zinc-400 group-hover:fill-zinc-200"
                    }`}
                  >
                    {n.pitch}
                  </text>
                </g>
              );
            })}

            {/* Apple-style Smooth Playhead */}
            {activeBeat >= 0 && (
              <g transform={`translate(${80 + activeBeat * BEAT_WIDTH}, 0)`}>
                <line
                  x1="0"
                  y1={STAFF_TOP - 16}
                  x2="0"
                  y2={STAFF_TOP + STAFF_HEIGHT + 36}
                  stroke="#38bdf8"
                  strokeWidth="2"
                  style={{ filter: "drop-shadow(0 0 6px rgba(56, 189, 248, 0.7))" }}
                />
                <circle cx="0" cy={STAFF_TOP - 16} r="3" fill="#38bdf8" />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};
