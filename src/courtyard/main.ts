import './style.css';
import { Courtyard, SAVE_KEY, STEP, idle, type Controls } from './engine';
import { CourtyardRenderer, type Camera } from './render';
import { Audio } from '../audio';

document.getElementById('app')!.innerHTML = `
<header class="court-header"><a class="court-mark" href="?">◈ <span>THE LAST<br><b>MERIDIAN</b></span></a><div><span class="court-eyebrow">THE BROKEN AQUEDUCT</span><p>A third-person acrobatic route through Vey</p></div><nav><button id="court-sound">Sound off</button><button id="court-pause">Pause</button><a href="?legacy=1">Original adventure ↗</a></nav></header>
<section class="court-shell" aria-label="Third-person courtyard adventure">
<div class="court-hud"><div><small>VITALITY</small><strong id="court-health"></strong></div><div><small>SAND TANKS <span id="court-tanks"></span></small><strong id="court-thread"></strong></div><div class="court-goal"><small>ROUTE TO THE BELL</small><strong id="court-goal"></strong></div></div>
<canvas id="courtyard" width="1120" height="630" tabindex="0" aria-label="3D third-person adventure. WASD moves relative to the camera; arrows orbit; Space jumps; Shift performs acrobatics or blocks; X attacks; E retrieves sand or uses a fountain; R rewinds."></canvas>
<div id="court-overlay" class="court-overlay"><div class="court-card"><p class="court-eyebrow">A BORROWED MINUTE · A DIFFERENT PATH</p><h1>The broken<br><em>aqueduct.</em></h1><p id="court-intro">Run along the wall above the void. Catch the gallery ledge, swing to the bell court, and retrieve the sentinels’ sand to open the last gate.</p><button id="court-start" class="court-primary">Enter the courtyard →</button><p class="court-note">One bounded 3D route · Original adventure save kept separately</p></div></div>
<div id="court-modal" class="court-overlay" hidden><div class="court-card"><p class="court-eyebrow">THE WORLD CAN WAIT</p><h2 id="court-modal-title">Paused</h2><p id="court-modal-copy">Your thread is safe.</p><button id="court-resume" class="court-primary">Continue</button><button id="court-restart">Return to fountain</button><button id="court-new">Restart courtyard route</button><div id="court-confirm" hidden><p>Replace this courtyard checkpoint with a fresh route?</p><button id="court-confirm-new">Restart route</button><button id="court-cancel-new">Keep checkpoint</button></div></div></div>
<div id="court-death" class="court-death" hidden><b>The minute breaks.</b><span id="court-death-copy">Hold R to undo the mistake.</span><button id="court-recover">Return to fountain</button></div>
<div class="court-caption"><span id="court-message"></span><b id="court-rewind"></b></div></section>
<section class="court-below"><div class="court-controls" aria-label="Courtyard controls"><div class="court-directions"><button data-action="forward">W ↑</button><button data-action="left">A ←</button><button data-action="back">S ↓</button><button data-action="right">D →</button></div><button data-action="jump">Jump <kbd>Space</kbd></button><button data-action="special">Wall run / Block <kbd>Shift</kbd></button><button data-action="attack">Sword <kbd>X</kbd></button><button data-action="dagger">Retrieve / Use <kbd>E</kbd></button><button data-action="rewind">Rewind <kbd>R</kbd></button><button id="court-view">Overview <kbd>Q</kbd></button></div>
<div class="court-guide"><p><b>Camera-relative movement.</b> WASD moves in the direction you see. Left / Right arrows orbit; Up / Down arrows change height. Middle-drag also orbits. F returns the camera behind the route; Q toggles a wider overview.</p><details open><summary>Route & combat field notes</summary><div class="court-notes"><p><b>01 · Across the wall</b>Move to the gold marks on the right wall before the first gap. Hold W + Shift to run along it. Release Shift over the far landing. Space kicks away from a wall.</p><p><b>02 · Up to the gallery</b>At the far landing, approach the high front wall. Hold forward + Shift to run up, catch and climb its lip; or jump to catch it, then press Space to climb. E at a blue fountain refills and saves.</p><p><b>03 · Across the pole</b>From the gallery’s far edge, jump forward toward the gold pole. Catch it automatically; Space releases. A forward swing gives a better launch. Stay to one side of the sweeping blade beyond.</p><p><b>04 · Retrieve the sand</b>X or left click strikes. Shift or right click blocks; X just after a block counters. Move toward a nearby sentinel + Space to vault; X in the air knocks it down. E finishes a downed sentinel and refills one tank. Unfinished sentinels rise again.</p><p><b>Undo a mistake</b>Hold R to rewind up to ten seconds of movement, enemies and traps, even after death. Each press spends one sand tank; releasing chooses a new future. Tanks stay spent outside time. Fountains make a new thread.</p><p><b>Pause & checkpoints</b>P / Escape pauses. Losing focus pauses and releases all controls. T returns to the last fountain. Saves resume at the fountain with a fresh fight. This is a short route, with no full campaign or advanced time powers.</p></div></details><output id="court-status" aria-label="Courtyard journey status"></output><p id="court-save"></p></div></section><footer class="court-footer">VEY · THE NIGHT OF THE STILL STORM <span>Original geometry & synthesized sound · Local play</span></footer>`;

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const game = new Courtyard(), canvas = el<HTMLCanvasElement>('courtyard'), renderer = new CourtyardRenderer(canvas), audio = new Audio();
const camera: Camera = { yaw: 0, height: 4.5, overview: false };
type Action = 'forward' | 'back' | 'left' | 'right' | 'jump' | 'special' | 'attack' | 'dagger' | 'rewind' | 'cameraLeft' | 'cameraRight' | 'cameraUp' | 'cameraDown';
const held = new Map<Action, Set<string>>(), edges = new Set<Action>();
let dragging = false, previousX = 0;
let started = false, accumulator = 0, last = performance.now(), revision = game.saveRevision, storageOkay = true, hudTime = 0;
const keymap: Record<string, Action> = { KeyW: 'forward', KeyS: 'back', KeyA: 'left', KeyD: 'right', Space: 'jump', ShiftLeft: 'special', ShiftRight: 'special', KeyX: 'attack', KeyE: 'dagger', KeyR: 'rewind', ArrowLeft: 'cameraLeft', ArrowRight: 'cameraRight', ArrowUp: 'cameraUp', ArrowDown: 'cameraDown' };
function begin(action: Action, source: string): void {
  if (!started || game.paused || game.world.won) return;
  if (!held.has(action)) held.set(action, new Set());
  const sources = held.get(action)!;
  if (!sources.size) edges.add(action);
  sources.add(source);
}
function end(action: Action, source: string): void { held.get(action)?.delete(source); }
function clear(): void { dragging = false; held.clear(); edges.clear(); accumulator = 0; game.releaseRewind(); document.querySelectorAll('.court-held').forEach(button => button.classList.remove('court-held')); }
const down = (action: Action) => (held.get(action)?.size ?? 0) > 0;
function controls(): Controls {
  camera.yaw += (Number(down('cameraRight')) - Number(down('cameraLeft'))) * STEP * 1.4;
  camera.height = Math.max(2.5, Math.min(8, camera.height + (Number(down('cameraUp')) - Number(down('cameraDown'))) * STEP * 3));
  const value: Controls = { ...idle, forward: Number(down('forward')) - Number(down('back')), right: Number(down('right')) - Number(down('left')), yaw: camera.yaw, jump: edges.has('jump'), attack: edges.has('attack'), dagger: edges.has('dagger'), special: down('special'), rewind: down('rewind') };
  edges.clear(); return value;
}
function save(): void {
  if (revision === game.saveRevision) return;
  revision = game.saveRevision;
  try { localStorage.setItem(SAVE_KEY, game.readSave()); } catch { storageOkay = false; }
}
try { if (game.restore(localStorage.getItem(SAVE_KEY))) { el('court-start').textContent = game.world.won ? 'See the dawn →' : 'Continue from fountain →'; el('court-intro').textContent = game.world.won ? 'The bell remembers this route’s dawn. You can restart the courtyard from the pause menu.' : 'Your fountain checkpoint is ready. The original side-view adventure and its save remain available from the header.'; } } catch { storageOkay = false; }
function pause(value: boolean): void {
  if (!started || game.world.won) return;
  game.paused = value; clear(); el('court-modal').hidden = !value; el('court-pause').textContent = value ? 'Resume' : 'Pause'; el('court-confirm').hidden = true;
  if (!value) canvas.focus(); update();
}
function recover(): void { game.restart(); clear(); el('court-modal').hidden = true; el('court-pause').textContent = 'Pause'; camera.yaw = 0; canvas.focus(); update(); }
el('court-start').onclick = () => { started = true; el('court-overlay').hidden = true; clear(); canvas.focus(); update(); };
el('court-pause').onclick = () => pause(!game.paused);
el('court-resume').onclick = () => pause(false);
el('court-restart').onclick = recover; el('court-recover').onclick = recover;
el('court-new').onclick = () => { el('court-confirm').hidden = false; };
el('court-cancel-new').onclick = () => { el('court-confirm').hidden = true; };
el('court-confirm-new').onclick = () => { game.newRoute(); recover(); save(); };
el('court-view').onclick = () => { camera.overview = !camera.overview; el('court-view').setAttribute('aria-pressed', String(camera.overview)); };
el('court-sound').onclick = () => { void audio.toggle().then(enabled => { el('court-sound').textContent = enabled ? 'Sound on' : 'Sound off'; el('court-sound').setAttribute('aria-pressed', String(enabled)); }).catch(() => { audio.enabled = false; }); };
window.addEventListener('keydown', event => {
  if (!started) return;
  if ((event.target as HTMLElement).tagName === 'BUTTON' && (event.code === 'Space' || event.code === 'Enter')) return;
  const action = keymap[event.code];
  if (action) { event.preventDefault(); if (!event.repeat) begin(action, event.code); }
  else if (!event.repeat) {
    if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); pause(!game.paused); }
    else if (event.code === 'KeyT') recover();
    else if (event.code === 'KeyQ') el('court-view').click();
    else if (event.code === 'KeyF') { camera.yaw = 0; camera.height = 4.5; }
  }
});
window.addEventListener('keyup', event => { const action = keymap[event.code]; if (action) { event.preventDefault(); end(action, event.code); } });
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-action]')) {
  const action = button.dataset.action as Action;
  button.onpointerdown = event => { event.preventDefault(); button.setPointerCapture(event.pointerId); begin(action, `touch-${event.pointerId}`); if (started && !game.paused) button.classList.add('court-held'); };
  const release = (event: PointerEvent) => { end(action, `touch-${event.pointerId}`); button.classList.remove('court-held'); };
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
  button.onkeydown = event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); if (!event.repeat) begin(action, `button-${event.code}`); } };
  button.onkeyup = event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); end(action, `button-${event.code}`); } };
}
canvas.oncontextmenu = event => event.preventDefault();
canvas.onpointerdown = event => { canvas.focus(); canvas.setPointerCapture(event.pointerId); if (event.button === 1) { dragging = true; previousX = event.clientX; event.preventDefault(); } else begin(event.button === 2 ? 'special' : 'attack', `mouse-${event.button}`); };
canvas.onpointermove = event => { if (dragging && !game.paused) { camera.yaw += (event.clientX - previousX) * 0.008; previousX = event.clientX; } };
const releaseMouse = (event: PointerEvent) => { dragging = false; end(event.button === 2 ? 'special' : 'attack', `mouse-${event.button}`); };
canvas.addEventListener('pointerup', releaseMouse); canvas.addEventListener('pointercancel', () => { dragging = false; clear(); }); canvas.addEventListener('lostpointercapture', () => { dragging = false; end('special', 'mouse-2'); end('attack', 'mouse-0'); });
window.addEventListener('blur', () => pause(true)); document.addEventListener('visibilitychange', () => { if (document.hidden) pause(true); });

