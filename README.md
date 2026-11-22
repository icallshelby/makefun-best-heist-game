# VAULTLIGHT — The Gilded Hour

Top-down single-room museum-gallery heist game built for the Make.fun Make-the-Best-Heist-Game competition.

## Overview
You play as **Wren**, a master thief infiltrating a high-security museum vault. Your goal is to bypass roving guard vision cones, sweeping security cameras, and steal **The Gilded Mask** from the central pedestal, then escape through the upper exit door without tripping the 100% alarm threshold.

## Controls
- **Movement:** `WASD` or Arrow Keys
- **Sneak:** Hold `Shift` (halves movement speed, reduces alarm accumulation rate)
- **Interact / Loot:** `E` or `X` (pick up gems and the Gilded Mask)
- **Throw Coin:** `Q` or `C` (distracts the nearest guard for 4 seconds, limited to 3 coins)

## Scoring
- **Ruby Brooch:** 1,200 pts
- **Sapphire Ring:** 1,500 pts
- **The Gilded Mask:** 5,000 pts
- **Successful Escape Bonus:** +2,000 pts
- **Best Score:** Saved in `localStorage` (`vaultlight.best`)

## File Structure
- `game/index.html` — Entry point HTML
- `game/src/config.js` — Game dimensions and color palette
- `game/src/random.js` — Mulberry32 seeded PRNG
- `game/src/input.js` — Keyboard and mouse polling
- `game/src/world.js` — Simulation logic, guards, cameras, loot, alarm, audio
- `game/src/render.js` — Canvas 2D rendering and HUD
- `game/src/shots.js` — Deterministic screenshot staging
- `game/src/main.js` — Main game loop & shot ready trigger
- `shots.json` — Screenshot definitions
- `vendor/makefun-game.ts` — Official kit dossier generator
