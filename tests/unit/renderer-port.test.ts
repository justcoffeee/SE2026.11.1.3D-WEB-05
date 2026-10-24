/**
 * Contract test for RendererPort, driven by a test double.
 *
 * The point is not to test the fake: it is to prove that the UI and the perf
 * collector can be written against the interface alone, and that `actual`
 * comes from the engine rather than from what was requested.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../../src/presets/preset.ts';
import type { RendererPort, RendererTarget } from '../../src/core/renderer/RendererPort.ts';
import { FakeRenderer } from '../support/fakeRenderer.ts';

const TARGET: RendererTarget = { width: 800, height: 600, pixelRatio: 1 };

test('port contract: init reports the backend the engine ran, not the requested one', async () => {
  const port: RendererPort = new FakeRenderer({ actual: 'webgl2' });

  const actual = await port.init(TARGET);

  assert.equal(actual, 'webgl2');
  assert.equal(port.getStatus().actual, 'webgl2');
  assert.equal(port.getStatus().requested, 'auto');
});

test('port contract: an unavailable backend never reports gpu timing', async () => {
  const port: RendererPort = new FakeRenderer({ actual: 'unavailable' });
  await port.init(TARGET);
  port.start();

  const status = port.getStatus();

  assert.equal(status.actual, 'unavailable');
  assert.equal(status.gpuTimingAvailable, false);
  assert.equal(status.gpuTimeMs, null);
  assert.equal(status.fps, null);
});

test('port contract: applyConfig accepts the preset config unchanged and does not retain it after reset', async () => {
  const fake = new FakeRenderer({ actual: 'webgpu' });
  const port: RendererPort = fake;
  await port.init(TARGET);

  port.applyConfig({ ...DEFAULT_CONFIG, particleCount: 50000 });
  assert.equal(fake.lastConfig?.particleCount, 50000);

  port.reset();
  assert.equal(fake.lastConfig, null);
});

test('fake: status is configurable and every call is recorded in order', async () => {
  const fake = new FakeRenderer({
    requested: 'webgl2',
    actual: 'webgpu',
    running: true,
    gpuTimingAvailable: true,
    fps: 60,
    gpuTimeMs: 2.5,
  });

  const status = fake.getStatus();
  assert.equal(status.requested, 'webgl2');
  assert.equal(status.actual, 'webgpu');
  assert.equal(status.running, true);
  assert.equal(status.gpuTimingAvailable, true);
  assert.equal(status.fps, 60);
  assert.equal(status.gpuTimeMs, 2.5);

  await fake.init(TARGET);
  fake.applyConfig(DEFAULT_CONFIG);
  fake.pause();
  fake.start();
  fake.reset();
  fake.dispose();
  fake.dispose();

  assert.deepEqual(
    fake.calls.map((call) => call.type),
    ['getStatus', 'init', 'applyConfig', 'pause', 'start', 'reset', 'dispose', 'dispose'],
  );
  assert.deepEqual(fake.calls[1], { type: 'init', target: TARGET });
  assert.deepEqual(fake.calls[2], { type: 'applyConfig', config: DEFAULT_CONFIG });
  assert.equal(fake.disposed, true);
});
