# The Last Meridian — delegated design specification
The user delegated recommended decisions; no interactive interview occurred. Grill with Docs was adapted into a settled decision tree, followed by Implement/TDD at the public simulation and save boundaries.

## Decision tree
1. Viewpoint: fixed side-view chambers, original Canvas vector art, TypeScript/Vite. Chosen over a 3D imitation to prioritize readable acrobatics and complete encounters.
2. Scope: four sequential chambers, a complete opening and ending, original courier Sera and clockwork city of Vey. No source-game names, imagery, dialogue or audio are reused.
3. Traversal: accelerated running, coyote jump, buffered jump, wall slide/jump, automatic ledge catch and climb with jump. Each chamber teaches or combines these.
4. Combat: directional sword range, cooldown, visible sentinel windup, guarding and timed parry. Exits require defeated sentinels.
5. Rewind: six-second reserve, up to eight seconds of history; all mutable world state (player, enemies, trap phase, gate countdown) rewinds. Reserve is outside history, cannot be duplicated; release branches by discarding the unwound future. Death preserves history for rewind. Anchors refill and reset history.
6. Puzzle: interact with the gate switch, then cross its trap corridor before the gate closes. Trap phases are visible and reversible.
7. Lifecycle: pause/blur clear held input; restart checkpoint, new adventure confirmation, gated transitions, safe versioned checkpoint saving, completed save/ending reload. No frame advance in pause or hidden tab; bounded fixed-step catch-up.
8. Audio: original synthesized ambient notes and action cues, opt-in via start/mute, no remote assets.

## Acceptance seams and standards
Delegated testing decisions: public Engine.step/read state and Engine save/restore are the domain seams; real DOM controls are the browser seam. Target rewind branching/resources/enemies/death, acrobatics/collision, combat/gates/checkpoint/transition and hostile save inputs. Strict TypeScript; pure engine independent of DOM; rendering/input/audio separate. No production cheats or state-setting test hooks. Automated simulation is distinct from visible Chrome gameplay.
