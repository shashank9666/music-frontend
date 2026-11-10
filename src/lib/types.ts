export interface NoteEvent {
  pitch: string;          // e.g. "C4", "G#4", "REST"
  duration: number;       // in beats (1.0 = quarter note)
  duration_name: string;  // "whole", "half", "quarter", "eighth", "16th"
  velocity: number;
  start_time: number;     // in beats
  track: number;
  clef: "treble" | "bass";
}

export interface CompileResult {
  title: string;
  tempo: number;
  time_signature: string;
  notes: NoteEvent[];
  total_beats: number;
  total_duration_sec: number;
  warnings: string[];
}

export interface Project {
  id?: number;
  title: string;
  description?: string;
  author?: string;
  tempo: number;
  time_signature: string;
  key_signature: string;
  code: string;
  created_at?: string;
  updated_at?: string;
}

export type SynthInstrument = "grand_piano" | "synth_lead" | "electric_organ" | "8bit_chiptune" | "ambient_pad";

