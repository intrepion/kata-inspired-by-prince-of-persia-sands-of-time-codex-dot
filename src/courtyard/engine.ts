export const STEP = 1 / 60;
export const SAVE_KEY = 'last-meridian-courtyard-v1';
export interface Vec3 { x: number; y: number; z: number }
export interface Controls {
  forward: number; right: number; yaw: number;
  jump: boolean; special: boolean; attack: boolean; dagger: boolean; rewind: boolean;
}
export const idle: Controls = { forward: 0, right: 0, yaw: 0, jump: false, special: false, attack: false, dagger: false, rewind: false };
export interface Platform { id: string; x: number; z: number; width: number; depth: number; top: number }
export const platforms: readonly Platform[] = [
  { id: 'Departure', x: -4, z: -3, width: 8, depth: 10, top: 0 },
  { id: 'Wall landing', x: -0.5, z: 16, width: 4.5, depth: 4, top: 1 },
  { id: 'High gallery', x: -3, z: 20, width: 7, depth: 4, top: 3.2 },
  { id: 'Bell court', x: -5, z: 30, width: 10, depth: 13, top: 3.2 },
];
export type Motion = 'ground' | 'air' | 'wallrun' | 'wallrise' | 'ledge' | 'pole' | 'vault';
export interface Courier extends Vec3 {
  vx: number; vy: number; vz: number; facing: number; hp: number; motion: Motion;
  actionTime: number; hurt: number; strike: number; counter: number; wallCatchCooldown: number;
}
export interface Sentinel extends Vec3 { hp: number; phase: 'approach' | 'windup' | 'recover' | 'down' | 'sand'; timer: number }
export interface World {
  tick: number; player: Courier; enemies: Sentinel[]; dead: boolean; won: boolean;
  wallrunDone: boolean; ledgeDone: boolean; poleDone: boolean; message: string;
}
type Anchor = 'departure' | 'gallery' | 'court';
const anchors: Record<Anchor, Vec3> = {
  departure: { x: 0, y: 0, z: 0 }, gallery: { x: 0, y: 3.2, z: 21.5 }, court: { x: 0, y: 3.2, z: 33 },
};
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const distance = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.z - b.z);
const within = (p: Vec3, floor: Platform, margin = 0) => p.x >= floor.x + margin && p.x <= floor.x + floor.width - margin && p.z >= floor.z + margin && p.z <= floor.z + floor.depth - margin;
function createWorld(anchor: Anchor = 'departure'): World {
  const point = anchors[anchor];
  return {
    tick: 0, dead: false, won: false, wallrunDone: anchor !== 'departure', ledgeDone: anchor !== 'departure', poleDone: anchor === 'court',
    player: { ...point, vx: 0, vy: 0, vz: 0, facing: 0, hp: 5, motion: 'ground', actionTime: 0, hurt: 0, strike: 0, counter: 0, wallCatchCooldown: 0 },
    enemies: [
      { x: -2.2, y: 3.2, z: 36, hp: 3, phase: 'approach', timer: 0 },
      { x: 2.2, y: 3.2, z: 37, hp: 3, phase: 'approach', timer: 0 },
    ],
    message: 'Cross the broken aqueduct. Follow the gold marks on the right wall.',
  };
}

/** Fixed-step public gameplay boundary. Camera yaw is presentation/input state; the complete mutable world is rewindable. */
export class Courtyard {
  world = createWorld();
  history: World[] = [];
  tanks = 3;
  rewinding = false;
  paused = false;
  anchor: Anchor = 'departure';
  saveRevision = 0;
  private rewindHeld = false;
  private rewindActive = false;

