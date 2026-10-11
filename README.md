# The Last Meridian

An original compact action-platformer inspired by acrobatic adventure and the finite mistake recovery of *Prince of Persia: The Sands of Time*. Courier **Sera** crosses the stormbound city of **Vey** to restore its meridian bell. Original characters, story, geometric vector art and synthesized audio; no source-game assets or remote asset services.

Four authored chambers: an aqueduct traversal and duel, a wall-kick garden ascent, a reversible vent-and-shutter puzzle, and the Curator's final arena. Finish by ringing the meridian bell.

## Play on this Mac

The session-only preview is **http://127.0.0.1:5193/**. Port 5193 was free; existing servers on earlier ports were preserved. The server binds only to loopback and has no boot/login integration.

```sh
cd /Users/intrepion/Documents/Codex/2026-10-11/task-9/kata-inspired-by-prince-of-persia-sands-of-time-codex-dot
npm ci
npm run build
python3 scripts/start-preview.py 5193
```

The launcher refuses an occupied port and records its own PID in `preview.pid` and output in `preview.log`. If it is already running, open the URL. To restart after it stops, run the launcher command again. To stop it, verify the recorded PID still belongs to this checkout's `scripts/serve.py` before terminating that process; never stop an unrelated server.

For development: `npm run dev -- --port 5194 --strictPort` after checking that port is free.

## Controls

| Action | Keyboard |
|---|---|
| Move | A / D or ← / → |
| Jump, wall kick, ledge climb | Space, W or ↑ |
| Directional slash | X |
| Guard / timed parry | Shift |
| Rewind | Hold R |
| Anchor, switch, exit, bell | E |
| Pause / resume | P or Escape |
| Return to saved anchor | T |

Visible buttons support holding and combining controls. Jump, slash and use activate once per press; release and press again for another action. Face your foe and attack within a blade's reach. Gold windup warns of a strike; a newly raised guard can parry it. Catch a ledge automatically while descending, then jump to climb. Hold toward a wall to slide; press jump to kick away.

Rewind unwinds the full room: position, health, enemies, trap phase and gate countdown. Six seconds of reserve are available, with up to eight seconds of recent history. Rewind plays at twice real time; each restored simulation frame consumes its actual duration. Release to branch. Reserve stays outside history, so rewinding cannot refill it. Death freezes the world with history intact. Cyan anchors refill vitality/reserve, clear history and save. Saves store checkpoints and chamber transitions rather than mid-jump snapshots. Completed saves restore the ending. New adventure requires a confirmation. Storage failures are reported without stopping play.

## Validation

`npm run check` runs strict type checking, 25 domain tests and production build. `npm audit --audit-level=high` checks dependency advisories. GitHub Actions repeats these on pushes and pull requests.

[QA evidence](docs/QA.md), [specification](docs/SPEC.md), [glossary](GLOSSARY.md), [architecture decision](docs/adr/0001-fixed-chambers-and-time.md), and [independent reviews](docs/REVIEWS.md).

[Grill with Docs](https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md) and [Implement](https://github.com/mattpocock/skills/blob/main/skills/engineering/implement/SKILL.md) informed the workflow. Interviews and test-seam choices were adapted to the user's explicit delegation; no interactive interview is claimed.

This is a short side-view adventure rather than a 3D recreation. Physical mobile multitouch, gamepad support, and direct `file://` launch are not validated or promised. Serve the production build over localhost. Audio is generated locally with Web Audio and starts after user interaction; no paid service is used.
