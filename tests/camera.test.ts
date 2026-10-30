import { describe, it, expect } from 'vitest';
import { cameraFraction } from '../src/courtyard/camera';
describe('courtyard camera wall collision', () => {
  it('pulls the camera before the wall and leaves clear sightlines unchanged', () => {
    expect(cameraFraction({x: 2, y: 2, z: 10}, {x: 7, y: 2, z: 10})).toBeLessThan(.4);
    expect(cameraFraction({x: 0, y: 2, z: 10}, {x: -5, y: 5, z: 10})).toBe(1);
    expect(cameraFraction({x: 0, y: 6, z: 10}, {x: 7, y: 6, z: 10})).toBe(1);
  });
});
