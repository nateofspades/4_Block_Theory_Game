# Private migration preparation — not release approval

## Identities and status

- Private neutral working title: **Kiln / 07**. This labels a local expressive-presentation study, not a cleared public brand.
- Coordinator's proposed migration label: **Neon Stack**; proposed repository slug `neonstackgame`.
- Existing repository / former public path: `tetris_game`. No repository rename, remote edit, push, merge, Pages change, deployment or public URL verification is performed by this preparation.
- Do not advertise a proposed `https://nateofspades.github.io/neonstackgame/` as working. It is an unverified future destination, contingent on separate approval and deployment.
- Package remains private. Legacy engine/debug names and storage identifiers intentionally remain internal; they are not public branding.

## Proposed metadata, only after release gates

Suggested public title, if separately approved: `Neon Stack`; description: `A falling-block puzzle with a ceramic workshop presentation, keyboard and touch controls.` Name availability/trademark review is still required. Apply an approved title/description in HTML, README, package and lockfile together. Do not perform a blanket replacement in music or compatibility identifiers.

Vite uses relative asset URLs (`base: './'`); validate the actual approved hosting path before publication. Check workflow permissions, Pages deployment source, redirects, repository links and shared external links separately. The existing workflow is test-only (read-only contents permission), not a Pages deployment job, and is not proof that a future URL exists.

## Compatibility and preservation

Keep `tetris-high-score` (numeric string) and `tetris-music` (`on` / `off`). localStorage belongs to an origin, not a repository path: a same-origin path rename can retain it, a change of origin does not carry it automatically. The current engine, exact seven shapes/rotations/kicks, 10×20 playable grid, seven-bag, scoring, hold and drops are intentionally unchanged. The full `src/music.js` must stay byte-for-byte identical to baseline `842622f6200e3a55847a7cda5699332b86190653`; retain the musical track's existing title in provenance.

## Unresolved review / public deployment hold

Changing expression is not legal clearance. The recognizable combination of the 10×20 grid, exact seven tetrominoes, rotations/kicks, line clearing, ghost, hold and next still raises unresolved overall-expression concerns in comparison with Tetris, even after the conventional rainbow mapping, square highlighted surfaces, neon scene and flanking HUD are replaced. Qualified comparative review must evaluate the whole interactive presentation, not just isolated rules or screenshots.

The source audit found no general LICENSE for this game. Establish ownership/authorization for source, art and music; existing originality comments are assertions, not grants or verified chain of title. The music has not received independent listening/musicological clearance. No trademark/domain search or legal conclusion is provided. Keep release blocked pending a documented decision on these issues and actual comparison with reference works.
