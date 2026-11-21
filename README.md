[![Make the best stealth game](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Rank](https://make.fun/badge/best-stealth-game-20261121-1759/yudi04cod/aica-stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Reward](https://make.fun/badge/best-stealth-game-20261121-1759/yudi04cod/aica-stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

# Emberlight Heist

A top-down 2D stealth game, built for make.fun's **Make the best stealth game** bounty. You are a thief in a lantern-lit museum at night: steal the ember gems, slip past the night watch, hide behind crates and in shadow, and reach the green exit unseen.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any static server — `node serve.ts` works) and play offline. No network requests, no libraries: vanilla JavaScript and canvas.

- **Move:** WASD or arrow keys — or click anywhere on the floor to walk there.
- **Sneak:** hold Shift to move slower and be spotted much more slowly.
- **Watch the cones:** yellow wedges are a guard's sight. Stand in one and their detection meter fills; fill it and the hunt is on — a chasing guard who reaches you ends the run.
- **Cover:** crates and walls block sight as well as movement. Dark shadow patches slow detection to less than half speed.
- **Goal:** grab ember gems for points, then step onto the glowing green EXIT. Clearing a wing earns a time bonus, and a wing cleared without ever raising the alarm earns a GHOST bonus (+200).
- **Restart:** R restarts the wing; M mutes the WebAudio bleeps (footsteps, suspicion ticks, alarm, pickup chimes).

## The three wings

1. **The Gallery** — two slow guards, long sightlines, a gentle intro.
2. **The Vault Wing** — three guards patrolling in pairs, tighter corridors.
3. **The Ember Vault** — four guards including the fast Warden Kess and a rotating sentry.

Guards patrol waypoint loops you can learn, pause and stare when suspicious, chase when the alarm fills, and give up and return to patrol when the trail goes cold. A minimap (bottom right) shows guards, gems and the exit; the HUD shows the alert level, timer, gems and score.

## Files

- `game/index.html` — the page and canvas.
- `game/src/config.js` — tuning and palette.
- `game/src/levels.js` — the three floor plans (walls, crates, shadows, patrols, gems).
- `game/src/guard.js` — patrol, vision cones (raycast against walls), detection and chase.
- `game/src/player.js` — movement, click-to-move, sneaking, collision.
- `game/src/audio.js` — synthesized WebAudio sounds, no audio files.
- `game/src/input.js` — keyboard and mouse state.
- `game/src/render.js` — all drawing: world, cones, HUD, minimap, screens.
- `game/src/game.js` — state machine, scoring, win/lose.
- `game/src/shots.js` — staged screenshot poses (`?shot=title|play|exit|win`).
- `game/src/main.js` — boot and frame loop.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output directory and writes `dossier.json`.
- `screenshots/` — four real renders of the game: title, mid-play, near the exit, wing cleared.

Everything is original: the game, art, sounds and names were made for this entry.

## Verification

- `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` run twice writes byte-identical output (dossier.json + game/ + screenshots/).
- Screenshots are real renders of the game in headless Chromium, staged with `?shot=title|play|exit|win` (see `game/src/shots.js` and `shots.json`).
- The game loads no network resources: every script is a relative file under `game/`, and all art and sound are drawn or synthesized in code.

## Referral

Referral code: `38m33ybw`
