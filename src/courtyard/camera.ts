import type { Vec3 } from './engine';

type Box = { min: Vec3; max: Vec3 };
// The two substantial route walls, matching the geometry in the renderer.
const walls: Box[] = [
  { min: { x: 3.55, y: -1, z: 4.5 }, max: { x: 4.1, y: 5, z: 17.5 } },
  { min: { x: -.5, y: 1.02, z: 19.85 }, max: { x: 4, y: 3.17, z: 20 } },
];
/** Pull the eye in front of a wall intersecting the focus-to-eye segment. */
export function cameraFraction(focus: Vec3, eye: Vec3): number {
  let closest = 1;
  for (const wall of walls) {
    let enter = 0, exit = 1;
    let startsInside = true;
    for (const axis of ['x', 'y', 'z'] as const) {
      const min = wall.min[axis] - .15, max = wall.max[axis] + .15;
      const start = focus[axis], delta = eye[axis] - start;
      if (start < min || start > max) startsInside = false;
      if (Math.abs(delta) < 1e-9) { if (start < min || start > max) { enter = 2; break; } continue; }
      const a = (min - start) / delta, b = (max - start) / delta;
      enter = Math.max(enter, Math.min(a, b)); exit = Math.min(exit, Math.max(a, b));
    }
    if (!startsInside && enter <= exit && enter >= 0 && enter < closest) closest = Math.max(.12, enter - .03);
  }
  return closest;
}
