import assert from 'node:assert/strict';
import { test } from 'vitest';
import {
  probeBackendCapabilities,
  resolveBackend,
  type BackendCapabilities,
} from '../../src/simulations/backend/capabilities.ts';

const cases: ReadonlyArray<{
  readonly preference: 'auto' | 'webgpu' | 'webgl2';
  readonly capabilities: BackendCapabilities;
  readonly expected: 'webgpu' | 'webgl2' | 'unavailable';
}> = [
  { preference: 'auto', capabilities: { webgpu: true, webgl2: true }, expected: 'webgpu' },
  { preference: 'auto', capabilities: { webgpu: true, webgl2: false }, expected: 'webgpu' },
  { preference: 'auto', capabilities: { webgpu: false, webgl2: true }, expected: 'webgl2' },
  { preference: 'auto', capabilities: { webgpu: false, webgl2: false }, expected: 'unavailable' },
  { preference: 'webgpu', capabilities: { webgpu: true, webgl2: true }, expected: 'webgpu' },
  { preference: 'webgpu', capabilities: { webgpu: true, webgl2: false }, expected: 'webgpu' },
  { preference: 'webgpu', capabilities: { webgpu: false, webgl2: true }, expected: 'webgl2' },
  { preference: 'webgpu', capabilities: { webgpu: false, webgl2: false }, expected: 'unavailable' },
  { preference: 'webgl2', capabilities: { webgpu: true, webgl2: true }, expected: 'webgl2' },
  { preference: 'webgl2', capabilities: { webgpu: true, webgl2: false }, expected: 'unavailable' },
  { preference: 'webgl2', capabilities: { webgpu: false, webgl2: true }, expected: 'webgl2' },
  { preference: 'webgl2', capabilities: { webgpu: false, webgl2: false }, expected: 'unavailable' },
];

for (const { preference, capabilities, expected } of cases) {
  test(`resolveBackend(${preference}, ${JSON.stringify(capabilities)}) → ${expected}`, () => {
    assert.equal(resolveBackend(preference, capabilities), expected);
  });
}

test('probeBackendCapabilities injects async WebGPU and sync WebGL2 probes', async () => {
  let webgpuCalls = 0;
  let webgl2Calls = 0;

  const capabilities = await probeBackendCapabilities({
    webgpu: async () => {
      webgpuCalls += 1;
      return true;
    },
    webgl2: () => {
      webgl2Calls += 1;
      return false;
    },
  });

  assert.deepEqual(capabilities, { webgpu: true, webgl2: false });
  assert.equal(webgpuCalls, 1);
  assert.equal(webgl2Calls, 1);
});

test('a rejected probe marks only that backend unavailable', async () => {
  const capabilities = await probeBackendCapabilities({
    webgpu: async () => {
      throw new Error('adapter request failed');
    },
    webgl2: () => true,
  });

  assert.deepEqual(capabilities, { webgpu: false, webgl2: true });
  assert.equal(resolveBackend('auto', capabilities), 'webgl2');
});
