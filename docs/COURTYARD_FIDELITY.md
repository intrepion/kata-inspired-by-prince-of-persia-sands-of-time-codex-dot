# Broken Aqueduct — mechanics fidelity slice

> Final local native acceptance completed on 2026-10-15. See [final acceptance](LOCAL_ACCEPTANCE_2026-10-15.md) for current browser evidence; pending entries below describe the earlier source handoff.


## Baseline and research

Baseline HEAD: `1e0a0459e53c90232a8c2b176f0be7d58755e047`; checkout clean before this task. The October 14 audit identified incompatible camera and spatial skill in the original fixed side-view rooms. The fidelity target is recognizable gameplay from the 2003 console/PC game, with original characters and geometry permitted.

Read before planning: [Ubisoft's original PC manual, hosted by Steam](https://store.steampowered.com/manual/13600), printed pp. 4, 10–14, 18–22. It establishes WASD movement, independent camera look and alternate view, jump and contextual special action, hold-R reversal including death, ten seconds of history, one sand tank consumed per activation, and sword knockdown followed by dagger retrieval to destroy enemies and refill a tank. It also specifies directional multi-enemy targeting, vault strikes, blocking and counters. [Ubisoft's product description](https://store.steampowered.com/app/13600/Prince_of_Persia_The_Sands_of_Time/) places acrobatics, combat and real-time reversal together. This slice selects those defining contracts; distances, tolerances and timings are authored values rather than measured reproductions.

The [publisher retrospective](https://news.ubisoft.com/en-us/article/3oAqiLg5k7GazIw5OWYTO2/prince-of-persia-creating-the-sands-of-time-trilogy) was also requested, but its current page returned a JavaScript-only shell to the research tool, so new implementation claims do not depend on its unread body.

## Settled decisions

The user authorized source work and recommended defaults without waiting for optional interviews. Applying Grill with Docs/domain modeling and Implement:

| Decision branch | Chosen default and reason |
|---|---|
| Mode and save compatibility | New default courtyard mode, original adventure at `?legacy=1`; separate storage key keeps original progress intact. |
| Scope | One connected XYZ route and one two-sentinel encounter, ending at a bell; no campaign claim. |
| Spatial/control foundation | Third-person perspective projection, orbit/height/overview camera, camera-relative WASD and contextual jump/special. |
| Hallmark route | A gap too long to jump normally, wall running, a high catch/climb, and a pole swing/release. |
| Combat/resource loop | Temporary sword knockdown, vault/counter alternatives, E retrieval, tank refill, gate unlocked by both retrievals. |
| Time model | Fixed 60 Hz snapshots of the entire mutable world; up to ten seconds, two frames restored per step; tanks consumed once per hold outside history. |
| Test seam | The public `Courtyard.step(Controls)` boundary and checkpoint serialization; complete route uses controls and observations without world edits. Small scenario tests arrange combat edge cases through the public world. |
| Review boundary | Baseline HEAD versus uncommitted local source/docs. Parent coordinates independent review and browser/build access. No commits/pushes under this task. |

Terms are maintained in `CONTEXT.md` / `GLOSSARY.md`; the mode boundary is recorded in [ADR 0002](adr/0002-courtyard-fidelity-mode.md).

## Implementation and source acceptance

- Legacy preservation verified: `HEAD:src/main.ts` and `src/legacy.ts` both hash to SHA256 `a3dabb60841acc3894b6693699718415ed0116ec6b69678fa2ef81c4cb0da1e0`; `git diff --check` is clean.
- World coordinates are XYZ, including walkable platforms at distinct heights, real voids, wall constraints, timed wall-run capacity, jumping, ledge catch/climb/drop, and automatic pole catch with swing-dependent release momentum.
- The renderer projects solid world faces through a controllable perspective camera, clips the near plane and sorts faces by depth. It introduces no dependency or remote asset request. Its painter-style sorting is a deliberate compact renderer; complex interpenetrating mesh scenes are not supported.
- Two sentinels independently approach, telegraph strikes, recover, fall and reform unless finished. Sword targeting can turn to a selected nearby enemy. Ground special blocks from all directions; a short counter window knocks down in one hit; vault + aerial sword is another knockdown route.
- A moving blade's phase is derived from rewindable simulation time. Fountains separate history and persistence; checkpoints store only a validated anchor and completed flag. Legacy engine/render/audio modules are not replaced; the old entrypoint is retained as `src/legacy.ts`.

Source checks on 2026-10-15, installed local candidate:

| Check | Result |
|---|---|
| `npm run typecheck` | Passed, strict TypeScript |
| `npm test` | Passed in the actual checkout: 35 tests in two files (25 existing, 10 courtyard) |
| Control-only domain route | Wall run → high ledge → pole → both counters/retrievals → bell; finished alive with five vitality |
| Failure recovery | Normal jump cannot clear the first gap; fatal fall rewinds to safety; a continuous rewind spends one tank and a second activation spends another |
| Combat/save edge cases | Retrieval required, downed recovery, block/counter, vault strike, gate seal and validated separate checkpoint shapes passed |
| Production build | Passed in exclusive build slot: `npm run check`; final Vite production rebuild completed in 140 ms |
| Independent code review | Pending parent coordination |
| Browser input/render acceptance | Pending exclusive browser access; no native browser control attempted |

Independent specification review identified immediate wall reattachment after a kick when Shift remained held. A 0.35-second rewindable wall-catch cooldown now lets the kick separate before a new run; the exact held-input reproduction and twelve following frames are covered by a passing regression. The final full check/build also includes the camera-drag lifecycle clearing fix. Final independent review disposition remains coordinated by the parent.

## Browser acceptance walkthrough (pending)

Use `http://127.0.0.1:5193/` after the new production build is served. Do not reset the original adventure save.

1. Begin the courtyard. Verify a controllable third-person world, readable avatar and independent orbit/overview. Hold D about 0.6 s to reach x≈3, W about 1 s to z≈5, then hold W+Shift through the wall run and high ledge climb. Stop at x≈3.15, y≈3.2, z≈20.6. Space during the run should kick away; R must undo a fall and spend one tank per hold.
2. Move A about 0.63 s to x≈0. Use E near the gallery fountain to save. Move W about 0.53 s from z≈20.6 to z≈23.3. Press Space while continuing W, catch the pole automatically, wait for a forward swing, release Space and press it again to launch. Land beyond z=30. A wider camera can be used to inspect the spatial gap.
3. Verify the sweeping blade is spatially avoidable and that rewind reverses its position. Save at the court fountain if desired; it resets enemies on reload. Let the two sentinels approach. Hold Shift through their gold windup, then X promptly after a block; E immediately after knockdown. Repeat on the second sentinel. Also verify Space toward an enemy then X in the air is a viable alternative.
4. Verify the gate remains closed before both sand retrievals and opens afterward. Move to the bell at (0,3.2,41), press E and observe the ending. Reload must restore completion. Confirm pause/resume, focus loss and edge-trigger controls do not leave stuck movement, attacks or rewind.
5. Open `?legacy=1` and confirm the original adventure/save remains available. Check browser console/load errors and narrow viewport readability. These steps are currently unverified and must remain marked pending until observed through normal browser input.

## Remaining limitations

One brief route and one encounter only. No companion/cooperative puzzles, beams, ropes, pillars, advanced dagger powers, upgrade system, complete enemy roster or campaign. Geometric characters, simple animation and compact depth sorting do not match the original presentation. Camera tuning and normal-input browser playability still require coordinated visual acceptance. Keyboard/mouse is the intended tested control model; visible controls exist but physical touch/gamepad are unverified.