  step(input: Controls): void {
    if (this.paused || this.world.won) return;
    if (input.rewind) {
      if (!this.rewindHeld) {
        this.rewindActive = this.tanks > 0 && this.history.length > 0;
        if (this.rewindActive) this.tanks--;
      }
      this.rewindHeld = true;
      this.rewinding = this.rewindActive && this.history.length > 0;
      if (this.rewinding) {
        for (let n = 0; n < 2 && this.history.length; n++) this.world = this.history.pop()!;
      }
      return;
    }
    this.releaseRewind();
    if (this.world.dead) return;
    this.history.push(clone(this.world));
    if (this.history.length > 600) this.history.shift();
    const w = this.world, p = w.player;
    w.tick++;
    p.hurt = Math.max(0, p.hurt - STEP);
    p.strike = Math.max(0, p.strike - STEP);
    p.counter = Math.max(0, p.counter - STEP);
    p.wallCatchCooldown = Math.max(0, p.wallCatchCooldown - STEP);
    const length = Math.hypot(input.right, input.forward) || 1;
    const side = input.right / Math.max(1, length), front = input.forward / Math.max(1, length);
    const direction = { x: Math.cos(input.yaw) * side + Math.sin(input.yaw) * front, z: -Math.sin(input.yaw) * side + Math.cos(input.yaw) * front };
    const moving = Math.hypot(direction.x, direction.z) > 0.1;
    if (moving) p.facing = Math.atan2(direction.x, direction.z);
    if (input.dagger && this.retrieve()) return;
    if (input.attack && p.strike <= 0) this.attack(direction, moving);
    this.move(input, direction, moving);
    this.sentinels(input.special && p.motion === 'ground');
    // A moving blade, all of whose timing lives in the rewindable world.
    if (Math.abs(p.z - 31.7) < 0.5 && Math.abs(p.x - this.bladeX) < 0.6 && p.y < 4.35) this.hurt();
    if (p.y < -6) { p.hp = 0; w.dead = true; w.message = 'The fall is still in your thread. Hold R to undo it.'; }
    if (p.hp <= 0) w.dead = true;
    if (input.dagger) this.interact();
  }

  get bladeX(): number { return Math.sin(this.world.tick * STEP * 1.7) * 4; }
  get threadSeconds(): number { return this.history.length * STEP; }
  get finished(): number { return this.world.enemies.filter(enemy => enemy.phase === 'sand').length; }
  releaseRewind(): void { this.rewinding = false; this.rewindHeld = false; this.rewindActive = false; }

