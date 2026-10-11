# Verification evidence — 2026-10-11

## Automated checks

Strict TypeScript, 24 passing Vitest domain cases, production Vite build, and dependency audit (zero advisories after updating Vitest to 5.0.3). CI runs the same checks on Node 24. Domain tests use explicit scenario fixtures at the public Engine boundary; they are not browser gameplay.

Tests cover finite rewind, new branches, complete enemy/trap/gate restoration, fatal-fall recovery, paused time, platform landing, stable wall contact, ledge climb, blade facing/range/cooldown, parry, sealed-gate traversal, switch timer reversal/expiry, anchor refill/history boundary/reload, gated chamber transitions, simultaneous lethal damage/exit, completed-save reset, and malformed save rejection.

## Actual Mac Chrome campaign

Played via normal visible controls and keyboard, with no state injection, debug teleport, save editing or cheat hooks:

- Aqueduct: deliberately missed the gap, died, held R, recovered five vitality with reserve decreasing 6.0 → 4.7. Exhausted remaining reserve to 0.0. Returned to anchor, crossed the gap, bound the cyan anchor, reloaded and resumed at x525. Jumped the terrace and second gap, faced the sentinel, defeated it with guarded slashes, entered Gardens.
- Gardens: used approach step and a lip catch, entered the shaft, performed distinct wall kicks, landed atop the low wall, jumped to the upper walkway, defeated both sentinels and entered Brass Lung. Wall release issue found during this route was corrected and the route replayed with the corrected build.
- Brass Lung: crossed the first vent, climbed switch terraces, used E to open the shutter and crossed it. Rewind returned from x764 to x541 with its timer/trap phase restored. Defeated sentinel, took vent damage (five → three vitality), then rewound: vitality returned to five and sentinel returned to three hits, reserve decreased to 3.0. Chose a new crossing, defeated it again, jumped the final vent and entered finale.
- Meridian Heart: crossed the center vent, timed guard during Curator windup; visible message confirmed **Parry!** without health loss. Six guarded cuts defeated it. Reached bell and used E; ending displayed **Vey remembers the dawn.** Reload showed **See the dawn** and returned to the completed ending. New adventure confirmation reset to the aqueduct.

## Repeated and interrupted flows

Pause/resume repeatedly used throughout campaign and froze world state. Held on-screen jump and a 1.5-second native keyboard event did not retrigger jumps from OS repeat. Reset confirmation → resume → pause cleared the old confirmation. Checkpoint recovery and reload worked, and all chamber transitions were exercised. Viewport 390×844 had document width390 with no horizontal overflow; visible movement/jump buttons were exercised and viewport restored. Browser logs contained no application-origin errors; unrelated extension warnings were excluded.

## Screenshots

- [Brass Lung](screenshots/brass-lung.jpg)
- [Completed ending](screenshots/ending.jpg)
- [390-pixel layout](screenshots/mobile.jpg)

## Boundaries

Mac Chrome keyboard events and mouse-driven visible controls were tested. Physical user-held keys, real mobile multitouch and audio listening quality were not independently assessed. Responsive viewport testing is not a physical-device test. Storage corruption behavior is domain-tested; storage denial is handled in code but not forced in Chrome. No public deployment, boot/login autostart or Codex sidebar registration was performed.

The play server uses a session-only detached Python process; HTTP 200 and browser loading were checked after detaching. Final commit/CI evidence is supplied with delivery rather than embedding its own commit hash into this file.
