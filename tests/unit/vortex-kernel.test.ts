import { expect, test } from 'vitest';
import { createParticleBuffers } from '../../src/simulations/shared/particleBuffers.ts';
import { createAttractorKernel } from '../../src/simulations/shared/attractorKernel.ts';
import { createVortexKernel } from '../../src/simulations/shared/vortexKernel.ts';
import { DEFAULT_VORTEX_DAMPING } from '../../src/simulations/simulation.ts';

test('vortex kernel is a named compute node over the shared buffers', () => {
  const system = createParticleBuffers(8);
  const kernel = createVortexKernel(system);

  expect(kernel.name).toBe('Vortex');
  expect(kernel.isComputeNode).toBe(true);
  expect(kernel.count).toBe(8);
});

test('vortex has its own damping uniform so the adapter cannot inherit the attractor value', () => {
  const system = createParticleBuffers(8);

  expect(system.uniforms.vortexDamping.value).toBe(DEFAULT_VORTEX_DAMPING);
  system.uniforms.damping.value = 0.5;
  expect(system.uniforms.vortexDamping.value).toBe(DEFAULT_VORTEX_DAMPING);
});

test('vortex and attractor kernels stay distinct over the same buffers', () => {
  const system = createParticleBuffers(8);

  const vortex = createVortexKernel(system);
  const attractor = createAttractorKernel(system);

  expect(vortex.name).toBe('Vortex');
  expect(attractor.name).toBe('Attractor');
  expect(vortex.name).not.toBe(attractor.name);
});
