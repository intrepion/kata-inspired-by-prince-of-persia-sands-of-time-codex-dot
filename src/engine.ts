export type Rect = { x:number; y:number; w:number; h:number };
export type Input = {left:boolean; right:boolean; jump:boolean; attack:boolean; guard:boolean; rewind:boolean; interact:boolean};
export const emptyInput:Input = {left:false,right:false,jump:false,attack:false,guard:false,rewind:false,interact:false};
export type Player = Rect & {vx:number;vy:number;face:number;hp:number;ground:boolean;wall:number;ledge:boolean;invuln:number;swing:number;cooldown:number;guard:number;coyote:number;buffer:number};
export type Sentinel = {x:number;y:number;home:number;hp:number;face:number;phase:'patrol'|'windup'|'strike'|'recover'|'stunned';timer:number;boss:boolean};
export type World = {room:number;tick:number;player:Player;enemies:Sentinel[];gate:number;dead:boolean;won:boolean;message:string;anchor:number};
export type Chamber = {name:string;subtitle:string;story:string;solids:Rect[];hazards:Rect[];timed:Rect[];spawn:[number,number];anchor:[number,number];exit:[number,number];switch?:[number,number];enemies:[number,number,boolean][];hint:string};
const r=(x:number,y:number,w:number,h:number):Rect=>({x,y,w,h});
export const chambers:Chamber[] = [
 {name:'01 · The Broken Aqueduct',subtitle:'A borrowed minute',story:'Sera, the city courier, carries the last living minute. Reach the meridian bell before Vey forgets the dawn.',solids:[r(0,480,330,80),r(490,480,510,80),r(625,355,100,125),r(825,355,175,125)],hazards:[r(338,535,144,25)],timed:[],spawn:[75,438],anchor:[525,480],exit:[935,355],enemies:[[870,355,false]],hint:'Run → jump the break. At a wall: jump again to kick away, or catch the lip and press jump to climb. Face the sentinel; slash or guard its gold windup.'},
 {name:'02 · The Hanging Gardens',subtitle:'The ascent',story:'The gardens once measured rain. Now their sentinels keep the sky locked. Climb between the two silver walls.',solids:[r(0,480,1000,80),r(205,390,90,90),r(335,245,30,235),r(495,185,30,295),r(525,185,475,28)],hazards:[],timed:[],spawn:[75,438],anchor:[270,480],exit:[935,185],enemies:[[770,185,false],[900,185,false]],hint:'Enter the shaft from the right side of the low wall. Alternate jump kicks between walls; ledge catches help at the top. Below the upper floor is a safe return route.'},
 {name:'03 · The Brass Lung',subtitle:'Open the way',story:'A switch feeds the ancient lung for six seconds. Its shutters and flame vents remember every moment you reverse.',solids:[r(0,480,1000,80),r(280,390,120,90),r(450,330,120,150)],hazards:[],timed:[r(155,456,70,24),r(630,456,65,24),r(825,456,60,24)],spawn:[70,438],anchor:[410,480],exit:[935,480],switch:[535,330],enemies:[[900,480,false]],hint:'Climb to the amber switch and press E. Cross the shutter before its six-second timer expires. Cyan vents are safe; gold is a warning; red burns. Rewind restores the timer too.'},
 {name:'04 · The Meridian Heart',subtitle:'Let the dawn begin',story:'The Curator would preserve this night forever. Break its guard, restore the bell, and return the borrowed minute to the city.',solids:[r(0,480,1000,80),r(230,370,110,24),r(660,370,110,24)],hazards:[],timed:[r(430,456,75,24)],spawn:[75,438],anchor:[170,480],exit:[920,480],enemies:[[720,480,true]],hint:'The Curator takes six cuts. Hold guard to reduce damage; start guarding just before a strike to parry and stagger it. Jump to the balconies when the center vent wakes. E at the bell after victory.'}
];
const clone=<T>(value:T):T=>structuredClone(value);
export function overlaps(a:Rect,b:Rect){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
export function ventPhase(tick:number,index:number){const n=(tick+index*67)%210;return n<115?'safe':n<155?'warning':'fire';}
function makeWorld(room:number,atAnchor=false):World {
 const c=chambers[room], [x,y]=atAnchor?[c.anchor[0],c.anchor[1]-42]:c.spawn;
 return {room,tick:0,player:{x,y,w:26,h:42,vx:0,vy:0,face:1,hp:5,ground:true,wall:0,ledge:false,invuln:0,swing:0,cooldown:0,guard:0,coyote:6,buffer:0},enemies:c.enemies.map(([x,y,boss])=>({x,y:y-42,home:x,hp:boss?6:3,face:-1,phase:'patrol',timer:0,boss})),gate:0,dead:false,won:false,message:c.story,anchor:atAnchor?1:0};
}
export type Save = {version:1;room:number;anchor:boolean;won:boolean};
export function parseSave(raw:string|null):Save|null {
 try {const s:unknown=JSON.parse(raw??'null');if(typeof s!=='object'||s===null)return null;const v=s as Partial<Save>;
 if(v.version!==1||!Number.isInteger(v.room)||typeof v.room!=='number'||v.room<0||v.room>=chambers.length||typeof v.anchor!=='boolean'||typeof v.won!=='boolean'||(v.won&&v.room!==3))return null;
 return {version:1,room:v.room,anchor:v.anchor,won:v.won};}catch{return null;}
}
export class Engine {
 world:World=makeWorld(0); reserve=6; history:World[]=[]; paused=false; rewinding=false; saveRevision=0;
 private saved:Save={version:1,room:0,anchor:false,won:false};
 readSave(){return JSON.stringify(this.saved);}
 restore(raw:string|null){const save=parseSave(raw);if(!save)return false;this.saved=save;this.world=makeWorld(save.room,save.anchor);this.world.won=save.won;if(save.won){this.world.enemies.forEach(e=>e.hp=0);this.world.player.x=chambers[save.room].exit[0];this.world.player.y=chambers[save.room].exit[1]-42;this.world.message='Dawn returns to Vey.';}this.reserve=6;this.history=[];this.rewinding=false;return true;}
 restart(){this.restore(this.readSave());this.paused=false;}
 newAdventure(){this.saved={version:1,room:0,anchor:false,won:false};this.restart();this.saveRevision++;}
 private persist(){this.saved={version:1,room:this.world.room,anchor:this.world.anchor===1,won:this.world.won};this.saveRevision++;}
 private damage(amount:number){const p=this.world.player;if(p.invuln>0)return;p.hp=Math.max(0,p.hp-amount);p.invuln=65;p.vx=-p.face*4;if(p.hp===0){this.world.dead=true;this.world.message='The minute breaks. Hold R to undo your fall, or return to the anchor.';}}
 step(input:Input){
  if(this.paused||this.world.won){this.rewinding=false;return;}
  this.rewinding=false;
  if(input.rewind){
   for(let i=0;i<2&&this.history.length>0&&this.reserve>=1/60;i++){this.world=this.history.pop()!;this.reserve=Math.max(0,this.reserve-1/60);this.rewinding=true;}
   return;
  }
  if(this.world.dead)return;
  this.history.push(clone(this.world));if(this.history.length>480)this.history.shift();
  const w=this.world,p=w.player,c=chambers[w.room];w.tick++;w.gate=Math.max(0,w.gate-1);
  p.invuln=Math.max(0,p.invuln-1);p.swing=Math.max(0,p.swing-1);p.cooldown=Math.max(0,p.cooldown-1);
  p.guard=input.guard?p.guard+1:0;p.buffer=input.jump?8:Math.max(0,p.buffer-1);p.coyote=p.ground?6:Math.max(0,p.coyote-1);
  const solids=[...c.solids];if(c.switch&&w.gate===0)solids.push(r(760,70,28,410));
  p.wall=0;for(const b of solids){if(p.y<b.y+b.h&&p.y+p.h>b.y){if(Math.abs(p.x+p.w-b.x)<1)p.wall=1;else if(Math.abs(p.x-b.x-b.w)<1)p.wall=-1;}}
  const move=Number(input.right)-Number(input.left);
  if(move)p.face=move;
  p.vx=p.ledge?0:p.vx+(move*4.3-p.vx)*(move?.35:.28);
  if(input.guard)p.vx*=.5;
  if(p.buffer>0){
   if(p.ledge){p.y-=44;p.x+=p.face*30;p.ledge=false;p.vy=-3;p.buffer=0;}
   else if(p.coyote>0){p.vy=-12.5;p.ground=false;p.coyote=0;p.buffer=0;}
   else if(p.wall){p.vy=-13;p.vx=-p.wall*7;p.face=-p.wall;p.wall=0;p.buffer=0;}
  }
  if(input.attack&&p.cooldown===0){p.swing=16;p.cooldown=25;for(const e of w.enemies){if(e.hp>0&&Math.abs(e.x-p.x)<90&&Math.abs(e.y-p.y)<55&&(e.x-p.x)*p.face>=-20){e.hp--;e.phase='stunned';e.timer=28;w.message=e.hp===0?'The sentinel falls silent. The way is clear.':'A clean cut.';}}}
  const oldX=p.x;p.x=Math.max(8,Math.min(966,p.x+p.vx));p.wall=0;
  for(const b of solids){if(overlaps(p,b)){const side=p.vx>0?1:p.vx<0?-1:oldX<b.x?1:-1;p.x=side>0?b.x-p.w:b.x+b.w;p.wall=side;p.vx=0;
    if(!p.ground&&p.vy>=0&&p.y>b.y-18&&p.y<b.y+32&&b.y>50){p.ledge=true;p.y=b.y+4;p.face=side;p.vy=0;}
  }}
  const oldY=p.y;
  if(!p.ledge){p.vy=Math.min(p.wall&&move===p.wall?2:14,p.vy+.55);p.y+=p.vy;p.ground=false;
   for(const b of solids){if(overlaps(p,b)){if(p.vy>=0&&oldY+p.h<=b.y+1){p.y=b.y-p.h;p.vy=0;p.ground=true;}else if(p.vy<0&&oldY>=b.y+b.h-1){p.y=b.y+b.h;p.vy=0;}}}
  }
  for(const h of c.hazards)if(overlaps(p,h))this.damage(5);
  c.timed.forEach((h,i)=>{if(ventPhase(w.tick,i)==='fire'&&overlaps(p,h))this.damage(2);});
  if(p.y>570)this.damage(5);
  for(const e of w.enemies){
   if(e.hp===0)continue;e.face=p.x>e.x?1:-1;
   if(e.phase==='patrol'){
    if(Math.abs(e.y-p.y)<55&&Math.abs(e.x-p.x)<90){e.phase='windup';e.timer=e.boss?40:50;}
    else if(Math.abs(e.x-p.x)<220&&Math.abs(e.y-p.y)<55)e.x+=e.face*.8;
   }else{
    e.timer--;
    if(e.timer<=0){
     if(e.phase==='windup'){e.phase='strike';e.timer=12;
      if(Math.abs(e.x-p.x)<105&&Math.abs(e.y-p.y)<55){
       if(input.guard&&(e.x-p.x)*p.face>=-15){if(p.guard<=15){e.phase='stunned';e.timer=65;w.message='Parry! The clockwork guard is open.';}else {p.invuln=Math.max(p.invuln,10);w.message='Guard held. Release and time your next parry.';}}
       else this.damage(e.boss?2:1);
      }
     }else if(e.phase==='strike'){e.phase='recover';e.timer=55;}else e.phase='patrol';
    }
   }
  }
  if(w.dead)return;
  if(input.interact){
   if(Math.abs(p.x-c.anchor[0])<58&&Math.abs(p.y+p.h-c.anchor[1])<60){
    p.hp=5;this.reserve=6;w.anchor=1;this.history=[];w.message='Anchor bound. Vitality and reserve restored. Progress saved.';this.persist();
   }else if(c.switch&&Math.abs(p.x-c.switch[0])<65&&Math.abs(p.y+p.h-c.switch[1])<60){w.gate=360;w.message='The brass lung breathes. Six seconds to cross.';}
   else if(Math.abs(p.x-c.exit[0])<65&&Math.abs(p.y+p.h-c.exit[1])<70){
    if(w.enemies.some(e=>e.hp>0))w.message='The way is sealed while a sentinel still stands.';
    else if(w.room===3){w.won=true;w.message='Dawn returns to Vey.';this.history=[];this.persist();}
    else {this.world=makeWorld(w.room+1);this.reserve=6;this.history=[];this.persist();}
   }
  }
 }
}
