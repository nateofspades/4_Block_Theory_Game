import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MUSIC_PREFERENCE_KEY,
  MusicController,
  TRACK_DURATION_SECONDS,
  renderChiptuneSamples,
} from '../src/music.js';

class MemoryStorage {
  constructor(entries = {}) { this.values = new Map(Object.entries(entries)); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'suspended';
    this.destination = {};
    this.sources = [];
    this.resume = vi.fn(async () => { this.state = 'running'; });
    this.suspend = vi.fn(async () => { this.state = 'suspended'; });
  }
  createBuffer(channels, length, sampleRate) {
    const channel = new Float32Array(length);
    return { duration: length / sampleRate, getChannelData: () => channel };
  }
  createBufferSource() {
    const source = {
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    this.sources.push(source);
    return source;
  }
  createGain() {
    return { gain: { value: 0 }, connect: vi.fn() };
  }
}

const makeController = ({ stored, hidden = false } = {}) => {
  const contexts = [];
  const documentRef = { hidden };
  const controller = new MusicController({
    storage: new MemoryStorage(stored),
    documentRef,
    renderSamples: () => new Float32Array(128),
    createContext: () => {
      const context = new FakeAudioContext();
      contexts.push(context);
      return context;
    },
  });
  return { controller, contexts, documentRef };
};

describe('original programmatic chiptune', () => {
  it('renders a bounded, non-silent looping waveform', () => {
    const samples = renderChiptuneSamples(8000);
    expect(samples).toHaveLength(8000 * TRACK_DURATION_SECONDS);
    expect(samples.some(sample => sample !== 0)).toBe(true);
    expect(Math.max(...samples)).toBeLessThanOrEqual(1);
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(-1);
  });
});

describe('music lifecycle', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('waits for first interaction and creates only one looping source', async () => {
    const { controller, contexts } = makeController();
    expect(controller.enabled).toBe(true);
    expect(contexts).toHaveLength(0);

    await controller.handleInteraction();
    await controller.handleInteraction();

    expect(contexts).toHaveLength(1);
    expect(contexts[0].sources).toHaveLength(1);
    expect(contexts[0].sources[0].loop).toBe(true);
    expect(contexts[0].sources[0].start).toHaveBeenCalledTimes(1);
  });

  it('persists Music Off and resumes the same source at its position', async () => {
    const storage = new MemoryStorage();
    const contexts = [];
    const controller = new MusicController({
      storage,
      documentRef: { hidden: false },
      renderSamples: () => new Float32Array(128),
    createContext: () => {
        const context = new FakeAudioContext(); contexts.push(context); return context;
      },
    });
    await controller.handleInteraction();
    contexts[0].currentTime = 3.25;
    const before = controller.position;

    await controller.setEnabled(false);
    expect(storage.getItem(MUSIC_PREFERENCE_KEY)).toBe('off');
    expect(contexts[0].suspend).toHaveBeenCalledTimes(1);
    await controller.setEnabled(true);

    expect(storage.getItem(MUSIC_PREFERENCE_KEY)).toBe('on');
    expect(contexts).toHaveLength(1);
    expect(contexts[0].sources).toHaveLength(1);
    expect(controller.position).toBeCloseTo(before, 5);
  });

  it('honors a stored off preference until the user enables music', async () => {
    const { controller, contexts } = makeController({ stored: { [MUSIC_PREFERENCE_KEY]: 'off' } });
    await controller.handleInteraction();
    expect(controller.enabled).toBe(false);
    expect(contexts).toHaveLength(0);

    await controller.setEnabled(true);
    expect(contexts).toHaveLength(1);
    expect(contexts[0].state).toBe('running');
  });

  it('suspends while hidden and resumes after visibility or interruption', async () => {
    const { controller, contexts, documentRef } = makeController();
    await controller.handleInteraction();
    documentRef.hidden = true;
    await controller.handleVisibilityChange();
    expect(contexts[0].state).toBe('suspended');

    documentRef.hidden = false;
    await controller.handleVisibilityChange();
    expect(contexts[0].state).toBe('running');
    contexts[0].state = 'interrupted';
    await controller.handleAudioStateChange();
    expect(contexts[0].resume).toHaveBeenCalledTimes(3);
  });

  it('rebuilds a closed mobile audio context at the previous loop position', async () => {
    const { controller, contexts } = makeController();
    await controller.handleInteraction();
    contexts[0].currentTime = 4.5;
    contexts[0].state = 'closed';

    await controller.handleAudioStateChange();

    expect(contexts).toHaveLength(2);
    expect(contexts[1].sources[0].start).toHaveBeenCalledWith(0, 4.5);
  });
});
