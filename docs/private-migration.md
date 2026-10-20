# Migration preparation — historical context

The private-preparation hold in commits `35c81db` / `da38dad` was superseded by the repository owner's explicit authorization for the final **4 Block Theory** migration. This document records that decision, not legal clearance. The old private titles Kiln / 07 and proposed Neon Stack repository slug were not adopted as the final public identity.

Final title: **4 Block Theory**. Existing repository `nateofspades/tetris_game` becomes `nateofspades/4_Block_Theory_Game`; live path: https://nateofspades.github.io/4_Block_Theory_Game/ . Original local checkout `/root/tetris_game` and shared git storage remain; all four private-preparation commits remain in ancestry. No profiles are managed by this repository.

The ceramic-workshop expressive improvements are retained. `src/engine.js` and `src/music.js` remain byte-identical to original main `842622f6200e3a55847a7cda5699332b86190653`. Legacy debug identifiers and `tetris-high-score` / `tetris-music` storage keys remain deliberately. Same-origin seeded path tests do not prove actual individual user-data migration.

The [IP audit](IP_AUDIT.md) replaces the provisional source-only assessment. Retained seven-piece / 10×20 / line-clear gameplay remains recognizable. Public availability is not an unrestricted license; no general game-source LICENSE was identified. Owner-directed publication accepts disclosed uncertainty, not a legal opinion. Independent musicological and qualified legal review remain recommended.

GitHub Actions now runs full unit/browser checks and deploys the built artifact only after tests pass. External migration evidence records exact commit, review, test counts, immutable repository ID and verified Pages response rather than treating a push alone as deployment.
