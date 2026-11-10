"use client";

import React, { useState } from "react";
import { Keyboard, Settings2, RotateCcw, Volume2, Check } from "lucide-react";
import { soundEngine } from "@/lib/soundEngine";

export interface KeyMap {
  [key: string]: string; // e.g. 'a': 'C4', 's': 'D4'
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Keyboard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
              Keyboard Typing & Note Map
            </h3>
            <p className="text-[11px] text-zinc-400">
              Type on your keyboard to instantly insert notes onto the music sheet! Click any key below to customize its note.
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-amber-400 bg-zinc-800/80 hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-zinc-700/60 transition"
          title="Reset to standard piano keyboard mapping"
        >
          <RotateCcw className="w-3 h-3" /> Reset Map
        </button>
      </div>

      {/* Interactive Key Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-18 gap-1.5 max-h-[160px] overflow-y-auto pr-1 py-1">
        {Object.entries(keyMap).map(([charKey, pitch]) => {
          const isPressed = activeKey === charKey.toLowerCase();
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
                className={`w-full flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                  isPressed
                    ? "bg-blue-600 border-blue-400 text-white scale-95 shadow-lg shadow-blue-500/30"
                    : isEditing
                    ? "bg-amber-500/20 border-amber-400 text-amber-300"
                    : pitch === "REST"
                    ? "bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:border-zinc-500"
                    : "bg-zinc-800/90 hover:bg-zinc-750 border-zinc-700 hover:border-blue-400/50 text-zinc-200"
                }`}
                title={`Press '${charKey}' or click to type ${pitch}. Click to edit note.`}
              >
                <span className="text-[11px] font-bold font-mono text-zinc-300">
                  {displayChar}
                </span>
                <span
                  className={`text-[10px] font-semibold font-mono mt-0.5 ${
                    pitch === "REST" ? "text-amber-400" : "text-blue-400"
                  }`}
                >
                  {pitch}
                </span>
              </button>

              {/* Edit Note Dropdown */}
              {isEditing && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-zinc-950 border border-zinc-700 rounded-xl p-2 shadow-2xl w-36 max-h-48 overflow-y-auto">
                  <div className="text-[10px] font-bold text-zinc-400 pb-1 mb-1 border-b border-zinc-800 flex items-center justify-between">
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
                        className={`text-[10px] font-mono py-1 px-1.5 rounded text-left transition ${
                          n === pitch
                            ? "bg-blue-600 text-white font-bold"
                            : "hover:bg-zinc-800 text-zinc-300"
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

