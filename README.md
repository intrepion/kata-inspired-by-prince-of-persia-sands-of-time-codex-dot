# The Last Meridian

An original acrobatic action adventure inspired by the camera, movement and finite mistake recovery of *Prince of Persia: The Sands of Time* (2003 console/PC). Courier **Sera** crosses the stormbound city of **Vey** to restore its meridian bell. Original story, geometric art and locally synthesized audio; no source-game assets or remote services.

The default **Broken Aqueduct** route is a bounded third-person 3D vertical slice: camera-relative free movement, a wall-run above a void, vertical wall run / ledge catch and climb, a hanging-pole transfer, a moving blade, and two sentinels whose sand must be retrieved before the bell gate opens. It is a short mechanics study, not a full recreation or campaign. The original four-chamber side-view adventure remains playable at `?legacy=1` and retains its original save.

## Play locally

**http://127.0.0.1:5193/** — 3D courtyard route.

**http://127.0.0.1:5193/?legacy=1** — original side-view adventure.

```sh
npm run build
python3 scripts/start-preview.py 5193
```

The launcher refuses an occupied port and records its own PID/log. Before restarting, verify the recorded PID belongs to this checkout's `scripts/serve.py`; never stop an unrelated process. It binds to loopback and has no boot/login integration. Development: `npm run dev -- --port 5194 --strictPort`, after checking that port is free.

## Courtyard controls

| Action | Input |
|---|---|
| Camera-relative move | W / A / S / D |
| Orbit / camera height | Left–Right / Up–Down arrows; middle-drag also orbits |
| Overview / camera reset | Q toggles overview; F restores route-facing camera |
| Jump, ledge climb, pole release, enemy vault | Space |
| Wall run, run up wall, block | Hold Shift or right mouse |
| Sword / counter / aerial vault strike | X or left mouse |
| Retrieve sand, fountain checkpoint, bell | E |
| Rewind | Hold R; release to branch |
| Pause / return to fountain | P or Escape / T |

The visible buttons can be held and combined. Jump, sword and E are press edges and ignore operating-system key repeat. Losing focus or hiding the page pauses and clears held controls. Audio starts only when Sound is enabled.

Follow the gold wall marks. At the first wall, hold forward + Shift to run across the gap; release over the far landing. At the high gallery wall, forward + Shift runs up and climbs; jumping toward the lip catches it, and another Space climbs. Jump toward the gold pole from the gallery edge, release the key, then press Space again during the forward swing to reach the court. A normal jump cannot cross the first gap. The blade can be avoided by route choice or jump height.

Move toward a sentinel and press Space to vault it; X in the air knocks it down. Alternatively, strike repeatedly, or hold block and press X immediately after a defended hit for a counter. **A sword knockdown is temporary. E retrieves the sand, destroys that sentinel and refills one tank.** Unretrieved sentinels recover. The two-enemy gate opens only after both retrievals.

Three sand tanks permit separate rewind activations. Each hold spends one tank and unwinds up to ten seconds at twice normal speed, including enemy state, trap timing, health and fatal falls. Tanks remain spent outside history. E at a blue fountain restores health/tanks, clears the thread and saves a checkpoint. Reloads start a fresh attempt from that fountain. Court checkpoints restart the fight. `last-meridian-courtyard-v1` is independent of the original `last-meridian-save-v1`; neither mode migrates or overwrites the other's progress. Restarting this route asks before replacing its checkpoint. Unavailable browser storage is reported without stopping play.

## Original four-chamber adventure

The original aqueduct, wall-kick garden, vent/shutter puzzle and Curator arena are unchanged. At `?legacy=1`: A/D or Left/Right move; Space/W/Up jumps or climbs; X slashes; Shift guards; R spends the original six-second reserve; E uses anchors/switches/exits; P/Escape pauses; T returns to the saved anchor. Its original [specification](docs/SPEC.md), [historical QA](docs/QA.md), and [reviews](docs/REVIEWS.md) describe that mode.

## Validation and limits

`npm run typecheck`, `npm test`, and `npm run build` are the checks. The test suite has 35 domain tests, including a control-only complete courtyard route, held-Shift wall-kick separation, required gap traversal, fatal-fall rewind, tank charging, combat retrieval/counter/vault, recovery, gates and save validation. These domain checks do not establish browser-input or rendering acceptance.

Current acceptance status, primary research, scope decisions and the exact browser walkthrough are in [courtyard fidelity evidence](docs/COURTYARD_FIDELITY.md). The courtyard traversal, two-sentinel combat/retrieval, rewind, bell completion and save/legacy checks passed [normal-input browser acceptance](docs/LOCAL_ACCEPTANCE_2026-10-15.md). Gamepad, touch/multitouch, mobile readability, precise source-game animation timings, beams/ropes, companion puzzles and advanced time powers are outside this slice.

[Grill with Docs](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md) and [Implement](https://github.com/mattpocock/skills/blob/main/skills/engineering/implement/SKILL.md) informed the work. The user's explicit delegation settled recommended defaults and simulation seams without an optional interview. No commits or pushes were made.

## Play online

[Play the hosted game](https://intrepion.github.io/kata-inspired-by-prince-of-persia-sands-of-time-codex-dot/)

The experimental `?view=three` view uses Three.js 0.180.0 (bundled with its MIT license) and the existing courtyard simulation. The original renderer remains the default pending visual and input playtesting.

The experimental view includes basic attack, rewind, and recoverable-sand cues, but does not yet reproduce the route labels or all original animations. Use the default view for the complete visual feedback.
