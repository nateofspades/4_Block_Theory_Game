# IP audit — 4 Block Theory

## Scope and conclusion

**Rating: Moderate concern.** This is an apparent-risk assessment, not legal clearance, a trademark opinion or a guarantee of originality. The owner expressly authorized publication and renaming of the existing repository after disclosure; the earlier private-preparation hold is superseded by that authorization, not by a legal finding. Preliminary approved naming was not screened again. No specific new name conflict was identified during this focused audit.

The game is plainly inspired by **Tetris**: the seven four-cell shapes, 10×20 arena, rotation kicks, falling/locking/line clearing, hold/next and ghost combination are recognizable. Those standard functional mechanics were deliberately preserved, including all twenty rows and mobile bottom-row functionality. Their legal characterization and the overall interactive presentation require qualified IP counsel, especially before commercialization. Changing a title/palette does not alone resolve overall-expression issues.

## Provenance evidence

Repository originally `nateofspades/tetris_game`, immutable GitHub repository ID **1420061632**. Original main at start: `842622f6200e3a55847a7cda5699332b86190653`. Initial source commit `7b55861` ("feat: build and test responsive Tetris game") contains the initial engine/presentation/test code; soundtrack introduced in `f21c4f7`, subsequently corrected in `0c461df`, `8f8c331` and `842622f`. Git author history attributes the project to Nathan Burns; almost all commits use the GitHub numeric-ID noreply address, with one README commit using a historical personal address. Git attribution is evidence, not an independently established chain of title or proof no outside copying occurred.

Four unique prepared commits are retained without rewriting: `0186ffe` (floor/toggle/orientation regressions), `8178651` (ceramic visual redesign), `35c81db` (private identity/release gates), `da38dad` (real gameplay evidence/tooling notices). No original shared git storage or checkout is removed. This final migration changes public identity/docs/CI and fixes approved-title landscape containment. The mechanics and music files `src/engine.js` and `src/music.js` remain byte-for-byte identical to original main; external evidence includes git diff, full history and tracked-file object inventory.

## File-level expression / asset inventory

| File(s) | Origin and expression | License / assessment |
|---|---|---|
| `src/engine.js` | Repository-authored rules, seven shapes, rotation/kick tables, scoring and persistence from initial history | No general source license identified; functional conventional tables do not prove freedom to copy an overall presentation |
| `src/app.js` | Original application shell; prepared redesign draws chamfered ceramic tiles with stamped diamond/spindle marks, same material across all piece types; dotted bed and dashed ghost | Repository history only; no downloaded sprite/template identified; procedural drawing is not proof of originality |
| `src/rendering.js` | Prepared geometry and tile contours supporting full twenty rows | Repository-authored code, no general license grant |
| `src/style.css` | Warm paper/mineral/rust palette, open asymmetric gantry, registration strip, moving daylight wash, production readout and side instrument panel | CSS-authored, no external texture/font; system monospace stack, no bundled font; reduced-motion alternative retained |
| `index.html` | Accessible controls/menu, final title/metadata and semantic layout | Owner-directed identity change; no commercial logo/character/branding in prominent UI |
| `src/music.js` | One instrumental loop historically titled "Neon Stack"; square lead, triangle bass and synthesized kick/noise hats | No sampled recording, MIDI asset or external soundfont; source assertion of original authorship is not an independent clearance or license grant |
| `assets/screenshots/gameplay.png`, `gameplay-mobile.png` | New actual active local-browser captures of final-title game; used in README | Project imagery; no official reference artwork included |
| `assets/screenshots/private-gameplay-desktop.png`, `private-gameplay-mobile.png` | Historical real captures of prepared Kiln / 07 presentation | Retained historical project evidence, not current public branding or current deployment proof |
| `docs/THIRD_PARTY_NOTICES.md` | Actual installed direct tooling LICENSE/NOTICE texts, including Vite bundled notices | Playwright Apache-2.0; Vite/Vitest/jsdom MIT; notices retained. This is not a grant covering game-specific inputs |
| `README.md`, `docs/private-migration.md`, `.hermes.md`, `docs/IP_AUDIT.md` | Project documentation, provenance and instructions | No blanket repository license supplied; historical commercial references retained only where explanatory |
| `tests/*`, build/test configs, package manifest/lock and `.github/workflows/ci.yml` | Local tests/tooling/deployment; no commercial runtime art | Development dependencies, pinned lock; no bare third-party runtime dependency imported by game |

