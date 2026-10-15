import { Courtyard, platforms, type Vec3 } from './engine';
interface Face { points: Vec3[]; color: string; stroke?: string }
interface Screen { x: number; y: number; depth: number }
export interface Camera { yaw: number; height: number; overview: boolean }

/** Perspective projection of a real XYZ world, with near-plane clipping and depth-sorted solid faces. */
export class CourtyardRenderer {
  private ctx: CanvasRenderingContext2D;
  private faces: Face[] = [];
  private eye: Vec3 = { x: 0, y: 5, z: -8 };
  private yaw = 0;
  private pitch = 0;
  constructor(private canvas: HTMLCanvasElement) { this.ctx = canvas.getContext('2d')!; }

  draw(game: Courtyard, camera: Camera, seconds: number): void {
    const c = this.ctx, w = this.canvas.width, h = this.canvas.height, p = game.world.player;
    this.yaw = camera.yaw;
    const distance = camera.overview ? 19 : 8;
    const elevation = camera.overview ? 16 : camera.height;
    this.eye = { x: p.x - Math.sin(camera.yaw) * distance, y: p.y + elevation, z: p.z - Math.cos(camera.yaw) * distance };
    this.pitch = Math.atan2(1.1 - elevation, distance);
    const sky = c.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#172f43'); sky.addColorStop(0.6, '#53696f'); sky.addColorStop(1, '#142733');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    // Distant skyline stays in world space as the player orbits.
    this.faces = [];
    for (let index = 0; index < 16; index++) {
      const x = index % 2 ? -18 - index % 4 : 17 + index % 3;
      this.box(x, -9, index * 4 - 6, 3, 10 + index % 5 * 2, 3, '#334a55');
    }
    for (const floor of platforms) {
      this.box(floor.x, floor.top - 1.2, floor.z, floor.width, 1.2, floor.depth, '#7b8175', '#c7c09e');
      for (let z = floor.z; z < floor.z + floor.depth; z += 2) this.box(floor.x + 0.08, floor.top + 0.005, z, floor.width - 0.16, 0.015, 0.035, '#c6bc99');
      this.box(floor.x, floor.top, floor.z, 0.12, 0.2, floor.depth, '#b4ab88');
      this.box(floor.x + floor.width - 0.12, floor.top, floor.z, 0.12, 0.2, floor.depth, '#b4ab88');
    }
    this.box(3.55, -1, 4.5, 0.55, 6, 13, '#b2a78b', '#ddc99c');
    for (let z = 5; z < 17; z += 1.1) this.box(3.49, 1.1, z, 0.06, 0.14, 0.65, '#f6c875');
    this.box(-0.5, 1.02, 19.85, 4.5, 2.15, 0.15, '#9f957b');
    this.box(-0.5, 3.19, 19.72, 4.5, 0.14, 0.33, '#f4cf82');
    // Hanging pole, braces and safe landing markers.
    this.box(-2.8, 5.45, 26.13, 5.6, 0.12, 0.14, '#e9c475');
    this.box(-2.9, 1, 26.1, 0.15, 4.6, 0.2, '#555e61');
    this.box(2.75, 1, 26.1, 0.15, 4.6, 0.2, '#555e61');
    for (const point of [{ x: 0, y: 0, z: 0 }, { x: 0, y: 3.2, z: 21.5 }, { x: 0, y: 3.2, z: 33 }]) {
      this.box(point.x - 0.6, point.y, point.z - 0.45, 1.2, 0.22, 0.9, '#4aa4ad');
      this.box(point.x - 0.22, point.y + 0.2, point.z - 0.18, 0.44, 0.5, 0.36, '#b5f3dc');
    }
    this.box(-4.7, 6.8, 31.6, 9.4, 0.12, 0.16, '#777a72');
    this.box(game.bladeX - 0.08, 3.3, 31.6, 0.16, 3.5, 0.16, '#f0ab7d');
    this.box(game.bladeX - 0.45, 3.5, 31.57, 0.9, 0.9, 0.22, '#dfbd98');
    if (game.finished < 2) for (let x = -4.5; x <= 4.5; x += 0.75) this.box(x, 3.2, 39.2, 0.09, 3.2, 0.12, '#c3a677');
    this.box(-0.9, 3.2, 40.5, 1.8, 0.4, 1.2, '#b6a980');
    this.box(-0.13, 3.6, 40.9, 0.26, 2.5, 0.26, '#d7bf80');
    this.box(-0.65, 5.4, 40.6, 1.3, 1, 0.8, '#e6c882');
    for (const enemy of game.world.enemies) {
      if (enemy.phase === 'sand') continue;
      const down = enemy.phase === 'down';
      this.actor(enemy, enemy.phase === 'windup' ? '#ffd36d' : '#9d6c66', 0, down, seconds, false);
      if (down) this.box(enemy.x - 0.16, enemy.y + 0.5, enemy.z - 0.16, 0.32, 0.3 + Math.sin(seconds * 6) * 0.1, 0.32, '#9fe7dd');
    }
    this.actor(p, p.hurt > 0 && Math.floor(seconds * 14) % 2 ? '#f2d3c0' : '#73c4c3', p.facing, game.world.dead, seconds, p.motion === 'pole' || p.motion === 'ledge');
    if (p.strike > 0) {
      const angle = p.facing + (p.strike / 0.34 - 0.5) * 2.7;
      this.box(p.x + Math.sin(angle) * 0.5 - 0.05, p.y + 0.9, p.z + Math.cos(angle) * 0.5 - 0.05, Math.abs(Math.sin(angle)) * 1.1 + 0.09, 0.08, Math.abs(Math.cos(angle)) * 1.1 + 0.09, '#f3e4b9');
    }
    this.paint();
    this.label({ x: 3.3, y: 3.9, z: 8.5 }, '01  WALL RUN', '#ffe0a2');
    this.label({ x: 1.7, y: 4, z: 20 }, '02  CATCH & CLIMB', '#ffe0a2');
    this.label({ x: 0, y: 6.3, z: 26.2 }, '03  SWING & RELEASE', '#ffe0a2');
    if (p.z > 28) this.label({ x: 0, y: 6.8, z: 39.2 }, game.finished < 2 ? 'RETRIEVE BOTH SANDS' : 'BELL GATE OPEN', '#ffe0a2');
    if (game.rewinding) { c.fillStyle = '#8fdfe424'; c.fillRect(0, 0, w, h); c.strokeStyle = '#b6f7ec'; c.lineWidth = 5; c.strokeRect(3, 3, w - 6, h - 6); }
    c.fillStyle = '#102631a8'; c.fillRect(16, h - 61, 325, 45); c.fillStyle = '#e8e5d1'; c.font = '13px system-ui';
    c.fillText(`COURIER  ${p.motion.toUpperCase()}  ·  ${Math.round(p.z)}m`, 29, h - 39);
    c.fillStyle = '#9cc7c9'; c.fillText('Arrow keys / drag: orbit   ·   Q: overview', 29, h - 21);
  }

