/**
 * Kernel contract checks (#10, #11).
 *
 * Vitest runs in Node, so there is no WebGPU device to execute the TSL kernels.
 * These tests pin the two properties that are easy to lose in a refactor and
 * impossible to catch from the node-graph structure alone:
 *
 *  1. the spawn sampler is isotropic (uniform on the sphere, not a normalized
 *     cube vector), and
 *  2. both step kernels skip motion at the origin instead of calling
 *     `normalize(vec3(0))`, while still ageing the particle.
 *
 * The same file keeps the written contract in
 * `docs/03-research/gpu-kernel-contract.md` honest: the hash indices documented
 * there must match `particleBuffers.ts`.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

function source(path: string): string {
  return readFileSync(join(REPO_ROOT, path), 'utf8');
}

const buffers = source('src/simulations/shared/particleBuffers.ts');
const attractor = source('src/simulations/shared/attractorKernel.ts');
const vortex = source('src/simulations/shared/vortexKernel.ts');
const contract = source('docs/03-research/gpu-kernel-contract.md');

test('contract: spawn direction uses a uniform sphere sampler, not a normalized cube vector', () => {
  assert.doesNotMatch(buffers, /\.sub\(0\.5\)/, 'cube-centred vector sampling biases directions toward the corners');
  assert.match(buffers, /const z = u\.mul\(2\)\.sub\(1\);/, 'z must be uniform in [-1, 1]');
  assert.match(buffers, /phi = v\.mul\(Math\.PI \* 2\)/, 'azimuth must be uniform in [0, 2π)');
  assert.match(buffers, /oneMinus\(\)\.sqrt\(\)/, 'ring radius must be sqrt(1 - z²)');
  assert.match(
    buffers,
    /vec3\(phi\.cos\(\)\.mul\(rxy\), z, phi\.sin\(\)\.mul\(rxy\)\)/,
    'direction must be built from the spherical components, not normalized',
  );
});

test('contract: radial and seed hashes use distinct, documented indices', () => {
  assert.match(buffers, /const radial = hash\(instanceIndex\.add\(2\)\)\.pow\(1 \/ 3\);/);
  assert.match(buffers, /seed\.assign\(hash\(instanceIndex\.add\(3\)\)/);
});

for (const [name, file] of [
  ['attractor', attractor],
  ['vortex', vortex],
] as const) {
  test(`contract: ${name} kernel guards the origin before normalizing`, () => {
    const guard = file.indexOf('If(distance.greaterThan(1e-6)');
    const normalize = file.indexOf('.normalize()');
    const age = file.indexOf('age.addAssign(uniforms.delta);');

    assert.ok(guard >= 0, `${name} kernel is missing the distance > 1e-6 guard`);
    assert.ok(normalize > guard, `${name} kernel normalizes outside the origin guard`);
    assert.ok(age > guard, `${name} kernel must still age particles after the guard`);
    assert.match(
      file,
      /\}\);\s*age\.addAssign\(uniforms\.delta\);/,
      `${name} kernel must increment age outside the motion guard`,
    );
  });
}

test('contract: the documented init hash indices match the implementation', () => {
  assert.match(contract, /hash\(i\)/, 'docs must describe the z/y hash');
  assert.match(contract, /hash\(i\+1\)/, 'docs must describe the azimuth hash');
  assert.match(contract, /hash\(i\+2\)/, 'docs must describe the radial hash');
  assert.match(contract, /hash\(i\+3\)/, 'docs must describe the seed hash');
  assert.doesNotMatch(contract, /hash\(i\+4\)/, 'docs must not document a stale radial index');
});

test('contract: the documentation records the origin guard', () => {
  assert.match(contract, /1e-6/, 'docs must mention the same epsilon as the reference step');
});
