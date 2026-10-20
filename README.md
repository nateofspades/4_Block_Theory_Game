# 4 Block Theory

[Play 4 Block Theory](https://nateofspades.github.io/4_Block_Theory_Game/)

![4 Block Theory — actual active browser gameplay](assets/screenshots/gameplay.png)

A falling-block puzzle in a ceramic workshop: matte stamped tiles, a mineral palette, registration dots and an open fabrication gantry. Fit pieces, clear rows and keep the kiln moving. No account, download or external runtime service is required.

## Play and features

- Full 10-column, **20-playable-row** arena, seven-piece bag, rotation kicks, ghost landing guide and hold.
- Soft/hard drops, single through four-line clears, score and accelerating levels; endless play until the stack tops out (no victory endpoint or separate modes).
- Local high score and music preference; keyboard and thumb-sized mobile controls, portrait and landscape layouts.
- One continuous instrumental chiptune loop, preserved from the original project; no added sound effects.

| Action | Desktop keyboard | Mobile / on-screen |
|---|---|---|
| Move | Left / Right | ◀ / ▶ |
| Rotate | Up | ↻ |
| Soft drop | Down | ▼ |
| Hard drop | Space | ⤓ |
| Hold | C or Shift | H |
| Pause / resume | P or Escape | Pause, then Resume |
| Restart | — | Restart |
| Registration grid | — | Grid (hidden in short landscape) |
| Music | — | Music On / Off |

Music starts after a user gesture, defaults on and pauses with gameplay or tab hiding. Toggle it off/on in the header; volume is the preserved fixed master level `0.28` (there is no volume slider). Restart and orientation changes keep the same source/context instead of layering tracks. Browser/device output volume is controlled by your system. Physical-speaker loudness has not been verified.

## Records and the renamed URL

The existing repository was renamed, not replaced. The compatibility keys `tetris-high-score` and `tetris-music` intentionally remain. Storage belongs to the `nateofspades.github.io` origin, not its repository path; synthetic seeded tests cover old-path/new-path retention. This is not proof that a particular person's browser data migrated. Different browsers, private sessions, cleared storage or a different origin do not share records.

## Development and testing

Node.js 22+ recommended:

```sh
npm ci
npx playwright install chromium
npm run dev       # http://127.0.0.1:4175
npm test          # Vitest, one worker
npm run build
npm run test:e2e  # Chromium, one worker; starts/stops its own local server
npm run test:all
```

The full browser suite covers 1920×1080, 1366×768, 768×1024, 390×844, 320×568 and 844×390, plus 568×320. It checks full-board/control geometry, all twenty rows, actual bottom-row locking/rendering/clearing, keyboard and touch actions, start/pause/resume/restart/game over, scoring, legacy persistence and audio continuity. A separate true mobile-emulation context checks touch play; Web Audio tests measure an actual running context clock and nonzero analyser signal. Emulation is not physical-device testing. No victory screen exists in this endless game.

CI executes unit tests, build and the entire browser suite before deploying the same main commit through GitHub Actions Pages. Relative Vite assets support the exact case-sensitive project path. A current active desktop screenshot is above; [mobile gameplay](assets/screenshots/gameplay-mobile.png) is also captured from the running browser, not a mockup.

## Technology, provenance and licensing

Vanilla JavaScript ES modules, Canvas 2D, responsive CSS and Web Audio; Vite, Vitest and Playwright tooling. No downloaded commercial sprites, fonts, samples or recordings are shipped. The original soundtrack retains its historical track name, **Neon Stack**; its note arrays and synthesis code are unchanged, not evidence of musicological clearance.

See [IP audit](docs/IP_AUDIT.md) for the file-level inventory, source history, comparison, risks and limitations, and [third-party notices](docs/THIRD_PARTY_NOTICES.md) for actual tooling license texts (MIT / Apache-2.0 and bundled notices). There is **no general game-source LICENSE grant**: public availability does not grant unrestricted reuse. The owner's publication authorization is not a third-party license or legal clearance. The recognizable falling-block rules/overall combination still warrant qualified IP counsel. This project is not affiliated with or endorsed by the commercial reference discussed in the audit.