There are no character sprites, commercial logos, image textures, recorded music, sound effects, downloaded fonts or externally fetched game assets in the runtime. Text arrows/control glyphs are system font glyphs. Node modules/build/test outputs are not versioned. The repository has **no general LICENSE**: public availability is not unrestricted reuse permission. Owner publication authorization does not establish third-party chain of title. No new blanket license was invented. Tooling notices are retained and included in the Pages artifact.

## Commercial-reference comparison actually inspected

Official sources accessed for narrow inspiration evidence:

- https://play.tetris.com/games/ — official promotional gameplay and rules/scoring; footer asserts Tetris Holding's trademark/trade-dress rights.
- https://play.tetris.com/games/_assets/games/tetris-primary-gameplay.mp4?v=f22a7a20 — official promotional clip; a frame at two seconds was extracted privately and actually inspected as an image.
- https://play.tetris.com/ and https://play.tetris.com/about — official description and rights notices.

The inspected official frame has a black square-grid well in thick rounded metallic housing, glossy square tiles with the conventional multicolor mapping, separate dark HOLD/NEXT/readout modules flanking the board, and floating colored polygon/cube scenery on white. The prepared game's real desktop screenshot was also inspected: paper/rust workshop surroundings, mono material-by-state tile colors, octagonal/chamfered stamped faces, registration dots rather than bright grid squares, an open offset gantry, horizontal production statistics and a combined intake/reserve panel. Final-title gameplay screenshots are captured and visually inspected separately for release evidence. The spatial arena proportions, seven-piece silhouettes, settled stacks, preview/hold and landing guide are still shared recognizable features; this assessment does not pretend the expressive redesign erases them.

The browser-use reference navigation timed out; the successful comparison used the official published promotional video frame, not an invented claim of hands-on commercial play. No commercial reference artwork was copied into source, README or public build. Private reference evidence is outside the repository and must not be redistributed as game art. This is a limited frame/source comparison, not exhaustive comparison of all licensed versions, animations, play sessions, audiovisual compositions or a legal substantial-similarity analysis.

## Music notation review and preservation

The authored lead array is MIDI notes `76,79,83,79,74,79,81,79,72,76,79,76,71,74,78,81,76,79,83,86,84,83,79,76,74,78,81,84,83,81,79,78`; bass is `40,40,47,40,36,36,43,36,38,38,45,38,35,35,42,47`. The 12.8-second loop uses a 0.1-second subdivision (150 BPM sixteenth pulse), octave variation in the fourth phrase, and procedural percussion. No imported commercial theme transcription/recording is identified in the file/history scan. No identified material concern justified removing or rewriting this distinct existing instrumental track.

However, synthesis and authored note arrays do not guarantee originality. No exhaustive music-database comparison, independent listening/musicological analysis or speaker playback is claimed. Real-browser tests check nonzero post-gain analyser signal, actual AudioContext clock advancement, fixed volume, autoplay gesture, pause/visibility, mute/unmute and same source/context over restart/resize/orientation. Those prove technical signal/continuity, not compositional clearance or physical-speaker loudness. There is no volume slider or added SFX.

## Implemented safeguards and remaining uncertainty

- Exact public title **4 Block Theory** replaces prominent commercial/private branding in title/menu/metadata/package/README and current screenshots. Compatibility/internal names and historical notices remain.
- Retain the prepared independent workshop expression rather than reverting to rainbow/glossy commercial-style presentation.
- Regression-first landscape fix contains the longer final title without hiding the music toggle or covering the arena. Full twenty rows, hard drop/ghost/hold/scoring and mobile bottom row remain tested.
- Preserve source history, storage keys, original soundtrack and one transport; test synthetic same-origin path retention, not real-user migration.
- CI gates unit/browser checks before Pages for the same commit. Preserve tooling notices; do not infer blanket source licensing.

No specific copied commercial character/art/audio was identified, but the provenance inquiry is limited to available repository history, source and the stated reference evidence. Obtain professional legal advice concerning retained overall expression, trademark positioning, ownership/license scope and music before commercial exploitation. Owner-directed publication proceeds with these disclosed **Moderate concern** limitations, not an assertion of legal safety.
