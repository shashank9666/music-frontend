"use client";

import React from "react";
import { Plus, Repeat, Music, Layers, Sparkles } from "lucide-react";

interface BuildingBlocksProps {
  onAddBlock: (snippet: string) => void;
}

export const BuildingBlocks: React.FC<BuildingBlocksProps> = ({ onAddBlock }) => {
  const blocks = [
    {
      category: "Notes & Rests",
      items: [
        { label: "Quarter Note (C4)", code: "play C4 1/4\n", icon: Music },
        { label: "Eighth Note (E4)", code: "play E4 1/8\n", icon: Music },
        { label: "Half Note (G4)", code: "play G4 1/2\n", icon: Music },
        { label: "Rest (Quarter)", code: "rest 1/4\n", icon: Music },
      ],
    },
    {
      category: "Chords & Harmonies",
      items: [
        { label: "C Major Chord", code: "chord C4:maj 1/2\n", icon: Layers },
        { label: "A Minor Chord", code: "chord A3:min 1/2\n", icon: Layers },
        { label: "G Major 7th", code: "chord G3:maj7 1/2\n", icon: Layers },
        { label: "Custom Triad", code: "chord [D4,F#4,A4] 1/2\n", icon: Layers },
      ],
    },
    {
      category: "Patterns & Loops",
      items: [
        {
          label: "Repeat Loop (x2)",
          code: "loop 2 {\n    play C4 1/8\n    play E4 1/8\n    play G4 1/8\n    play C5 1/8\n}\n",
          icon: Repeat,
        },
        {
          label: "C Major Arpeggio",
          code: "arp C4:maj 1/8\n",
          icon: Sparkles,
        },
        {
          label: "D Minor Arpeggio",
          code: "arp D4:min 1/8\n",
          icon: Sparkles,
        },
      ],
    },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Musical Building Blocks
        </h3>
        <span className="text-[11px] text-zinc-500">Click to append</span>
      </div>

      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
        {blocks.map((section) => (
          <div key={section.category} className="space-y-2">
            <span className="text-[11px] font-medium text-zinc-400">
              {section.category}
            </span>
            <div className="grid grid-cols-2 gap-2">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => onAddBlock(item.code)}
                    className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 hover:border-amber-500/40 border border-zinc-700/50 text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Icon className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-zinc-200 truncate group-hover:text-white">
                        {item.label}
                      </span>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

