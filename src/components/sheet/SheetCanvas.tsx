"use client";

import React, { useRef, useEffect } from "react";
import { NoteEvent } from "@/lib/types";
import { pitchToMidi } from "@/lib/compiler";

interface SheetCanvasProps {
  notes: NoteEvent[];
  activeBeat: number;
  timeSignature: string;
  onNoteClick?: (note: NoteEvent, index: number) => void;
}

export const SheetCanvas: React.FC<SheetCanvasProps> = ({
  notes,
  activeBeat,
  timeSignature,
  onNoteClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse time signature beats per measure (e.g. 4/4 -> 4 beats)
  const [numStr] = timeSignature.split("/");
  const beatsPerMeasure = parseFloat(numStr) || 4;

  const BEAT_WIDTH = 55; // pixels per quarter note
  const STAFF_TOP = 40;
  const LINE_SPACING = 10;
  const STAFF_HEIGHT = LINE_SPACING * 4;

  const totalBeats = notes.reduce((max, n) => Math.max(max, n.start_time + n.duration), 8);
  const totalWidth = Math.max(800, (totalBeats + 4) * BEAT_WIDTH + 100);

  // Helper to compute vertical staff position from MIDI number
  // Middle C (C4 = 60) is below treble staff (line 0 = E4, line 4 = F5)
  const getNoteY = (pitch: string, clef: "treble" | "bass") => {
    const midi = pitchToMidi(pitch);
    if (midi < 0) return STAFF_TOP + STAFF_HEIGHT / 2; // rest

    // Map midi note to diatonic step relative to E4 (treble bottom line)
    // MIDI 64 = E4
    const semitonesFromE4 = midi - 64;
    // Step approximation (each diatonic step is half a line spacing)
    const step = semitonesFromE4 * 0.58; 
    return (STAFF_TOP + STAFF_HEIGHT) - (step * LINE_SPACING);
  };

  // Group measures
  const numMeasures = Math.ceil(totalBeats / beatsPerMeasure) + 1;

  return (
    <div className="w-full overflow-x-auto bg-[#faf8f5] dark:bg-[#18181b] p-6 rounded-2xl border border-amber-900/10 dark:border-zinc-800 shadow-inner select-none transition-colors" ref={containerRef}>
      <div className="relative min-w-max pb-4" style={{ width: totalWidth, height: 200 }}>
        <svg width={totalWidth} height="200" className="overflow-visible">
          {/* Clef label */}
          <text x="20" y={STAFF_TOP + STAFF_HEIGHT * 0.75} className="font-serif text-3xl fill-zinc-700 dark:fill-zinc-300 font-bold">
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

            if (isRest) {
              return (
                <g key={`rest-${idx}`} transform={`translate(${x}, ${STAFF_TOP + 12})`}>
                  <rect width="6" height="12" fill={isPlaying ? "#f59e0b" : "#71717a"} rx="1" />
                  <text x="-4" y="22" className="text-[9px] fill-zinc-400 font-mono">𝄽</text>
                </g>
              );
            }

            const isQuarterOrShorter = n.duration <= 1.0;
            const isHalf = n.duration > 1.0 && n.duration < 4.0;
            const isWhole = n.duration >= 4.0;

            return (
              <g
                key={`note-${idx}`}
                onClick={() => onNoteClick && onNoteClick(n, idx)}
                className="cursor-pointer group"
              >
                {/* Ledger lines for high/low notes */}
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
                      : isWhole || isHalf
                      ? "transparent"
                      : "currentColor"
                  }
                  stroke={isPlaying ? "#3b82f6" : "currentColor"}
                  strokeWidth={isWhole || isHalf ? "2" : "1"}
                  className={`transition-all duration-75 ${
                    isPlaying
                      ? "text-blue-500 scale-125"
                      : "text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600"
                  }`}
                />

                {/* Stem */}
                {!isWhole && (
                  <line
                    x1={x + 9}
                    y1={y}
                    x2={x + 9}
                    y2={y - 28}
                    stroke={isPlaying ? "#3b82f6" : "currentColor"}
                    strokeWidth="1.5"
                    className={isPlaying ? "text-blue-500" : "text-zinc-900 dark:text-zinc-100"}
                  />
                )}

                {/* Pitch Tag Label */}
                <text
                  x={x + 4}
                  y={STAFF_TOP + STAFF_HEIGHT + 28}
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-medium transition-colors ${
                    isPlaying
                      ? "fill-blue-500 font-bold"
                      : "fill-zinc-500 group-hover:fill-amber-600 dark:fill-zinc-400"
                  }`}
                >
                  {n.pitch}
                </text>
              </g>
            );
          })}

          {/* Real-time Playhead Cursor */}
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
  );
};

