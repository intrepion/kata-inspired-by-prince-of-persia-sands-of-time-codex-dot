import { describe, it, expect } from 'vitest';
import { Engine, emptyInput } from '../src/engine';
describe('Thread and reserve', () => {
  it('unwinds movement, spends finite reserve, and branches into a new future', () => {
    const e = new Engine();
    for(let i=0;i<50;i++) e.step({...emptyInput,right:true});
    const future = e.world.player.x;
    for(let i=0;i<20;i++) e.step({...emptyInput,rewind:true});
    expect(e.world.player.x).toBeLessThan(future - 50);
    expect(e.reserve).toBeCloseTo(6 - 40/60,3);
    const branch = e.world.player.x;
    for(let i=0;i<15;i++) e.step({...emptyInput,left:true});
    expect(e.world.player.x).toBeLessThan(branch);
  });
});

const room=(n:number)=>{const e=new Engine();e.restore(JSON.stringify({version:1,room:n,anchor:false,won:false}));return e;};
const step=(e:Engine,n:number,i=emptyInput)=>{for(let j=0;j<n;j++)e.step(i);};
describe('Reversible world',()=>{
 it('restores enemy vitality, trap clock and gate timer together',()=>{
  const e=room(2);Object.assign(e.world.player,{x:840,y:438,face:1});e.world.gate=200;
  const before=structuredClone(e.world);e.step({...emptyInput,attack:true});expect(e.world.enemies[0].hp).toBe(2);
  e.step({...emptyInput,rewind:true});expect(e.world).toEqual(before);expect(e.reserve).toBeCloseTo(6-1/60);
 });
 it('recovers a fatal fall and refuses to replenish reserve by oscillating',()=>{
  const e=new Engine();Object.assign(e.world.player,{x:390,y:490,ground:false,vy:10});e.step(emptyInput);expect(e.world.dead).toBe(true);
  e.step({...emptyInput,rewind:true});expect(e.world.dead).toBe(false);expect(e.world.player.hp).toBe(5);const charge=e.reserve;
  e.step(emptyInput);e.step({...emptyInput,rewind:true});expect(e.reserve).toBeLessThan(charge);
 });
 it('stops at finite reserve and never replays the abandoned future',()=>{
  const e=new Engine();step(e,400);step(e,200,{...emptyInput,rewind:true});expect(e.reserve).toBeGreaterThanOrEqual(0);expect(e.reserve).toBeLessThan(1/60);
  const tick=e.world.tick;step(e,10,{...emptyInput,rewind:true});expect(e.world.tick).toBe(tick);step(e,1);expect(e.world.tick).toBe(tick+1);
 });
 it('pause freezes the world, reserve and thread',()=>{
  const e=new Engine();step(e,20);e.paused=true;const before=structuredClone(e.world);step(e,40,{...emptyInput,rewind:true,right:true});expect(e.world).toEqual(before);expect(e.history.length).toBe(20);expect(e.reserve).toBe(6);
 });
});
describe('Acrobatics and combat',()=>{
 it('lands on raised stone rather than tunneling through it',()=>{
  const e=new Engine();Object.assign(e.world.player,{x:650,y:300,ground:false,vy:12});step(e,3);expect(e.world.player.y).toBe(313);expect(e.world.player.ground).toBe(true);
 });
 it('keeps wall contact when movement is released, then kicks away',()=>{
  const e=room(1);Object.assign(e.world.player,{x:469,y:330,ground:false,vy:2,coyote:0});e.step(emptyInput);e.step({...emptyInput,jump:true});expect(e.world.player.vy).toBeLessThan(-10);expect(e.world.player.x).toBeLessThan(469);expect(e.world.player.face).toBe(-1);
 });
 it('catches a descending lip and climbs with a separate jump',()=>{
  const e=new Engine();Object.assign(e.world.player,{x:598,y:360,ground:false,vy:3});e.step({...emptyInput,right:true});expect(e.world.player.ledge).toBe(true);e.step({...emptyInput,jump:true});expect(e.world.player.ledge).toBe(false);expect(e.world.player.x).toBeGreaterThan(625);expect(e.world.player.y).toBeLessThan(355);
 });
 it('requires facing and range and respects slash cooldown',()=>{
  const e=new Engine();Object.assign(e.world.player,{x:820,y:313,face:-1});e.step({...emptyInput,attack:true});expect(e.world.enemies[0].hp).toBe(3);
  step(e,25);e.world.player.face=1;e.step({...emptyInput,attack:true});expect(e.world.enemies[0].hp).toBe(2);e.step({...emptyInput,attack:true});expect(e.world.enemies[0].hp).toBe(2);
 });
 it('parries an imminent facing strike and staggers the sentinel',()=>{
  const e=room(3);Object.assign(e.world.player,{x:665,y:438,face:1});Object.assign(e.world.enemies[0],{phase:'windup',timer:1});e.step({...emptyInput,guard:true});expect(e.world.player.hp).toBe(5);expect(e.world.enemies[0].phase).toBe('stunned');expect(e.world.message).toContain('Parry');
 });
});
describe('Puzzle, anchors and campaign',()=>{
 it('cannot jump or climb over the closed shutter from the switch ledge',()=>{
  const e=room(2);Object.assign(e.world.player,{x:566,y:288,vx:4.3,ground:true});step(e,4,{...emptyInput,right:true});e.step({...emptyInput,right:true,jump:true});step(e,70,{...emptyInput,right:true});e.step({...emptyInput,right:true,jump:true});step(e,70,{...emptyInput,right:true});expect(e.world.player.x).toBeLessThanOrEqual(734);expect(e.world.gate).toBe(0);
 });
 it('cannot escape the chamber ceiling by repeated kicks against the sealed shutter',()=>{
  const e=room(2);Object.assign(e.world.player,{x:734,y:438,ground:true});
  for(let n=0;n<1000;n++){e.step({...emptyInput,right:true,jump:n%13===0});expect(e.world.player.x).toBeLessThanOrEqual(734);expect(e.world.player.y).toBeGreaterThanOrEqual(70);}
  expect(e.world.gate).toBe(0);
 });
 it('switch opens for six seconds, rewind restores it, and it closes again',()=>{
  const e=room(2);Object.assign(e.world.player,{x:535,y:288});e.step({...emptyInput,interact:true});expect(e.world.gate).toBe(360);step(e,60);expect(e.world.gate).toBe(300);e.step({...emptyInput,rewind:true});expect(e.world.gate).toBe(302);step(e,302);expect(e.world.gate).toBe(0);
 });
 it('binding an anchor refills, clears history and reloads only the checkpoint',()=>{
  const e=new Engine();step(e,10);e.reserve=1;Object.assign(e.world.player,{x:525,y:438,hp:2});e.step({...emptyInput,interact:true});expect(e.reserve).toBe(6);expect(e.world.player.hp).toBe(5);expect(e.history).toHaveLength(0);
  const loaded=new Engine();expect(loaded.restore(e.readSave())).toBe(true);expect(loaded.world.player.x).toBe(525);expect(loaded.world.player.hp).toBe(5);e.world.player.x=700;e.restart();expect(e.world.player.x).toBe(525);
 });
 it('blocks exits until sentinels fall, then advances and saves the next chamber',()=>{
  const e=new Engine();Object.assign(e.world.player,{x:935,y:313});e.step({...emptyInput,interact:true});expect(e.world.room).toBe(0);e.world.enemies[0].hp=0;e.step({...emptyInput,interact:true});expect(e.world.room).toBe(1);expect(e.history).toHaveLength(0);const loaded=new Engine();loaded.restore(e.readSave());expect(loaded.world.room).toBe(1);
 });
 it('lethal damage in the exit interaction frame cannot advance or save',()=>{
  const e=room(2);Object.assign(e.world.player,{x:874,y:438,hp:2});e.world.tick=30;e.world.enemies[0].hp=0;const saved=e.readSave();e.step({...emptyInput,interact:true});expect(e.world.dead).toBe(true);expect(e.world.room).toBe(2);expect(e.readSave()).toBe(saved);
 });
 it('restores the completed ending and resets all progress on a new adventure',()=>{
  const e=room(3);Object.assign(e.world.player,{x:920,y:438});e.world.enemies[0].hp=0;e.step({...emptyInput,interact:true});expect(e.world.won).toBe(true);const loaded=new Engine();loaded.restore(e.readSave());expect(loaded.world.won).toBe(true);expect(loaded.world.enemies[0].hp).toBe(0);expect(loaded.world.player.x).toBe(920);loaded.newAdventure();expect(loaded.world.room).toBe(0);expect(loaded.world.won).toBe(false);expect(loaded.reserve).toBe(6);
 });
 it.each(['no','null','{}','{"version":2,"room":0,"anchor":false,"won":false}','{"version":1,"room":-1,"anchor":false,"won":false}','{"version":1,"room":1.5,"anchor":false,"won":false}','{"version":1,"room":0,"anchor":"yes","won":false}','{"version":1,"room":0,"anchor":false,"won":true}'])('rejects malformed or incompatible save %s',raw=>{const e=new Engine();expect(e.restore(raw)).toBe(false);expect(e.world.room).toBe(0);});
});