  private move(input: Controls, direction: { x: number; z: number }, moving: boolean): void {
    const w = this.world, p = w.player;
    if (p.motion === 'ledge') {
      if (input.jump || input.special && input.forward > 0) {
        p.y = 3.2; p.z = 20.6; p.motion = 'ground'; p.vy = 0; w.ledgeDone = true;
        w.message = 'High gallery reached. E at the blue fountain saves. The pole spans the next gap.';
      } else if (input.forward < 0) { p.motion = 'air'; p.vy = 0; p.z -= 0.35; }
      return;
    }
    if (p.motion === 'pole') {
      p.actionTime += STEP * 2.7;
      const swing = Math.sin(p.actionTime) * 0.8;
      p.z = 26.2 + Math.sin(swing) * 1.8;
      p.y = 5.5 - Math.cos(swing) * 1.8;
      if (input.jump) {
        p.motion = 'air'; p.vz = 6.8 + Math.max(0, Math.sin(p.actionTime)) * 1.4;
        p.vx = direction.x * 3; p.vy = 6.2; w.poleDone = true;
        w.message = 'Pole release. Land in the bell court; avoid the sweeping blade.';
      }
      return;
    }
    if (p.motion === 'vault') {
      p.actionTime += STEP;
      const fraction = Math.min(1, p.actionTime / 0.6);
      p.x += p.vx * STEP; p.z += p.vz * STEP;
      p.y = 3.2 + Math.sin(fraction * Math.PI) * 1.6;
      if (fraction >= 1) { p.motion = 'ground'; p.y = 3.2; }
      return;
    }
    if (p.motion === 'wallrun') {
      p.actionTime += STEP;
      if (input.jump) { p.motion = 'air'; p.vx = -4; p.vz = 5.4; p.vy = 4.5; p.wallCatchCooldown = 0.35; }
      else if (!input.special || direction.z < 0.2 || p.actionTime > 1.95 || p.z > 16.5) {
        p.motion = 'air'; p.vy = 0; p.vx = 0; p.vz = 5.2;
      } else {
        p.x = 3.15; p.z += 6.4 * STEP; p.y = Math.max(1.05, p.y + (p.actionTime < 0.4 ? 2 : -0.3) * STEP);
        if (p.z > 16) w.wallrunDone = true;
        return;
      }
    }
    if (p.motion === 'wallrise') {
      p.actionTime += STEP;
      p.y += 5.5 * STEP;
      if (p.y + 1.2 >= 3.2) { p.y = 2; p.motion = 'ledge'; p.vy = 0; w.message = 'Ledge caught. Space or forward + Shift climbs; S drops.'; }
      else if (!input.special || p.actionTime > 0.65) { p.motion = 'air'; p.vy = 0; }
      return;
    }
    const target = this.target(direction, moving, 2.1);
    if (input.jump && p.motion === 'ground' && target && target.phase !== 'down') {
      const dx = target.x - p.x, dz = target.z - p.z, length = Math.hypot(dx, dz) || 1;
      p.motion = 'vault'; p.actionTime = 0; p.vx = dx / length * 6; p.vz = dz / length * 6;
      p.facing = Math.atan2(-dx, -dz); w.message = 'Vault! X in the air knocks the sentinel down; E retrieves its sand.'; return;
    }
    if (input.jump && p.motion === 'ground') { p.motion = 'air'; p.vy = 6; p.vx = direction.x * 5; p.vz = direction.z * 5; }
    if (input.special && p.wallCatchCooldown <= 0 && direction.z > 0.3 && p.x > 2.6 && p.x <= 3.65 && p.z > 4.5 && p.z < 16 && p.y > -0.2 && p.y < 2.2) {
      p.motion = 'wallrun'; p.actionTime = 0; p.y = Math.max(0.7, p.y); p.x = 3.15;
      w.message = 'Wall-running. Hold forward + Shift. Space kicks away; release near the far landing.'; return;
    }
    if (input.special && direction.z > 0.3 && p.z > 19.3 && p.z < 20.25 && p.x > -0.5 && p.x < 4 && p.y >= 0.9 && p.y < 2.1) {
      p.motion = 'wallrise'; p.actionTime = 0; w.message = 'Running up the wall to the high ledge.'; return;
    }
    const before = { ...p };
    if (p.motion === 'ground') {
      const speed = input.special && p.z > 32 ? 2.3 : 5;
      p.vx = direction.x * speed; p.vz = direction.z * speed;
    } else {
      // Gentle air steering preserves the momentum of wall kicks and pole releases.
      if (moving) { p.vx += (direction.x * 5 - p.vx) * 0.035; p.vz += (direction.z * Math.max(5, p.vz) - p.vz) * 0.015; }
      p.vy -= 15 * STEP;
    }
    p.x += p.vx * STEP; p.z += p.vz * STEP; p.y += p.vy * STEP;
    // Solid ledge fronts and the closed combat gate.
    if (p.z >= 20 && before.z < 20 && p.y < 3.15 && p.x >= -3 && p.x <= 4) {
      p.z = 19.7;
      if (p.motion === 'air' && p.y + 1.35 >= 3.2) { p.motion = 'ledge'; p.y = 2; p.vy = 0; w.message = 'Ledge caught. Space climbs; S drops.'; }
    }
    if (p.x > 3.2 && p.x < 4.1 && p.z > 4.5 && p.z < 17.5 && p.y < 4.5) p.x = 3.2;
    if (this.finished < 2 && p.z > 39 && p.z < 40 && p.y < 6) p.z = 39;
    const landing = platforms.find(floor => within(p, floor) && p.y <= floor.top + 0.06 && before.y >= floor.top - 0.08 && p.vy <= 0);
    if (landing) { p.y = landing.top; p.vy = 0; p.motion = 'ground'; }
    else if (p.motion === 'ground') { p.motion = 'air'; p.vy = 0; }
    if (p.motion === 'air' && Math.abs(p.z - 26.2) < 0.65 && Math.abs(p.x) < 2.6 && Math.abs(p.y + 1.65 - 5.5) < 0.5) {
      p.motion = 'pole'; p.actionTime = 0; p.vx = 0; p.vz = 0;
      w.message = 'Pole caught. Let the swing move forward, then Space to release toward the court.';
    }
  }

