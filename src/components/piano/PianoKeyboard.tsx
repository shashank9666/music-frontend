"use client";

import React from "react";
import { soundEngine } from "@/lib/soundEngine";
import { Volume2 } from "lucide-react";

interface PianoKeyboardProps {
  onInsertNote?: (pitch: string) => void;
  activePitch?: string | null;
}

const KEYS = [
  { pitch: "C4", isBlack: false, label: "C4" },
  { pitch: "C#4", isBlack: true, label: "C#" },
  { pitch: "D4", isBlack: false, label: "D4" },
  { pitch: "D#4", isBlack: true, label: "D#" },
  { pitch: "E4", isBlack: false, label: "E4" },
  { pitch: "F4", isBlack: false, label: "F4" },
  { pitch: "F#4", isBlack: true, label: "F#" },
  { pitch: "G4", isBlack: false, label: "G4" },
  { pitch: "G#4", isBlack: true, label: "G#" },
  { pitch: "A4", isBlack: false, label: "A4" },
  { pitch: "A#4", isBlack: true, label: "A#" },
  { pitch: "B4", isBlack: false, label: "B4" },
  { pitch: "C5", isBlack: false, label: "C5" },
  { pitch: "C#5", isBlack: true, label: "C#" },
  { pitch: "D5", isBlack: false, label: "D5" },
  { pitch: "D#5", isBlack: true, label: "D#" },
  { pitch: "E5", isBlack: false, label: "E5" },
];

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ onInsertNote, activePitch }) => {
  const handleKeyClick = (pitch: string) => {
    soundEngine.playTone(pitch, 0.4);
    if (onInsertNote) onInsertNote(pitch);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl flex flex-col gap-2">
      <div className="flex items-center justify-between px-2 text-xs text-zinc-400 font-mono">
        <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
          <Volume2 className="w-3.5 h-3.5 text-blue-400" /> Interactive Piano & Sound Preview
        </span>
        <span>Click key to test sound & insert</span>
      </div>

      <div className="relative flex h-28 select-none overflow-x-auto justify-center px-2 py-1">
        {KEYS.map((k) => {
          const isActive = activePitch === k.pitch;
          if (k.isBlack) {
            return (
              <button
                key={k.pitch}
                onClick={() => handleKeyClick(k.pitch)}
                title={k.pitch}
                className={`absolute z-10 w-6 h-16 rounded-b -ml-3 transition-colors shadow-md ${
                  isActive
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
                style={{
                  left: getBlackKeyLeft(k.pitch),
                }}
              >
                <span className="text-[9px] block mt-8">{k.pitch.replace("4", "").replace("5", "")}</span>
              </button>
            );
          }

          return (
            <button
              key={k.pitch}
              onClick={() => handleKeyClick(k.pitch)}
              className={`w-10 h-24 rounded-b border border-zinc-300 flex flex-col justify-end pb-2 font-mono text-[10px] transition-all ${
                isActive
                  ? "bg-blue-100 text-blue-700 font-bold border-blue-400 shadow-inner scale-95"
                  : "bg-white hover:bg-zinc-100 text-zinc-700 active:bg-zinc-200"
              }`}
            >
              {k.pitch}
            </button>
          );
        })}
      </div>
    </div>
  );
};

function getBlackKeyLeft(pitch: string): string {
  const map: Record<string, number> = {
    "C#4": 30,
    "D#4": 70,
    "F#4": 150,
    "G#4": 190,
    "A#4": 230,
    "C#5": 310,
    "D#5": 350,
  };
  return `${(map[pitch] || 0) + 16}px`;
}

