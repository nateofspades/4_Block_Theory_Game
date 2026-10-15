export const MUSIC_PREFERENCE_KEY = 'tetris-music';
export const TRACK_DURATION_SECONDS = 12.8;

const STEP_SECONDS = 0.1; // 150 BPM, sixteenth-note pulse.
const MELODY = [
  76, 79, 83, 79, 74, 79, 81, 79,
  72, 76, 79, 76, 71, 74, 78, 81,
  76, 79, 83, 86, 84, 83, 79, 76,
  74, 78, 81, 84, 83, 81, 79, 78,
];
const BASS = [40, 40, 47, 40, 36, 36, 43, 36, 38, 38, 45, 38, 35, 35, 42, 47];
const midiFrequency = note => 440 * 2 ** ((note - 69) / 12);
const square = phase => (Math.sin(phase) >= 0 ? 1 : -1);
const triangle = phase => (2 / Math.PI) * Math.asin(Math.sin(phase));
const clamp = sample => Math.max(-1, Math.min(1, sample));

/**
 * Renders "Neon Stack", an original deterministic chiptune composition.
 * The melody, bass line, synthesis, and percussion pattern are authored for
 * this project, so no third-party recording or sample asset is distributed.
 */
export function renderChiptuneSamples(sampleRate) {
  const length = Math.round(sampleRate * TRACK_DURATION_SECONDS);
  const samples = new Float32Array(length);
  let noise = 0x51f15e;

  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate;
    const step = Math.floor(time / STEP_SECONDS);
    const stepTime = time % STEP_SECONDS;
    const phrase = Math.floor(step / 32);
    const melodyNote = MELODY[step % MELODY.length] + (phrase % 4 === 3 ? 12 : 0);
    const melodyEnvelope = Math.max(0, 1 - stepTime / 0.092);
    const melody = square(2 * Math.PI * midiFrequency(melodyNote) * time) * melodyEnvelope * 0.22;

    const bassNote = BASS[Math.floor(step / 2) % BASS.length];
    const bassTime = time % (STEP_SECONDS * 2);
    const bassEnvelope = Math.max(0, 1 - bassTime / 0.19);
    const bass = triangle(2 * Math.PI * midiFrequency(bassNote) * time) * bassEnvelope * 0.24;

    noise = (Math.imul(noise, 1664525) + 1013904223) >>> 0;
    const noiseSample = noise / 0x80000000 - 1;
    const hat = stepTime < 0.018 ? noiseSample * (1 - stepTime / 0.018) * 0.08 : 0;
    const beatTime = time % (STEP_SECONDS * 4);
    const kickEnvelope = beatTime < 0.075 ? 1 - beatTime / 0.075 : 0;
    const kick = Math.sin(2 * Math.PI * (78 - beatTime * 500) * time) * kickEnvelope * 0.25;

    samples[index] = clamp((melody + bass + hat + kick) * 0.9);
  }

  return samples;
}

function defaultContextFactory() {
  const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
  return Context ? new Context() : null;
}

function defaultStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

export class MusicController {
  constructor({
    storage = defaultStorage(),
    documentRef = globalThis.document,
    createContext = defaultContextFactory,
    renderSamples = renderChiptuneSamples,
    onChange = () => {},
  } = {}) {
    this.storage = storage;
    this.documentRef = documentRef;
    this.createContext = createContext;
    this.renderSamples = renderSamples;
    this.onChange = onChange;
    this.enabled = this.readPreference();
    this.activated = false;
    this.context = null;
    this.source = null;
    this.gain = null;
    this._positionBase = 0;
    this._startedAt = 0;
    this._rebuilding = false;
  }

  readPreference() {
    try { return this.storage?.getItem(MUSIC_PREFERENCE_KEY) !== 'off'; } catch { return true; }
  }

  persistPreference() {
    try { this.storage?.setItem(MUSIC_PREFERENCE_KEY, this.enabled ? 'on' : 'off'); } catch {}
  }

  get position() {
    if (!this.context || !this.source) return this._positionBase;
    const elapsed = Math.max(0, this.context.currentTime - this._startedAt);
    return (this._positionBase + elapsed) % TRACK_DURATION_SECONDS;
  }

  ensureGraph() {
    if (this.context && this.context.state !== 'closed' && this.source) return true;
    try {
      const context = this.createContext();
      if (!context) return false;
      const samples = this.renderSamples(context.sampleRate || 48000);
      const buffer = context.createBuffer(1, samples.length, context.sampleRate || 48000);
      buffer.getChannelData(0).set(samples);
      const source = context.createBufferSource();
      const gain = context.createGain();
      gain.gain.value = 0.18;
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      gain.connect(context.destination);
      const offset = this._positionBase % TRACK_DURATION_SECONDS;
      source.start(0, offset);
      this.context = context;
      this.source = source;
      this.gain = gain;
      this._startedAt = context.currentTime;
      context.onstatechange = () => { void this.handleAudioStateChange(); };
      return true;
    } catch {
      this.context = null;
      this.source = null;
      this.gain = null;
      return false;
    }
  }

  async resume() {
    if (!this.enabled || !this.activated || this.documentRef?.hidden) return false;
    if (!this.ensureGraph()) return false;
    try {
      if (this.context.state !== 'running') await this.context.resume();
      return true;
    } catch { return false; }
  }

  async suspend() {
    if (!this.context || this.context.state !== 'running') return;
    try { await this.context.suspend(); } catch {}
  }

  async handleInteraction() {
    this.activated = true;
    return this.resume();
  }

  async setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.persistPreference();
    this.onChange(this.enabled);
    if (this.enabled) return this.resume();
    await this.suspend();
    return false;
  }

  toggle() { return this.setEnabled(!this.enabled); }

  async handleVisibilityChange() {
    if (this.documentRef?.hidden) return this.suspend();
    return this.resume();
  }

  async handleAudioStateChange() {
    if (!this.context || this._rebuilding) return false;
    if (this.context.state === 'closed') {
      this._rebuilding = true;
      this._positionBase = this.position;
      this.context = null;
      this.source = null;
      this.gain = null;
      this._rebuilding = false;
      return this.resume();
    }
    if (this.context.state === 'interrupted' && this.enabled && !this.documentRef?.hidden) {
      return this.resume();
    }
    return false;
  }
}