  private target(direction: { x: number; z: number }, moving: boolean, reach: number): Sentinel | undefined {
    const p = this.world.player;
    return this.world.enemies.filter(e => e.phase !== 'sand' && Math.abs(e.y - p.y) < 2 && distance(p, e) <= reach && (!moving || (e.x - p.x) * direction.x + (e.z - p.z) * direction.z > -0.2)).sort((a, b) => distance(p, a) - distance(p, b))[0];
  }
  private attack(direction: { x: number; z: number }, moving: boolean): void {
    const p = this.world.player, enemy = this.target(direction, moving, p.motion === 'vault' ? 3 : 2.4);
    p.strike = 0.34;
    if (!enemy || enemy.phase === 'down') return;
    p.facing = Math.atan2(enemy.x - p.x, enemy.z - p.z);
    enemy.hp -= p.counter > 0 || p.motion === 'vault' ? 3 : 1;
    if (enemy.hp <= 0) { enemy.phase = 'down'; enemy.timer = 5; this.world.message = 'Sentinel down. E retrieves its sand before it rises again.'; }
    else { enemy.phase = 'recover'; enemy.timer = 0.5; this.world.message = 'Sword strike. Keep moving, vault or block and counter.'; }
  }
  private retrieve(): boolean {
    const p = this.world.player, enemy = this.world.enemies.find(e => e.phase === 'down' && distance(p, e) < 2.8 && Math.abs(e.y - p.y) < 2);
    if (!enemy) return false;
    enemy.phase = 'sand'; this.tanks = Math.min(3, this.tanks + 1);
    this.world.message = this.finished === 2 ? 'Both sands retrieved. The bell gate is open. E at the bell.' : 'Sand retrieved: sentinel destroyed and one rewind tank refilled.';
    return true;
  }
  private sentinels(blocking: boolean): void {
    const p = this.world.player;
    for (const enemy of this.world.enemies) {
      if (enemy.phase === 'sand') continue;
      if (enemy.phase === 'down') {
        enemy.timer -= STEP;
        if (enemy.timer <= 0) { enemy.hp = 3; enemy.phase = 'approach'; this.world.message = 'Unretrieved sand reforms. Knock it down and use E.'; }
        continue;
      }
      if (p.z < 29 || Math.abs(p.y - enemy.y) > 2) continue;
      const range = distance(p, enemy);
      if (enemy.phase === 'approach') {
        if (range < 1.8) { enemy.phase = 'windup'; enemy.timer = 0.85; }
        else if (range < 10) { enemy.x += (p.x - enemy.x) / range * STEP * 1.25; enemy.z += (p.z - enemy.z) / range * STEP * 1.25; }
      } else {
        enemy.timer -= STEP;
        if (enemy.timer <= 0) {
          if (enemy.phase === 'windup') {
            if (range < 2.3) { if (blocking) { p.counter = 0.6; this.world.message = 'Blocked. X now counters for an immediate knockdown.'; } else this.hurt(); }
            enemy.phase = 'recover'; enemy.timer = 0.9;
          } else enemy.phase = 'approach';
        }
      }
    }
  }
  private hurt(): void {
    const p = this.world.player;
    if (p.hurt > 0) return;
    p.hp--; p.hurt = 1; this.world.message = 'Hit. Hold R to restore the recent world, or move out of danger.';
    if (p.hp <= 0) { this.world.dead = true; this.world.message = 'Your thread is intact. Hold R, even after death.'; }
  }
  private interact(): void {
    const p = this.world.player;
    for (const [name, point] of Object.entries(anchors) as [Anchor, Vec3][]) {
      if (distance(p, point) < 1.6 && Math.abs(p.y - point.y) < 0.25 && p.motion === 'ground') {
        this.anchor = name; p.hp = 5; this.tanks = 3; this.history = []; this.saveRevision++;
        this.world.message = 'Fountain anchor saved. Vitality and three sand tanks restored.'; return;
      }
    }
    if (this.finished === 2 && distance(p, { x: 0, y: 3.2, z: 41 }) < 2 && p.y >= 3) {
      this.world.won = true; this.saveRevision++; this.world.message = 'The meridian rings. A small route through Vey has its dawn.';
    }
  }
  restart(): void { this.world = createWorld(this.anchor); this.history = []; this.tanks = 3; this.paused = false; this.releaseRewind(); }
  newRoute(): void { this.anchor = 'departure'; this.restart(); this.saveRevision++; }
  readSave(): string { return JSON.stringify({ version: 1, anchor: this.anchor, won: this.world.won }); }
  restore(raw: string | null): boolean {
    if (!raw) return false;
    try {
      const data = JSON.parse(raw) as Record<string, unknown>;
      if (data.version !== 1 || typeof data.anchor !== 'string' || !Object.hasOwn(anchors, data.anchor) || typeof data.won !== 'boolean') return false;
      this.anchor = data.anchor as Anchor; this.restart();
      if (data.won) { this.world = createWorld('court'); this.world.enemies.forEach(e => e.phase = 'sand'); this.world.player.z = 41; this.world.won = true; this.world.message = 'Vey remembers this route’s dawn.'; }
      return true;
    } catch { return false; }
  }
}
