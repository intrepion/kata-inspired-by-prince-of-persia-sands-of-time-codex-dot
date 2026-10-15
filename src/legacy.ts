import './style.css';
import {Engine, chambers, emptyInput, type Input} from './engine';
import {Renderer} from './render';
import {Audio} from './audio';
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const canvas=el<HTMLCanvasElement>('game'),engine=new Engine(),renderer=new Renderer(canvas),audio=new Audio();
let started=false,accumulator=0,last=performance.now(),hudAt=0,saveRevision=-1,saveAvailable=true;
const holds=new Map<keyof Input,Set<string>>(),edges=new Set<keyof Input>();
const edgeKeys=new Set<keyof Input>(['jump','attack','interact']);
const keymap:Record<string,keyof Input>={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyX:'attack',ShiftLeft:'guard',ShiftRight:'guard',KeyR:'rewind',KeyE:'interact'};
function begin(action:keyof Input,source:string){let set=holds.get(action);if(!set){set=new Set();holds.set(action,set);}if(!set.has(source)){if(set.size===0)edges.add(action);set.add(source);}}
function end(action:keyof Input,source:string){holds.get(action)?.delete(source);}
function clearInput(){holds.clear();edges.clear();document.querySelectorAll('.held').forEach(e=>e.classList.remove('held'));accumulator=0;}
function input():Input{const i={...emptyInput};for(const action of Object.keys(i) as (keyof Input)[])i[action]=edgeKeys.has(action)?edges.has(action):(holds.get(action)?.size??0)>0;edges.clear();return i;}
function persist(){if(engine.saveRevision===saveRevision)return;saveRevision=engine.saveRevision;try{localStorage.setItem('last-meridian-save-v1',engine.readSave());saveAvailable=true;}catch{saveAvailable=false;}el('save-status').textContent=saveAvailable?'Saved at your last anchor or chamber transition. Reload returns there.':'Storage unavailable. Your journey continues, but cannot survive a reload.';}
let restored=false;try{restored=engine.restore(localStorage.getItem('last-meridian-save-v1'));}catch{saveAvailable=false;}
if(restored){el('start').textContent=engine.world.won?'See the dawn →':'Continue the journey →';el('new').hidden=false;el('intro-copy').textContent=engine.world.won?'You restored the meridian. The city remembers the dawn.':`Your journey is saved in ${chambers[engine.world.room].name}. Continue from your anchor.`;}
async function soundToggle(){try{await audio.toggle();}catch{audio.enabled=false;}el('mute').textContent=audio.enabled?'Sound on':'Sound off';el('mute').setAttribute('aria-pressed',String(audio.enabled));}
function start(){started=true;el('overlay').hidden=true;clearInput();canvas.focus();if(!audio.enabled)void soundToggle();update();}
function pause(value:boolean){if(!started)return;engine.paused=value;engine.rewinding=false;clearInput();el('pause-overlay').hidden=!value;el('pause').textContent=value?'Resume':'Pause';if(value){el('modal-title').textContent='Paused';el('modal-copy').textContent='Take a breath. Your minute is safe.';}else {el('confirm-reset').hidden=true;canvas.focus();}update();}
function recover(){engine.restart();clearInput();el('confirm-reset').hidden=true;el('pause-overlay').hidden=true;el('pause').textContent='Pause';canvas.focus();update();}
function fresh(){engine.newAdventure();clearInput();started=true;el('overlay').hidden=true;el('pause-overlay').hidden=true;el('confirm-reset').hidden=true;el('pause').textContent='Pause';persist();canvas.focus();update();}
el('start').onclick=start;el('new').onclick=()=>{start();pause(true);el('confirm-reset').hidden=false;};el('mute').onclick=()=>void soundToggle();el('pause').onclick=()=>pause(!engine.paused);el('resume').onclick=()=>pause(false);el('checkpoint').onclick=recover;el('recover').onclick=recover;el('reset').onclick=()=>{el('confirm-reset').hidden=false;};el('confirm-new').onclick=fresh;el('cancel-new').onclick=()=>{el('confirm-reset').hidden=true;};
window.addEventListener('keydown',ev=>{if(!started)return;if((ev.target as HTMLElement).tagName==='BUTTON'&&(ev.code==='Space'||ev.code==='Enter'))return;const action=keymap[ev.code];if(action){ev.preventDefault();if(!ev.repeat&&!engine.paused&&!engine.world.won)begin(action,ev.code);}else if(!ev.repeat&&(ev.code==='Escape'||ev.code==='KeyP')){ev.preventDefault();pause(!engine.paused);}else if(!ev.repeat&&ev.code==='KeyT'){recover();}});
window.addEventListener('keyup',ev=>{const action=keymap[ev.code];if(action){ev.preventDefault();end(action,ev.code);}});
for(const b of document.querySelectorAll<HTMLButtonElement>('[data-hold]')){const action=b.dataset.hold as keyof Input;
 b.addEventListener('pointerdown',ev=>{ev.preventDefault();if(!started||engine.paused||engine.world.won)return;b.setPointerCapture(ev.pointerId);begin(action,`pointer-${ev.pointerId}`);b.classList.add('held');});
 const release=(ev:PointerEvent)=>{end(action,`pointer-${ev.pointerId}`);b.classList.remove('held');};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
 b.addEventListener('keydown',ev=>{if(ev.code==='Space'||ev.code==='Enter'){ev.preventDefault();if(!ev.repeat&&started&&!engine.paused)begin(action,`button-${ev.code}`);}});b.addEventListener('keyup',ev=>{if(ev.code==='Space'||ev.code==='Enter'){ev.preventDefault();end(action,`button-${ev.code}`);}});
}
window.addEventListener('blur',()=>pause(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});
function update(){const w=engine.world,p=w.player,c=chambers[w.room];el('chapter').textContent=c.name;el('subtitle').textContent=c.subtitle;el('health').textContent=Array.from({length:5},(_,i)=>i<p.hp?'◆':'◇').join(' ');el('seconds').textContent=`${engine.reserve.toFixed(1)}s`;el('charge').style.width=`${engine.reserve/6*100}%`;el('hint').textContent=c.hint;el('story').textContent=w.message;el('death').hidden=!w.dead||engine.paused;el('rewind-label').textContent=engine.rewinding?'◂ UNWINDING':engine.reserve<.02?'RESERVE EMPTY':'';el('objective').textContent=w.won?'The dawn returns':`SENTINELS ${w.enemies.filter(e=>e.hp>0).length} · ${c.switch?(w.gate>0?'GATE OPEN':'GATE SEALED'):'E AT THE EXIT'}`;
 el('journal').textContent=`Courier ${Math.round(p.x)}, ${Math.round(p.y)} · ${p.ledge?'ledge catch':p.ground?'grounded':p.wall?'wall slide':'airborne'} · facing ${p.face>0?'right':'left'} · foes ${w.enemies.map(e=>e.hp).join('/')} · time ${w.tick} · thread ${(engine.history.length/60).toFixed(1)}s · reserve ${engine.reserve.toFixed(1)}s`;
 if(w.won&&started){el('pause-overlay').hidden=false;el('modal-title').textContent='Vey remembers the dawn.';el('modal-copy').textContent='Sera rings the meridian. The storm loosens its grip; windows fill with morning. The borrowed minute belongs to everyone again. Your journey is complete.';el('resume').hidden=true;el('checkpoint').hidden=true;el('reset').textContent='Begin another journey';}else{el('resume').hidden=false;el('checkpoint').hidden=false;el('reset').textContent='New adventure';}persist();}
function frame(now:number){const dt=Math.min(100,now-last);last=now;
 if(started&&!engine.paused&&!document.hidden){accumulator+=dt;let steps=0;while(accumulator>=1000/60&&steps++<6){const room=engine.world.room,before=engine.world.player.hp,revision=engine.saveRevision,won=engine.world.won;const i=input();engine.step(i);if(engine.world.room!==room)clearInput();if(i.jump)audio.cue('jump');if(i.attack)audio.cue('attack');if(engine.world.player.hp<before)audio.cue('hurt');if(engine.saveRevision!==revision)audio.cue(engine.world.won?'win':'anchor');if(!won&&engine.world.won)clearInput();audio.update(engine.world.tick,engine.world.room,engine.rewinding);accumulator=Math.max(0,accumulator-1000/60);} }
 else accumulator=0;
 renderer.draw(engine);if(now-hudAt>80){update();hudAt=now;}requestAnimationFrame(frame);
}
update();requestAnimationFrame(frame);
