import { describe, expect, it } from 'vitest';
import { Courtyard, idle, type Controls } from '../src/courtyard/engine';

function hold(game: Courtyard, frames: number, input: Partial<Controls> = {}): void {
  for (let frame = 0; frame < frames; frame++) game.step({ ...idle, ...input });
}
function until(game: Courtyard, condition: () => boolean, input: Partial<Controls>, limit = 300): void {
  for (let frame = 0; frame < limit && !condition(); frame++) hold(game, 1, input);
  expect(condition(), JSON.stringify(game.world.player)).toBe(true);
}
function traverse(game: Courtyard): void {
  hold(game, 36, { right: 1 });
  hold(game, 60, { forward: 1 });
  until(game, () => game.world.ledgeDone, { forward: 1, special: true });
  expect(game.world.wallrunDone).toBe(true);
  hold(game, 38, { right: -1 });
  hold(game, 32, { forward: 1 });
  hold(game, 1, { forward: 1, jump: true });
  until(game, () => game.world.player.motion === 'pole', { forward: 1 }, 100);
  hold(game, 25);
  hold(game, 1, { forward: 1, jump: true });
  until(game, () => game.world.player.motion === 'ground', { forward: 1 }, 150);
}

describe('Courtyard player-facing mechanics', () => {
  it('uses camera-relative movement in a genuine third dimension', () => {
    const game = new Courtyard();
    hold(game, 24, { forward: 1, yaw: Math.PI / 2 });
    expect(game.world.player.x).toBeCloseTo(2);
    expect(game.world.player.z).toBeCloseTo(0);
  });

  it('completes the wall, ledge, pole, two-sentinel fight and bell using gameplay controls alone', () => {
    const game = new Courtyard();
    traverse(game);
    expect(game.world.player.z).toBeGreaterThan(30);
    expect(game.world.player.y).toBeCloseTo(3.2);
    expect(game.world.poleDone).toBe(true);
    expect(game.world.dead).toBe(false);
    for (let frame = 0; frame < 1000 && game.finished < 2 && !game.world.dead; frame++) {
      const downed = game.world.enemies.some(enemy => enemy.phase === 'down');
      hold(game, 1, { special: true, dagger: downed, attack: !downed && game.world.player.counter > 0 && game.world.player.strike <= 0 });
    }
    expect(game.finished).toBe(2);
    expect(game.world.player.hp).toBe(5);
    hold(game, 71, { forward: 1 }); hold(game, 1, { dagger: true });
    expect(game.world.won).toBe(true);
  });

  it('makes an ordinary jump insufficient for the first aqueduct gap', () => {
    const game = new Courtyard();
    hold(game, 78, { forward: 1 });
    hold(game, 1, { forward: 1, jump: true });
    hold(game, 180, { forward: 1 });
    expect(game.world.dead).toBe(true);
    expect(game.world.wallrunDone).toBe(false);
  });

  it('kicks away from a wall while special remains held instead of immediately reattaching', () => {
    const game = new Courtyard();
    hold(game, 36, { right: 1 }); hold(game, 60, { forward: 1 });
    hold(game, 30, { forward: 1, special: true });
    expect(game.world.player.motion).toBe('wallrun');
    const before = { ...game.world.player };
    hold(game, 1, { forward: 1, special: true, jump: true });
    expect(game.world.player.motion).toBe('air');
    expect(game.world.player.x).toBeLessThan(before.x);
    expect(game.world.player.z).toBeGreaterThan(before.z);
    expect(game.world.player.vy).toBeGreaterThan(0);
    hold(game, 12, { forward: 1, special: true });
    expect(game.world.player.motion).toBe('air');
    expect(game.world.player.x).toBeLessThan(2.6);
  });

  it('rewinds a fatal fall and trap phase for one tank per hold, then branches', () => {
    const game = new Courtyard();
    hold(game, 200, { forward: 1 });
    expect(game.world.dead).toBe(true);
    const failedTick = game.world.tick;
    hold(game, 55, { rewind: true });
    expect(game.world.dead).toBe(false);
    expect(game.world.tick).toBeLessThan(failedTick);
    expect(game.tanks).toBe(2);
    hold(game, 10, { rewind: true });
    expect(game.tanks).toBe(2);
    hold(game, 1);
    const branchedTick = game.world.tick;
    hold(game, 5, { right: 1 });
    expect(game.world.tick).toBe(branchedTick + 5);
    hold(game, 1, { rewind: true });
    expect(game.tanks).toBe(1);
  });

  it('requires dagger retrieval after sword knockdown and refills one spent tank', () => {
    const game = new Courtyard();
    expect(game.restore('{"version":1,"anchor":"court","won":false}')).toBe(true);
    game.tanks = 1;
    const enemy = game.world.enemies[0];
    enemy.x = -0.8; enemy.z = 34;
    hold(game, 1, { attack: true }); hold(game, 21, { special: true });
    hold(game, 1, { attack: true }); hold(game, 21, { special: true });
    hold(game, 1, { attack: true });
    expect(enemy.phase).toBe('down');
    expect(game.finished).toBe(0);
    hold(game, 1, { dagger: true });
    expect(game.finished).toBe(1);
    expect(game.tanks).toBe(2);
    hold(game, 1, { rewind: true });
    expect(game.finished).toBe(0);
    expect(game.tanks).toBe(1);
  });

  it('blocks a telegraphed attack and offers a counter knockdown', () => {
    const game = new Courtyard();
    game.restore('{"version":1,"anchor":"court","won":false}');
    const enemy = game.world.enemies[0]; enemy.x = 0; enemy.z = 34;
    until(game, () => game.world.player.counter > 0, { special: true });
    expect(game.world.player.hp).toBe(5);
    hold(game, 1, { special: true, attack: true });
    expect(enemy.phase).toBe('down');
  });

  it('makes unfinished sentinels rise again and prevents bell completion while one remains', () => {
    const game = new Courtyard();
    game.restore('{"version":1,"anchor":"court","won":false}');
    const enemy = game.world.enemies[0]; enemy.phase = 'down'; enemy.hp = 0; enemy.timer = 0.1;
    hold(game, 8, { special: true });
    expect(enemy.phase).toBe('approach');
    expect(enemy.hp).toBe(3);
    hold(game, 120, { forward: 1, special: true });
    expect(game.world.player.z).toBeLessThanOrEqual(39);
    hold(game, 1, { dagger: true });
    expect(game.world.won).toBe(false);
  });

  it('allows a vault attack into a sand retrieval without facing the enemy first', () => {
    const game = new Courtyard();
    game.restore('{"version":1,"anchor":"court","won":false}');
    const enemy = game.world.enemies[0]; enemy.x = 0; enemy.z = 34.5;
    hold(game, 1, { forward: 1, jump: true });
    expect(game.world.player.motion).toBe('vault');
    hold(game, 8); hold(game, 1, { attack: true });
    expect(enemy.phase).toBe('down');
    hold(game, 1, { dagger: true });
    expect(game.finished).toBe(1);
  });

  it('validates isolated fountain saves and restores a fresh attempt or completed route', () => {
    const game = new Courtyard();
    for (const raw of [null, '{}', 'null', '{"version":1,"anchor":"__proto__","won":false}', '{"version":1,"anchor":"court","won":"yes"}']) expect(game.restore(raw)).toBe(false);
    game.restore('{"version":1,"anchor":"gallery","won":false}');
    expect(game.world.player.z).toBe(21.5);
    expect(game.world.enemies.every(enemy => enemy.hp === 3)).toBe(true);
    expect(game.tanks).toBe(3);
    expect(game.history).toHaveLength(0);
    expect(game.restore('{"version":1,"anchor":"court","won":true}')).toBe(true);
    expect(game.world.won).toBe(true);
    expect(game.finished).toBe(2);
  });
});
