import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import {
  createState,
  PARTICLE_ATTRIBUTES,
  type ParticleState,
  type SimulationConfig,
} from '../../src/simulations/shared/attributes.ts';
import { step } from '../../src/simulations/simulation.ts';

const config: SimulationConfig = {
  mode: 'attractor',
  particleCount: 64,
  speed: 1.25,
  strength: 2,
  spawnRadius: 5,
  attractorRadius: 3,
  attractorDamping: 0.98,
};

const snapshot = (state: ParticleState) => ({
  positions: Array.from(state.positions),
  velocities: Array.from(state.velocities),
  ages: Array.from(state.ages),
  seeds: Array.from(state.seeds),
});

test('layout exposes one shared attribute set for both backends', () => {
  expect(PARTICLE_ATTRIBUTES.position.itemSize).toBe(3);
  expect(PARTICLE_ATTRIBUTES.velocity.itemSize).toBe(3);
  expect(PARTICLE_ATTRIBUTES.age.itemSize).toBe(1);
  expect(PARTICLE_ATTRIBUTES.seed.itemSize).toBe(1);
  expect(PARTICLE_ATTRIBUTES.position.array).toBe('positions');
});

test('same config and seed produce identical initial state', () => {
  expect(snapshot(createState(config, 42))).toEqual(snapshot(createState(config, 42)));
  expect(snapshot(createState(config, 42))).not.toEqual(snapshot(createState(config, 43)));
});

test('step is deterministic and advances age by dt * speed', () => {
  const first = createState(config, 7);
  const second = createState(config, 7);

  for (let i = 0; i < 10; i += 1) {
    step(first, 0.1, config);
    step(second, 0.1, config);
  }

  expect(snapshot(first)).toEqual(snapshot(second));
  expect(first.ages[0]).toBeCloseTo(1.25, 5);
});

test('both modes stay finite, including a particle at the origin', () => {
  for (const mode of ['attractor', 'vortex'] as const) {
    const state = createState({ ...config, mode }, 3);
    state.positions[0] = 0;
    state.positions[1] = 0;
    state.positions[2] = 0;

    for (let i = 0; i < 120; i += 1) step(state, 1 / 60, { ...config, mode });

    expect(Array.from(state.positions).every(Number.isFinite)).toBe(true);
    expect(Array.from(state.velocities).every(Number.isFinite)).toBe(true);
    expect(Array.from(state.ages).every(Number.isFinite)).toBe(true);
  }
});

test('attractor and vortex diverge after the same number of steps', () => {
  const attractor = createState(config, 11);
  const vortex = createState({ ...config, mode: 'vortex' }, 11);

  for (let i = 0; i < 20; i += 1) {
    step(attractor, 1 / 60, config);
    step(vortex, 1 / 60, { ...config, mode: 'vortex' });
  }

  expect(snapshot(attractor).positions).not.toEqual(snapshot(vortex).positions);
});

test('invalid input is rejected at the state boundary', () => {
  expect(() => createState({ ...config, particleCount: 1.5 })).toThrow(TypeError);
  expect(() => createState({ ...config, speed: 0 })).toThrow(TypeError);
  expect(() => step(createState(config), Number.NaN, config)).toThrow(TypeError);
  expect(() => step(createState(config), -1, config)).toThrow(TypeError);
});

test('step actually moves particles in both modes', () => {
  for (const mode of ['attractor', 'vortex'] as const) {
    const modeConfig = { ...config, mode };
    const state = createState(modeConfig, 11);
    const before = Array.from(state.positions);
    for (let i = 0; i < 30; i += 1) step(state, 1 / 60, modeConfig);
    expect(Array.from(state.positions)).not.toEqual(before);
  }
});

test('strength = 0 keeps positions unchanged while age still advances', () => {
  for (const mode of ['attractor', 'vortex'] as const) {
    const stillConfig = { ...config, mode, strength: 0 };
    const state = createState(stillConfig, 5);
    const before = Array.from(state.positions);

    for (let i = 0; i < 60; i += 1) step(state, 1 / 60, stillConfig);

    expect(Array.from(state.positions)).toEqual(before);
    expect(state.ages[0]).toBeCloseTo((60 / 60) * stillConfig.speed, 5);
  }
});

test('reference step does not import DOM or three', () => {
  for (const file of ['src/simulations/simulation.ts', 'src/simulations/shared/attributes.ts']) {
    const source = readFileSync(file, 'utf8');
    expect(source).not.toMatch(/from\s+['"]three/);
    expect(source).not.toMatch(/\b(document|window)\b/);
  }
});

test('golden values give the kernels a numeric baseline', () => {
  const goldenConfig: SimulationConfig = {
    mode: 'attractor',
    particleCount: 4,
    speed: 1,
    strength: 1,
    spawnRadius: 1,
    attractorRadius: 1,
  };
  const attractor = createState(goldenConfig, 123);
  for (let i = 0; i < 60; i += 1) step(attractor, 1 / 60, goldenConfig);

  const vortexConfig: SimulationConfig = { ...goldenConfig, mode: 'vortex' };
  const vortex = createState(vortexConfig, 123);
  for (let i = 0; i < 60; i += 1) step(vortex, 1 / 60, vortexConfig);

  expect(attractor.positions[0]).toBeCloseTo(-0.24403072893619537, 6);
  expect(attractor.positions[1]).toBeCloseTo(-0.5086816549301147, 6);
  expect(attractor.positions[2]).toBeCloseTo(-0.6391481757164001, 6);
  expect(attractor.velocities[0]).toBeCloseTo(-0.7608172297477722, 6);
  expect(attractor.velocities[2]).toBeCloseTo(-0.021382778882980347, 6);

  expect(vortex.positions[0]).toBeCloseTo(-0.17511485517024994, 6);
  expect(vortex.positions[2]).toBeCloseTo(-0.6317195892333984, 6);
  expect(vortex.velocities[0]).toBeCloseTo(-0.5698951482772827, 6);
  expect(vortex.velocities[2]).toBeCloseTo(-0.016484029591083527, 6);
});
