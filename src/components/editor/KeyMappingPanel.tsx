"use client";

import React, { useState } from "react";
import { Keyboard, RotateCcw } from "lucide-react";
import { soundEngine } from "@/lib/soundEngine";

export interface KeyMap {
  [key: string]: string;
}

export const DEFAULT_KEY_MAP: KeyMap = {
  a: "C4",
  w: "C#4",
  s: "D4",
  e: "D#4",
  d: "E4",
  f: "F4",
  t: "F#4",
  g: "G4",
  y: "G#4",
  h: "A4",
  u: "A#4",
  j: "B4",
  k: "C5",
  o: "C#5",
  l: "D5",
  p: "D#5",
  ";": "E5",
  " ": "REST",
};

interface KeyMappingPanelProps {
  keyMap: KeyMap;
  onUpdateKeyMap: (newMap: KeyMap) => void;
  activeKey: string | null;
  currentlyPlayingPitch?: string | null;
  onKeyType: (note: string) => void;
}

const ALL_NOTES = [
  "REST",
  "C3", "D3", "E3", "F3", "G3", "A3", "B3",
  "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
  "C5", "C#5", "D5", "D#5", "E5", "F5", "G5", "A5"
];

export const KeyMappingPanel: React.FC<KeyMappingPanelProps> = ({
  keyMap,
  onUpdateKeyMap,
  activeKey,
  currentlyPlayingPitch,
  onKeyType,
}) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const handleNoteChange = (charKey: string, newPitch: string) => {
    onUpdateKeyMap({
      ...keyMap,
      [charKey]: newPitch,
    });
    setEditingKey(null);
    if (newPitch !== "REST") {
      soundEngine.playTone(newPitch, 0.3);
    }
  };

  const handleReset = () => {
    onUpdateKeyMap(DEFAULT_KEY_MAP);
    setEditingKey(null);
  };

  return (
    <div className="glass-panel rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-inner">
            <Keyboard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              Keyboard Typing & Note Map
            </h3>
            <p className="text-[11px] text-zinc-400">
              Type keys on your keyboard to instantly add notes. Click any key below to customize its note.
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-white glass-pill px-3 py-1.5 rounded-xl transition hover:bg-white/10"
          title="Reset to default key mapping"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Interactive Key Grid with Glassmorphic Keys */}
      <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-18 gap-2 max-h-[160px] overflow-y-auto pr-1 py-1">
        {Object.entries(keyMap).map(([charKey, pitch]) => {
          const isPressed = activeKey === charKey.toLowerCase();
          const isNotePlaying = currentlyPlayingPitch === pitch && pitch !== "REST";
          const isSpace = charKey === " ";
          const displayChar = isSpace ? "Space (Rest)" : charKey.toUpperCase();
          const isEditing = editingKey === charKey;

          return (
            <div key={charKey} className="relative group">
              <button
                type="button"
                onClick={() => {
                  onKeyType(pitch);
                  setEditingKey(isEditing ? null : charKey);
                }}
                className={`w-full flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border text-center transition-all duration-100 ${
                  isPressed || isNotePlaying
                    ? "bg-sky-500/30 border-sky-400 text-white scale-95 shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                    : isEditing
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                    : pitch === "REST"
                    ? "glass-card text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    : "glass-card hover:bg-white/[0.08] hover:border-white/20 text-zinc-200"
                }`}
                title={`Key '${charKey}': ${pitch}`}
              >
                <span className="text-[11px] font-bold font-mono text-zinc-300">
                  {displayChar}
                </span>
                <span
                  className={`text-[10px] font-semibold font-mono mt-0.5 ${
                    isNotePlaying
                      ? "text-sky-300 font-extrabold"
                      : pitch === "REST"
                      ? "text-amber-400/80"
                      : "text-sky-400"
                  }`}
                >
                  {pitch}
                </span>
              </button>

              {/* Edit Note Dropdown */}
              {isEditing && (
                <div className="absolute top-full left-0 mt-2 z-50 glass-panel border border-white/20 rounded-2xl p-2.5 shadow-2xl w-36 max-h-48 overflow-y-auto">
                  <div className="text-[10px] font-bold text-zinc-400 pb-1.5 mb-1.5 border-b border-white/10 flex items-center justify-between">
                    <span>Map '{displayChar}' to:</span>
                    <button
                      onClick={() => setEditingKey(null)}
                      className="text-zinc-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {ALL_NOTES.map((n) => (
                      <button
                        key={n}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNoteChange(charKey, n);
                        }}
                        className={`text-[10px] font-mono py-1 px-1.5 rounded-lg text-left transition ${
                          n === pitch
                            ? "bg-sky-500 text-white font-bold shadow-sm"
                            : "hover:bg-white/10 text-zinc-300"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
