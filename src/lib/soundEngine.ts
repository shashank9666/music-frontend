import { pitchToMidi } from "./compiler";
import { SynthInstrument } from "./types";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private currentInstrument: SynthInstrument = "grand_piano";

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setInstrument(inst: SynthInstrument) {
    this.currentInstrument = inst;
  }

  public setVolume(vol: number) {
    this.init();
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolume(this.isMuted ? 0 : 0.7);
    return this.isMuted;
  }

  public playTone(pitch: string, durationSec: number = 0.5, velocity: number = 80) {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    if (pitch.toUpperCase() === "REST") return;

    const midi = pitchToMidi(pitch);
    if (midi < 0) return;

    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const now = this.ctx.currentTime;
    const gainFactor = (velocity / 127) * 0.4;

    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    // Instrument characterization
    switch (this.currentInstrument) {
      case "grand_piano": {
        osc.type = "triangle";
        // Fast attack, natural decay
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(gainFactor, now + 0.015);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.1, durationSec * 1.2));
        break;
      }
      case "synth_lead": {
        osc.type = "sawtooth";
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2400, now);
        filter.frequency.exponentialRampToValueAtTime(600, now + durationSec);
        
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(gainFactor * 0.8, now + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

        osc.connect(filter);
        filter.connect(noteGain);
        break;
      }
      case "8bit_chiptune": {
        osc.type = "square";
        noteGain.gain.setValueAtTime(gainFactor * 0.5, now);
        noteGain.gain.setValueAtTime(gainFactor * 0.5, now + durationSec * 0.8);
        noteGain.gain.linearRampToValueAtTime(0.0001, now + durationSec);
        break;
      }
      case "ambient_pad": {
        osc.type = "sine";
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(gainFactor * 0.7, now + 0.15);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec * 1.5);
        break;
      }
      case "electric_organ":
      default: {
        osc.type = "sine";
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(gainFactor * 0.8, now + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec * 0.95);
        break;
      }
    }

    osc.frequency.setValueAtTime(freq, now);

    if (this.currentInstrument !== "synth_lead") {
      osc.connect(noteGain);
    }
    noteGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + Math.max(0.2, durationSec * 1.5));
  }
}

export const soundEngine = typeof window !== "undefined" ? new AudioEngine() : ({} as AudioEngine);