function update(): void {
  const w = game.world, p = w.player;
  el('court-health').textContent = '◆'.repeat(Math.max(0, p.hp)) + '◇'.repeat(5 - Math.max(0, p.hp));
  el('court-tanks').textContent = '◈'.repeat(game.tanks) + '◇'.repeat(3 - game.tanks);
  el('court-thread').textContent = `${game.threadSeconds.toFixed(1)} / 10.0s in thread`;
  el('court-goal').textContent = w.won ? 'DAWN RETURNED' : !w.wallrunDone ? '01 · Cross the wall' : !w.ledgeDone ? '02 · Climb the gallery' : !w.poleDone ? '03 · Swing across' : game.finished < 2 ? `04 · Retrieve sand ${game.finished}/2` : '05 · Ring the bell';
  el('court-message').textContent = w.message;
  el('court-rewind').textContent = game.rewinding ? '◂ REWINDING' : game.tanks === 0 ? 'NO SAND · FIND A FOUNTAIN' : '';
  el('court-death').hidden = !w.dead || game.paused;
  el('court-death-copy').textContent = game.tanks > 0 && game.threadSeconds > 0 ? 'Hold R to undo the mistake.' : 'No rewind tank remains. Return to your saved fountain.';
  el('court-status').textContent = `Courier ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)} · ${p.motion} · sentinels ${w.enemies.map(e => e.phase).join(' / ')} · saved fountain: ${game.anchor}`;
  el('court-save').textContent = storageOkay ? 'Courtyard checkpoints use a separate browser save. The original adventure’s progress is preserved.' : 'Browser storage unavailable. Play can continue, but this route will not survive a reload.';
  if (started && w.won) {
    el('court-modal').hidden = false; el('court-modal-title').textContent = 'The dawn finds Vey.';
    el('court-modal-copy').textContent = 'Across the aqueduct, above the gallery, through the sentinels: Sera has carried the borrowed minute home. This courtyard route is complete.';
    el('court-resume').hidden = true; el('court-restart').hidden = true;
  } else { el('court-modal-title').textContent = 'Paused'; el('court-modal-copy').textContent = 'Your thread is safe.'; el('court-resume').hidden = false; el('court-restart').hidden = false; }
  save();
}
function frame(now: number): void {
  accumulator += Math.min(0.1, (now - last) / 1000); last = now;
  if (started && !game.paused && !document.hidden && !game.world.won) {
    let count = 0;
    while (accumulator >= STEP && count++ < 6) {
      const input = controls(), hp = game.world.player.hp, saveBefore = game.saveRevision;
      game.step(input);
      if (input.jump) audio.cue('jump'); if (input.attack) audio.cue('attack');
      if (game.world.player.hp < hp) audio.cue('hurt'); if (game.saveRevision !== saveBefore) audio.cue(game.world.won ? 'win' : 'anchor');
      audio.update(game.world.tick, game.world.player.z > 30 ? 1 : 0, game.rewinding);
      accumulator -= STEP;
    }
  } else accumulator = 0;
  renderer.draw(game, camera, now / 1000);
  if (now - hudTime > 80) { update(); hudTime = now; }
  requestAnimationFrame(frame);
}
update(); requestAnimationFrame(frame);
