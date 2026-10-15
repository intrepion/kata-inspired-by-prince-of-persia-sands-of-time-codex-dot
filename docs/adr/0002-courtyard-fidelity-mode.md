# 0002 — Isolate the third-person fidelity route from the original adventure

The audit found that the fixed side-view choice in ADR 0001 removed the source game's 3D spatial traversal skill. The user now prioritizes recognizable mechanics and controls over retaining that camera. Replacing the original simulation or migrating checkpoints would risk existing progress and remove a complete original adventure.

Add a separate default courtyard route with XYZ traversal, a perspective following/orbit camera and source-inspired sand-tank combat/reversal. Retain the original entrypoint as `legacy.ts`, reachable through `?legacy=1`, with its own unchanged engine and storage key. The courtyard stores only its own validated fountain/completion record under a new key. ADR 0001 continues to describe the original mode; its fixed-camera and six-second reserve decisions do not apply to the courtyard.

This accepts two small mode entrypoints and separate documentation in exchange for preserving existing saves and allowing a foundational camera/control correction without a migration. Both engines retain deterministic fixed-step world history and irreversible resource/anchor boundaries. Build chunks are selected by the URL; neither engine is exposed as a browser testing backdoor.
