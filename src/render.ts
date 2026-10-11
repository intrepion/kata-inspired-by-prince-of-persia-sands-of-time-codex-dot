import { Engine, chambers, ventPhase, type Rect, type Sentinel } from './engine';
const palettes=[['#102d3d','#235665','#d3a770'],['#113b3d','#347273','#bacf95'],['#302f3b','#79615d','#e4b877'],['#19263e','#475370','#e7b978']];
type Pose='idle'|'run'|'swing'|'guard'|'windup';
export class Renderer {
 private ctx:CanvasRenderingContext2D;
 constructor(canvas:HTMLCanvasElement){this.ctx=canvas.getContext('2d')!;}
 private line(x:number,y:number,xx:number,yy:number,color:string,width=1){const g=this.ctx;g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.stroke();}
 private circle(x:number,y:number,r:number,color:string){const g=this.ctx;g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();}
 private text(text:string,x:number,y:number,color='#c8ddd9',size=11){const g=this.ctx;g.font=`${size}px system-ui`;g.fillStyle=color;g.textAlign='center';g.fillText(text,x,y);}
 private arch(x:number,y:number,w:number,h:number,color:string){const g=this.ctx;g.fillStyle=color;g.beginPath();g.moveTo(x,y+h);g.lineTo(x,y+w/2);g.arc(x+w/2,y+w/2,w/2,Math.PI,0);g.lineTo(x+w,y+h);g.closePath();g.fill();}
 private background(e:Engine){
  const g=this.ctx,w=e.world,[sky,mid,accent]=palettes[w.room];
  const grad=g.createLinearGradient(0,0,0,560);grad.addColorStop(0,'#061722');grad.addColorStop(.6,sky);grad.addColorStop(1,mid);g.fillStyle=grad;g.fillRect(0,0,1000,560);
  this.circle(790,115,61,'#b4c3bb15');this.circle(790,115,45,'#c0c9af13');
  for(let i=0;i<55;i++){const x=(i*173+41)%1000,y=70+(i*67)%210;this.circle(x,y,i%7===0?1.5:.65,'#a8c6c955');}
  // Original stepped skyline and observatory roofs.
  g.fillStyle='#0a2435';for(let i=0;i<14;i++){const x=i*83-20,y=220+(i*47)%80;g.fillRect(x,y,62,340);this.arch(x-5,y-38,72,65,'#0b2b3a');g.fillRect(x+27,y-64,5,26);}
  for(let i=0;i<7;i++){const x=i*163-10;this.arch(x,260,125,260,'#133541');this.arch(x+15,277,95,230,'#092a37');g.fillStyle='#234d55';g.fillRect(x+4,320,6,240);g.fillRect(x+115,320,6,240);this.line(x+4,320,x+120,320,'#73948a40');}
  // The distant meridian dial.
  g.save();g.translate(790,115);g.strokeStyle='#c2ae7650';g.lineWidth=1;g.beginPath();g.arc(0,0,43,0,Math.PI*2);g.stroke();for(let i=0;i<12;i++){g.save();g.rotate(i*Math.PI/6);this.line(0,-35,0,-40,'#c2ae7670');g.restore();}g.rotate(w.tick*.0007);this.line(0,0,0,-29,accent);this.line(0,0,20,0,accent);g.restore();
  if(w.room===1){for(let i=0;i<18;i++){const x=(i*63)%1000;this.line(x,360,x+25,415,'#59977d33',2);this.circle(x+25,410,14,'#39796755');}}
  if(w.room===3){g.strokeStyle='#cba97f30';g.lineWidth=4;g.beginPath();g.arc(505,340,200,Math.PI,0);g.stroke();for(let i=0;i<9;i++){const x=110+i*100;this.line(x,180,x,400,'#69708a22',2);}}
  // Rain is deterministic with the room's reversible clock.
  g.globalAlpha=.15;for(let i=0;i<35;i++){const x=(i*113+w.tick*.45)%1000,y=(i*73+w.tick*2)%520;this.line(x,y,x-6,y+18,'#aec9dc');}g.globalAlpha=1;
 }
 private stone(b:Rect,room:number){const g=this.ctx;g.fillStyle=room===2?'#65554d':'#2e5359';g.fillRect(b.x,b.y,b.w,b.h);const grad=g.createLinearGradient(0,b.y,0,b.y+b.h);grad.addColorStop(0,'#79827d66');grad.addColorStop(1,'#091f3299');g.fillStyle=grad;g.fillRect(b.x,b.y,b.w,b.h);g.fillStyle='#bdb798';g.fillRect(b.x,b.y,b.w,4);g.fillStyle='#6c8882';g.fillRect(b.x,b.y+4,b.w,5);
  for(let y=b.y+28;y<b.y+b.h;y+=28){this.line(b.x,y,b.x+b.w,y,'#122c3970');for(let x=b.x+((Math.floor(y/28)%2)*30);x<b.x+b.w;x+=60)this.line(x,y-26,x,y,'#15333b90');}
  if(b.h>100&&b.w<130){g.fillStyle='#79d9da75';g.fillRect(b.x+2,b.y+10,3,b.h-14);g.fillRect(b.x+b.w-5,b.y+10,3,b.h-14);}
 }
 private figure(x:number,y:number,face:number,pose:Pose,tick:number,color:string,enemy=false,boss=false){const g=this.ctx;g.save();g.translate(x+13,y+22);g.scale(face,1);const swing=pose==='swing',guard=pose==='guard',stride=pose==='run'?Math.sin(tick*.25)*8:0;
  // Cloth silhouette, boots and the borrowed-minute scarf.
  if(!enemy){g.fillStyle='#cd985e';g.beginPath();g.moveTo(-6,-8);g.lineTo(-27-Math.sin(tick*.15)*5,-13);g.lineTo(-18,-3);g.lineTo(-5,0);g.fill();}
  const size=boss?1.25:1;g.scale(size,size);this.line(-4,9,-5+stride,18,enemy?'#bda580':'#acd7d3',5);this.line(4,9,6-stride,18,enemy?'#8c7f76':'#5f959e',5);
  g.fillStyle=color;g.beginPath();g.moveTo(-8,-10);g.lineTo(7,-10);g.lineTo(10,10);g.lineTo(-9,10);g.fill();g.fillStyle=enemy?'#dec59e':'#d8b397';g.fillRect(-5,-20,10,11);g.fillStyle=enemy?'#9f856c':'#293c4b';g.fillRect(-6,-22,12,5);
  g.fillStyle=enemy?'#ffc56c':'#bddbe0';g.fillRect(2,-17,5,2);this.line(-7,-5,-11,5,color,4);
  if(swing){this.line(6,-5,22,-2,color,4);this.line(23,-2,62,-8,'#faf0ce',3);g.strokeStyle='#f2d19499';g.lineWidth=8;g.beginPath();g.arc(10,-3,48,-1.1,.7);g.stroke();}
  else if(guard){this.line(6,-6,13,-15,color,4);this.line(17,-27,17,13,'#b9eeee',3);this.line(12,-9,23,-9,'#e4c28c',3);}
  else if(pose==='windup'){this.line(6,-5,10,-20,color,4);this.line(10,-20,-14,-48,'#e7b96f',3);}
  else {this.line(6,-5,15,5,color,4);this.line(15,5,38,13,enemy?'#c3a889':'#d4e5df',3);}
  if(enemy&&boss){g.strokeStyle='#dfba7b';g.lineWidth=2;g.beginPath();g.arc(0,-15,15,Math.PI,0);g.stroke();}
  g.restore();
 }
 private sentinel(e:Sentinel,tick:number){if(e.hp===0){this.circle(e.x+13,e.y+36,12,'#dbc89935');this.line(e.x,e.y+38,e.x+35,e.y+38,'#82978f',3);return;}const g=this.ctx;
  if(e.phase==='windup'){const radius=50+Math.sin(tick*.3)*4;g.strokeStyle='#f4bd7390';g.lineWidth=2;g.beginPath();g.arc(e.x+13,e.y+22,radius,0,Math.PI*2);g.stroke();this.text('!',e.x+13,e.y-24,'#ffe0a2',24);}
  this.figure(e.x,e.y,e.face,e.phase==='strike'?'swing':e.phase==='windup'?'windup':e.phase==='patrol'?'run':'idle',tick,e.phase==='stunned'?'#62b3b3':e.boss?'#7a5c70':'#657d81',true,e.boss);
  for(let i=0;i<e.hp;i++){g.fillStyle='#d8b375';g.fillRect(e.x-2+i*7,e.y-9,5,3);}if(e.phase==='stunned')this.text('OPEN',e.x+13,e.y-24,'#9df3e8',9);
 }
 draw(e:Engine){const g=this.ctx,w=e.world,p=w.player,c=chambers[w.room];this.background(e);for(const b of c.solids)this.stone(b,w.room);
  for(const h of c.hazards){g.fillStyle='#cc8272';for(let x=h.x;x<h.x+h.w;x+=16){g.beginPath();g.moveTo(x,h.y+h.h);g.lineTo(x+8,h.y);g.lineTo(x+16,h.y+h.h);g.fill();}}
  c.timed.forEach((h,i)=>{const phase=ventPhase(w.tick,i);g.fillStyle='#172b34';g.fillRect(h.x,h.y+h.h-8,h.w,8);for(let x=h.x+5;x<h.x+h.w;x+=12){this.line(x,h.y+h.h-6,x+5,h.y+h.h-6,phase==='safe'?'#62cece':phase==='warning'?'#eac075':'#f37d65',3);if(phase==='fire'){const hh=35+Math.sin(w.tick*.4+x)*12;g.fillStyle='#ea705d77';g.beginPath();g.moveTo(x-4,h.y+h.h);g.quadraticCurveTo(x-10,h.y-hh/2,x+2,h.y-hh);g.quadraticCurveTo(x+14,h.y+h.h/2,x+7,h.y+h.h);g.fill();}}
    this.text(phase==='safe'?'VENT · SAFE':phase==='warning'?'VENT · READY':'VENT · FIRE',h.x+h.w/2,h.y+h.h+18,phase==='safe'?'#72b9bd':'#eaba8a',8);
  });
  // Cyan anchors with original diamond geometry.
  const [ax,ay]=c.anchor;g.save();g.translate(ax,ay-24);g.rotate(Math.PI/4);g.strokeStyle='#83e2dd';g.lineWidth=2;g.strokeRect(-11,-11,22,22);g.fillStyle='#87e6df40';g.fillRect(-8,-8,16,16);g.restore();this.line(ax,ay-55,ax,ay-47,'#9be9de');this.text('E · ANCHOR',ax,ay-62,'#96d8d5',9);
  if(c.switch){const [sx,sy]=c.switch;g.fillStyle='#4b3934';g.fillRect(sx-10,sy-40,20,40);this.circle(sx,sy-32,10,'#dbb476');this.line(sx,sy-32,sx+8,sy-45,'#ebd4a2',3);this.text('E · SWITCH',sx,sy-62,'#e1be80',10);const open=w.gate>0;g.fillStyle=open?'#81d5c333':'#bda381';g.fillRect(760,70,28,open?15:410);for(let y=90;y<480&&!open;y+=20)this.line(763,y,785,y,'#5b5051',2);this.text(open?`${(w.gate/60).toFixed(1)}s`:'SEALED',774,100,open?'#a2efe1':'#e7bc7c',11);}
  const [ex,ey]=c.exit,clear=w.enemies.every(e=>e.hp===0);if(w.room<3){this.arch(ex-26,ey-78,53,78,clear?'#83d3c135':'#b6a38822');this.arch(ex-20,ey-70,40,70,'#061d2c');g.strokeStyle=clear?'#84d9cc':'#b5a07b';g.lineWidth=2;g.strokeRect(ex-29,ey-52,58,52);this.text(clear?'E · ENTER':'DEFEAT SENTINELS',ex,ey-96,clear?'#a5e7d8':'#bdac91',9);}else {g.fillStyle='#d0af7a';g.beginPath();g.moveTo(ex-28,ey-28);g.quadraticCurveTo(ex-21,ey-45,ex-17,ey-70);g.quadraticCurveTo(ex,ey-82,ex+17,ey-70);g.quadraticCurveTo(ex+21,ey-45,ex+28,ey-28);g.fill();this.circle(ex,ey-19,6,'#e6c98e');this.text(clear?'E · RING THE MERIDIAN':'THE MERIDIAN BELL',ex,ey-103,'#ebc78d',9);}
  for(const foe of w.enemies)this.sentinel(foe,w.tick);
  if(e.rewinding){for(let i=0;i<Math.min(60,e.history.length);i+=10){const past=e.history[e.history.length-1-i].player;g.globalAlpha=.08+(60-i)/300;this.figure(past.x,past.y,past.face,'idle',w.tick,'#8ffff0');}g.globalAlpha=1;}
  g.globalAlpha=p.invuln>0&&w.tick%8<4?.45:1;this.figure(p.x,p.y,p.face,p.swing?'swing':p.guard?'guard':Math.abs(p.vx)>1?'run':p.ledge?'guard':'idle',w.tick,'#70bfc8');g.globalAlpha=1;
  const moveLabel=p.ledge?'SPACE · CLIMB':p.wall&&!p.ground?'SPACE · WALL KICK':'';if(moveLabel)this.text(moveLabel,p.x+13,p.y-17,'#a8eee6',9);
  if(w.room===0){this.text('SPACE · JUMP',285,400,'#ddc9a6',11);this.text('WALL KICK / CATCH',670,305,'#a5ded7',10);this.text('X · BLADE',875,275,'#e7c890',10);}if(w.room===1){this.text('KICK BETWEEN THE SILVER WALLS',432,135,'#b4ded6',11);this.line(382,265,470,208,'#81d1cf66',2);}
  if(e.rewinding){g.fillStyle='#5cdcd719';g.fillRect(0,0,1000,560);g.strokeStyle='#8ceee2';g.lineWidth=4;g.strokeRect(2,2,996,556);}if(w.dead){g.fillStyle='#421d3233';g.fillRect(0,0,1000,560);}
  if(w.won){const grad=g.createLinearGradient(0,0,0,560);grad.addColorStop(0,'#e5b97a44');grad.addColorStop(1,'#e5b97a00');g.fillStyle=grad;g.fillRect(0,0,1000,560);}
 }
}
