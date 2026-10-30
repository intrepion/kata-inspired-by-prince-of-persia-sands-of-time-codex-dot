import * as THREE from '../vendor/three/three.module.min.js';
import { platforms } from './engine';
import { cameraFraction } from './camera';
export function createCourtyardThree(canvas) {
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
 const scene=new THREE.Scene();scene.background=new THREE.Color('#53696f');scene.fog=new THREE.Fog('#53696f',45,100);scene.add(new THREE.HemisphereLight('#e8e4cc','#243e48',2));
 const light=new THREE.DirectionalLight('#ffdfad',1.1);light.position.set(-10,20,-10);scene.add(light);const camera=new THREE.PerspectiveCamera(55,16/9,.2,130);
 const material=color=>new THREE.MeshLambertMaterial({color});
 function box(x,y,z,w,h,d,color,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color));m.position.set(x+w/2,y+h/2,z+d/2);parent.add(m);return m;}
 for(const f of platforms){box(f.x,f.top-1.2,f.z,f.width,1.2,f.depth,'#7b8175');box(f.x,f.top,f.z,.12,.2,f.depth,'#b4ab88');box(f.x+f.width-.12,f.top,f.z,.12,.2,f.depth,'#b4ab88');}
 box(3.55,-1,4.5,.55,6,13,'#b2a78b');for(let z=5;z<17;z+=1.1)box(3.49,1.1,z,.06,.14,.65,'#f6c875');
 box(-.5,1.02,19.85,4.5,2.15,.15,'#9f957b');box(-.5,3.19,19.72,4.5,.14,.33,'#f4cf82');
 box(-2.8,5.45,26.13,5.6,.12,.14,'#e9c475');box(-2.9,1,26.1,.15,4.6,.2,'#555e61');box(2.75,1,26.1,.15,4.6,.2,'#555e61');
 for(const p of [{x:0,y:0,z:0},{x:0,y:3.2,z:21.5},{x:0,y:3.2,z:33}]){box(p.x-.6,p.y,p.z-.45,1.2,.22,.9,'#4aa4ad');box(p.x-.22,p.y+.2,p.z-.18,.44,.5,.36,'#b5f3dc');}
 box(-4.7,6.8,31.6,9.4,.12,.16,'#777a72');const blade=new THREE.Group();scene.add(blade);box(-.08,3.3,31.6,.16,3.5,.16,'#f0ab7d',blade);box(-.45,3.5,31.57,.9,.9,.22,'#dfbd98',blade);
 const gate=new THREE.Group();scene.add(gate);for(let x=-4.5;x<=4.5;x+=.75)box(x,3.2,39.2,.09,3.2,.12,'#c3a677',gate);
 box(-.9,3.2,40.5,1.8,.4,1.2,'#b6a980');box(-.13,3.6,40.9,.26,2.5,.26,'#d7bf80');box(-.65,5.4,40.6,1.3,1,.8,'#e6c882');
 function actor(color){const g=new THREE.Group();box(-.3,.52,-.22,.6,.65,.44,color,g);box(-.2,1.18,-.2,.4,.42,.4,'#e2bb94',g);box(-.27,0,-.15,.2,.55,.3,'#263b49',g);box(.07,0,-.15,.2,.55,.3,'#263b49',g);scene.add(g);return g;}
 const player=actor('#73c4c3'), enemies=[actor('#9d6c66'),actor('#9d6c66')];
 const sword=box(0,0,0,.12,.12,1.2,'#f3e4b9');
 const sands=enemies.map(()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.2,12,8),material('#9fe7dd'));scene.add(m);return m;});
 function render(game,view,w,h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const p=game.world.player,distance=view.overview?19:8,elevation=view.overview?16:view.height,focus={x:p.x,y:p.y+1.1,z:p.z};
 const eye={x:p.x-Math.sin(view.yaw)*distance,y:p.y+elevation,z:p.z-Math.cos(view.yaw)*distance},fraction=cameraFraction(focus,eye);camera.position.set(focus.x+(eye.x-focus.x)*fraction,focus.y+(eye.y-focus.y)*fraction,focus.z+(eye.z-focus.z)*fraction);camera.lookAt(focus.x,focus.y,focus.z);
 player.position.set(p.x,p.y,p.z);player.rotation.y=p.facing;player.rotation.z=game.world.dead?Math.PI/2:0;
 game.world.enemies.forEach((e,i)=>{const obj=enemies[i];obj.visible=e.phase!=='sand';obj.children[0].material.color.set(e.phase==='windup'?'#ffd36d':'#9d6c66');obj.position.set(e.x,e.y,e.z);obj.rotation.z=e.phase==='down'?Math.PI/2:0;sands[i].visible=e.phase==='down';sands[i].position.set(e.x,e.y+.6,e.z);});
 sword.visible=p.strike>0;sword.position.set(p.x+Math.sin(p.facing)*.7,p.y+.95,p.z+Math.cos(p.facing)*.7);sword.rotation.y=p.facing;
 scene.background.set(game.rewinding?'#7dbbb5':'#53696f');blade.position.x=game.bladeX;gate.visible=game.finished<2;renderer.render(scene,camera);}
 return {render,dispose:()=>renderer.dispose()};
}
