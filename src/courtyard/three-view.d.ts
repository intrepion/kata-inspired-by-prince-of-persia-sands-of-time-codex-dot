import type { Courtyard } from './engine';
import type { Camera } from './render';
export function createCourtyardThree(canvas: HTMLCanvasElement): { render(game: Courtyard, camera: Camera, width: number, height: number): void; dispose(): void };
