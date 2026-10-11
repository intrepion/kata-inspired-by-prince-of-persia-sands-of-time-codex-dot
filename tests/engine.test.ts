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
