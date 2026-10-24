import { expect, test } from 'vitest';
import { createParticleBuffers } from '../../src/simulations/shared/particleBuffers.ts';
import { createAttractorKernel } from '../../src/simulations/shared/attractorKernel.ts';
import { DEFAULT_ATTRACTOR_DAMPING, DEFAULT_ATTRACTOR_RADIUS } from '../../src/simulations/simulation.ts';
import { DEFAULT_SPAWN_RADIUS } from '../../src/simulations/shared/attributes.ts';

test('attractor buffers use the shared layout and reference defaults', () => {
  const system = createParticleBuffers(8);

  expect(system.count).toBe(8);
  expect(system.initKernel.name).toBe('Init Particles');
  expect(system.uniforms.spawnRadius.value).toBe(DEFAULT_SPAWN_RADIUS);
  expect(system.uniforms.radius.value).toBe(DEFAULT_ATTRACTOR_RADIUS);
  expect(system.uniforms.damping.value).toBe(DEFAULT_ATTRACTOR_DAMPING);
  expect(system.uniforms.delta.value).toBe(0);
});

test('attractor kernel is a named compute node over the shared buffers', () => {
  const system = createParticleBuffers(8);
  const kernel = createAttractorKernel(system);

  expect(kernel.name).toBe('Attractor');
});

test('invalid particle count is rejected before a GPU buffer exists', () => {
  expect(() => createParticleBuffers(0)).toThrow(TypeError);
  expect(() => createParticleBuffers(1.5)).toThrow(TypeError);
});
