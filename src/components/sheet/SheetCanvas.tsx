"use client";

import React, { useRef, useState } from "react";
import { NoteEvent } from "@/lib/types";
import { pitchToMidi } from "@/lib/compiler";
import { Trash2, Plus, Volume2 } from "lucide-react";

interface SheetCanvasProps {
  notes: NoteEvent[];
  activeBeat: number;
  timeSignature: string;
  selectedIndex: number | null;
  onSelectNote: (index: number | null) => void;
  onUpdateNotePitch: (index: number, newPitch: string) => void;
  onUpdateNoteDuration: (index: number, newDuration: number) => void;
  onDeleteNote: (index: number) => void;
  onAddNoteAtEnd?: () => void;
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
  const STAFF_TOP = 45;
  const LINE_SPACING = 10;
  const STAFF_HEIGHT = LINE_SPACING * 4;

  const totalBeats = notes.reduce((max, n) => Math.max(max, n.start_time + n.duration), 8);
  const totalWidth = Math.max(860, (totalBeats + 4) * BEAT_WIDTH + 120);

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
      {/* Selected Note Inline Editor Toolbar */}
      {selectedNote && selectedIndex !== null && (
        <div className="bg-zinc-900 border border-amber-500/40 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-amber-400">
              Editing Note #{selectedIndex + 1}:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Pitch:</span>
              <select
                value={selectedNote.pitch}
                onChange={(e) => onUpdateNotePitch(selectedIndex, e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-2 py-1 font-mono font-bold outline-none cursor-pointer"
              >
                {ALL_PITCHES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Length:</span>
              <select
                value={selectedNote.duration}
                onChange={(e) => onUpdateNoteDuration(selectedIndex, parseFloat(e.target.value))}
                className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-2 py-1 font-mono outline-none cursor-pointer"
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
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 transition"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button
              onClick={() => onSelectNote(null)}
              className="text-zinc-400 hover:text-white px-2 py-1"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Sheet Music Canvas */}
      <div
        className="w-full overflow-x-auto bg-[#faf8f5] dark:bg-[#18181b] p-6 rounded-2xl border border-amber-900/10 dark:border-zinc-800 shadow-inner select-none transition-colors"
        ref={containerRef}
      >
        <div className="relative min-w-max pb-4" style={{ width: totalWidth, height: 210 }}>
          <svg width={totalWidth} height="210" className="overflow-visible">
            {/* Clef label */}
            <text
              x="20"
              y={STAFF_TOP + STAFF_HEIGHT * 0.75}
              className="font-serif text-3xl fill-zinc-700 dark:fill-zinc-300 font-bold"
            >
              𝄞
            </text>

            {/* Time Signature */}
            <text x="50" y={STAFF_TOP + 14} className="font-bold text-sm fill-zinc-800 dark:fill-zinc-200">
              {timeSignature.split("/")[0]}
            </text>
            <text x="50" y={STAFF_TOP + 34} className="font-bold text-sm fill-zinc-800 dark:fill-zinc-200">
              {timeSignature.split("/")[1]}
            </text>

            {/* 5 Staff Lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = STAFF_TOP + i * LINE_SPACING;
              return (
                <line
                  key={`line-${i}`}
                  x1="10"
                  y1={y}
                  x2={totalWidth - 20}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1.2"
                  className="text-zinc-400 dark:text-zinc-600"
                />
              );
            })}

            {/* Measure Barlines */}
            {Array.from({ length: numMeasures }).map((_, mIdx) => {
              const x = 70 + mIdx * beatsPerMeasure * BEAT_WIDTH;
              return (
                <g key={`bar-${mIdx}`}>
                  <line
                    x1={x}
                    y1={STAFF_TOP}
                    x2={x}
                    y2={STAFF_TOP + STAFF_HEIGHT}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-zinc-300 dark:text-zinc-700"
                  />
                  <text x={x + 4} y={STAFF_TOP - 8} className="text-[10px] fill-zinc-400 font-mono">
                    m.{mIdx + 1}
                  </text>
                </g>
              );
            })}

            {/* Notes rendering */}
            {notes.map((n, idx) => {
              const isRest = n.pitch.toUpperCase() === "REST";
              const x = 75 + n.start_time * BEAT_WIDTH;
              const y = getNoteY(n.pitch, n.clef);
              const isPlaying = activeBeat >= n.start_time && activeBeat < n.start_time + n.duration;
              const isSelected = selectedIndex === idx;

              if (isRest) {
                return (
                  <g
                    key={`rest-${idx}`}
                    onClick={() => onSelectNote(isSelected ? null : idx)}
                    transform={`translate(${x}, ${STAFF_TOP + 12})`}
                    className="cursor-pointer group"
                  >
                    <rect
                      width="8"
                      height="14"
                      fill={isPlaying ? "#3b82f6" : isSelected ? "#f59e0b" : "#71717a"}
                      rx="1"
                    />
                    <text x="-4" y="24" className="text-[9px] fill-zinc-400 font-mono">𝄽</text>
                  </g>
                );
              }

              const isQuarterOrShorter = n.duration <= 1.0;
              const isHalf = n.duration > 1.0 && n.duration < 4.0;
              const isWhole = n.duration >= 4.0;

              return (
                <g
                  key={`note-${idx}`}
                  onClick={() => onSelectNote(isSelected ? null : idx)}
                  className="cursor-pointer group"
                >
                  {/* Highlight ring if selected */}
                  {isSelected && (
                    <circle
                      cx={x + 4}
                      cy={y}
                      r="14"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="3 2"
                      className="animate-spin"
                    />
                  )}

                  {/* Ledger lines */}
                  {y > STAFF_TOP + STAFF_HEIGHT + 2 && (
                    <line
                      x1={x - 8}
                      y1={STAFF_TOP + STAFF_HEIGHT + LINE_SPACING}
                      x2={x + 14}
                      y2={STAFF_TOP + STAFF_HEIGHT + LINE_SPACING}
                      stroke="currentColor"
                      strokeWidth="1.2"
                      className="text-zinc-400 dark:text-zinc-600"
                    />
                  )}
                  {y < STAFF_TOP - 2 && (
                    <line
                      x1={x - 8}
                      y1={STAFF_TOP - LINE_SPACING}
                      x2={x + 14}
                      y2={STAFF_TOP - LINE_SPACING}
                      stroke="currentColor"
                      strokeWidth="1.2"
                      className="text-zinc-400 dark:text-zinc-600"
                    />
                  )}

                  {/* Note Head */}
                  <ellipse
                    cx={x + 4}
                    cy={y}
                    rx="6"
                    ry="4.5"
                    transform={`rotate(-25 ${x + 4} ${y})`}
                    fill={
                      isPlaying
                        ? "#3b82f6"
                        : isSelected
                        ? "#f59e0b"
                        : isWhole || isHalf
                        ? "transparent"
                        : "currentColor"
                    }
                    stroke={isPlaying ? "#3b82f6" : isSelected ? "#f59e0b" : "currentColor"}
                    strokeWidth={isWhole || isHalf ? "2" : "1"}
                    className={`transition-all duration-75 ${
                      isPlaying
                        ? "text-blue-500 scale-125"
                        : isSelected
                        ? "text-amber-500 scale-110"
                        : "text-zinc-900 dark:text-zinc-100 group-hover:text-amber-500"
                    }`}
                  />

                  {/* Stem */}
                  {!isWhole && (
                    <line
                      x1={x + 9}
                      y1={y}
                      x2={x + 9}
                      y2={y - 28}
                      stroke={isPlaying ? "#3b82f6" : isSelected ? "#f59e0b" : "currentColor"}
                      strokeWidth="1.5"
                      className={
                        isPlaying
                          ? "text-blue-500"
                          : isSelected
                          ? "text-amber-500"
                          : "text-zinc-900 dark:text-zinc-100"
                      }
                    />
                  )}

                  {/* Pitch Label */}
                  <text
                    x={x + 4}
                    y={STAFF_TOP + STAFF_HEIGHT + 28}
                    textAnchor="middle"
                    className={`text-[10px] font-mono font-medium transition-colors ${
                      isPlaying
                        ? "fill-blue-500 font-bold"
                        : isSelected
                        ? "fill-amber-500 font-bold"
                        : "fill-zinc-500 group-hover:fill-amber-500 dark:fill-zinc-400"
                    }`}
                  >
                    {n.pitch}
                  </text>
                </g>
              );
            })}

            {/* Playhead */}
            {activeBeat >= 0 && (
              <g transform={`translate(${75 + activeBeat * BEAT_WIDTH}, 0)`}>
                <line
                  x1="0"
                  y1={STAFF_TOP - 15}
                  x2="0"
                  y2={STAFF_TOP + STAFF_HEIGHT + 35}
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                  className="animate-pulse"
                />
                <polygon points="-5,15 5,15 0,25" fill="#3b82f6" />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};
