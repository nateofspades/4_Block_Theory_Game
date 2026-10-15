# Tetris

**Play now: https://nateofspades.github.io/tetris_game/**

![Fresh Tetris gameplay screenshot](assets/screenshots/gameplay.png)

A responsive Canvas Tetris game with a separately tested engine: seven-bag randomization, SRS-style wall kicks, ghost and hold pieces, scoring, levels, a local high score, an optional grid, keyboard controls, touch controls, and persistent chiptune music.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | Left / Right arrows | ◀ / ▶ |
| Rotate | Up arrow | ↻ |
| Soft drop | Down arrow | ▼ |
| Hard drop | Space | ⤓ |
| Hold | C or Shift | H |
| Pause / resume | P or Escape | Ⅱ |
| Restart | — | Restart |
| Grid | — | Grid button |
| Music | — | Music On / Off |

## Music

**Neon Stack** is an original, energetic instrumental chiptune composed for this repository. `src/music.js` defines its melody, bass, percussion pattern, and synthesized square/triangle/noise waveform; no third-party recording or sample is bundled.

Music is enabled by default and starts only after the first keyboard, pointer, or touch interaction to respect browser autoplay rules. The Music On/Off preference is stored locally. Pausing the music, restarting the game, reaching game over, returning to the menu, or resizing the window does not restart the track.

## Setup and tests

Requires Node.js 22 or a compatible current Node release.

```bash
npm ci
npx playwright install chromium
npm run dev       # http://127.0.0.1:4175
npm test          # Vitest engine, rendering, and music tests
npm run build     # production bundle
npm run test:e2e  # Playwright browser tests, one worker
npm run test:all  # unit tests, build, and browser tests
```

The Playwright suite checks keyboard and touch gameplay, music continuity and preference behavior, browser console/network failures, resizing, and layout at 1920×1080, 1366×768, 768×1024, 390×844, 320×568, and 844×390.