  private actor(p: Vec3, color: string, facing: number, down: boolean, seconds: number, hanging: boolean): void {
    if (down) { this.box(p.x - 0.65, p.y + 0.1, p.z - 0.3, 1.3, 0.3, 0.6, color); return; }
    const leg = Math.sin(seconds * 10 + p.z) * 0.14;
    this.box(p.x - 0.3, p.y + 0.52, p.z - 0.22, 0.6, 0.65, 0.44, color);
    this.box(p.x - 0.2, p.y + 1.18, p.z - 0.2, 0.4, 0.42, 0.4, '#e2bb94');
    this.box(p.x - 0.27, p.y, p.z - 0.15 + leg, 0.2, 0.55, 0.3, '#263b49');
    this.box(p.x + 0.07, p.y, p.z - 0.15 - leg, 0.2, 0.55, 0.3, '#263b49');
    this.box(p.x - 0.45, p.y + (hanging ? 1 : 0.55), p.z - 0.12, 0.16, hanging ? 0.9 : 0.5, 0.22, '#d8b58f');
    this.box(p.x + 0.29, p.y + (hanging ? 1 : 0.55), p.z - 0.12, 0.16, hanging ? 0.9 : 0.5, 0.22, '#d8b58f');
    this.box(p.x + Math.sin(facing) * 0.24 - 0.09, p.y + 1.3, p.z + Math.cos(facing) * 0.24 - 0.09, 0.18, 0.13, 0.18, '#f6d8ab');
  }
  private box(x: number, y: number, z: number, width: number, height: number, depth: number, color: string, stroke?: string): void {
    const a = { x, y, z }, b = { x: x + width, y, z }, c = { x: x + width, y, z: z + depth }, d = { x, y, z: z + depth };
    const e = { ...a, y: y + height }, f = { ...b, y: y + height }, g = { ...c, y: y + height }, h = { ...d, y: y + height };
    for (const points of [[e, f, g, h], [a, b, f, e], [b, c, g, f], [c, d, h, g], [d, a, e, h]]) this.faces.push({ points, color, stroke });
  }
  private view(point: Vec3): Screen {
    const dx = point.x - this.eye.x, dy = point.y - this.eye.y, dz = point.z - this.eye.z;
    const horizontal = dx * Math.sin(this.yaw) + dz * Math.cos(this.yaw);
    return { x: dx * Math.cos(this.yaw) - dz * Math.sin(this.yaw), y: dy * Math.cos(this.pitch) - horizontal * Math.sin(this.pitch), depth: horizontal * Math.cos(this.pitch) + dy * Math.sin(this.pitch) };
  }
  private clip(points: Screen[]): Screen[] {
    const result: Screen[] = [];
    for (let i = 0; i < points.length; i++) {
      const current = points[i], previous = points[(i + points.length - 1) % points.length];
      if ((current.depth >= 0.2) !== (previous.depth >= 0.2)) {
        const fraction = (0.2 - previous.depth) / (current.depth - previous.depth);
        result.push({ x: previous.x + (current.x - previous.x) * fraction, y: previous.y + (current.y - previous.y) * fraction, depth: 0.2 });
      }
      if (current.depth >= 0.2) result.push(current);
    }
    return result;
  }
  private paint(): void {
    const c = this.ctx, w = this.canvas.width, h = this.canvas.height, focal = h * 0.95;
    const faces = this.faces.map(face => ({ ...face, points: this.clip(face.points.map(p => this.view(p))) })).filter(face => face.points.length >= 3);
    faces.sort((a, b) => b.points.reduce((sum, p) => sum + p.depth, 0) / b.points.length - a.points.reduce((sum, p) => sum + p.depth, 0) / a.points.length);
    for (const face of faces) {
      c.beginPath(); face.points.forEach((point, index) => { const x = w / 2 + point.x / point.depth * focal, y = h * 0.49 - point.y / point.depth * focal; if (index === 0) c.moveTo(x, y); else c.lineTo(x, y); }); c.closePath();
      c.fillStyle = face.color; c.fill(); c.strokeStyle = face.stroke ?? '#162c3535'; c.lineWidth = 0.7; c.stroke();
    }
  }
  private label(point: Vec3, text: string, color: string): void {
    const v = this.view(point); if (v.depth < 1 || v.depth > 34) return;
    const c = this.ctx, scale = this.canvas.height * 0.95, x = this.canvas.width / 2 + v.x / v.depth * scale, y = this.canvas.height * 0.49 - v.y / v.depth * scale;
    c.font = 'bold 12px system-ui'; const width = c.measureText(text).width;
    c.fillStyle = '#102631d9'; c.fillRect(x - width / 2 - 8, y - 16, width + 16, 23); c.fillStyle = color; c.textAlign = 'center'; c.fillText(text, x, y); c.textAlign = 'left';
  }
}
