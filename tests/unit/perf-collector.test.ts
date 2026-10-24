import assert from 'node:assert/strict';
import { afterEach, test, vi } from 'vitest';
import { configHash } from '../../src/core/measurement/configHash.ts';
import type { PerformanceSnapshot } from '../../src/core/types/measurement.ts';
import { PerformanceCollector } from '../../src/perf/collector.ts';
import { DEFAULT_CONFIG } from '../../src/presets/preset.ts';
import { FakeRenderer } from '../support/fakeRenderer.ts';

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Flushes the collector's async `configHash` without moving the fake clock.
 * `vi.waitFor` would advance timers and fire extra sampling intervals, which
 * makes the sample count depend on machine load.
 */
async function flushSamples(samples: PerformanceSnapshot[], expected: number): Promise<void> {
  for (let attempt = 0; attempt < 100 && samples.length < expected; attempt += 1) {
    await vi.advanceTimersByTimeAsync(0);
  }
  assert.equal(samples.length, expected);
}

test('samples the actual backend after warm-up at a fixed cadence', async () => {
  vi.useFakeTimers();
  const port = new FakeRenderer({
    actual: 'webgl2',
    running: true,
    gpuTimingAvailable: true,
    fps: 58.5,
    gpuTimeMs: 3.25,
  });
  const samples: PerformanceSnapshot[] = [];
  const collector = new PerformanceCollector(port, {
    warmUpMs: 100,
    cadenceMs: 50,
    getConfig: () => DEFAULT_CONFIG,
    onSample: (snapshot) => {
      samples.push(snapshot);
    },
  });

  collector.start();
  await vi.advanceTimersByTimeAsync(99);
  assert.equal(samples.length, 0);

  await vi.advanceTimersByTimeAsync(1);
  await flushSamples(samples, 1);
  await vi.advanceTimersByTimeAsync(50);
  await flushSamples(samples, 2);

  const expectedHash = await configHash(DEFAULT_CONFIG);
  for (const sample of samples) {
    assert.equal(sample.actual, 'webgl2');
    assert.equal(sample.configHash, expectedHash);
    assert.match(sample.configHash, /^[0-9a-f]{64}$/);
    assert.equal(sample.fps, 58.5);
    assert.equal(sample.gpuTimingAvailable, true);
    assert.equal(sample.gpuTimeMs, 3.25);
  }

  collector.dispose();
});

test('unavailable GPU timing is always stored as null', async () => {
  vi.useFakeTimers();
  const port = new FakeRenderer({
    actual: 'webgpu',
    running: true,
    gpuTimingAvailable: false,
    fps: 60,
    // Deliberately inconsistent input to prove the collector preserves INV-1.
    gpuTimeMs: 4,
  });
  const samples: PerformanceSnapshot[] = [];
  const collector = new PerformanceCollector(port, {
    warmUpMs: 0,
    cadenceMs: 100,
    getConfig: () => DEFAULT_CONFIG,
    onSample: (snapshot) => {
      samples.push(snapshot);
    },
  });

  collector.start();
  await vi.advanceTimersByTimeAsync(0);
  await flushSamples(samples, 1);

  assert.equal(samples[0]?.gpuTimingAvailable, false);
  assert.equal(samples[0]?.gpuTimeMs, null);
  collector.dispose();
});

test('start, stop and dispose are idempotent and cancelled work emits no more samples', async () => {
  vi.useFakeTimers();
  const port = new FakeRenderer({ actual: 'webgpu', running: true, fps: 60 });
  const samples: PerformanceSnapshot[] = [];
  const collector = new PerformanceCollector(port, {
    warmUpMs: 20,
    cadenceMs: 10,
    getConfig: () => DEFAULT_CONFIG,
    onSample: (snapshot) => {
      samples.push(snapshot);
    },
  });

  collector.start();
  collector.start();
  await vi.advanceTimersByTimeAsync(20);
  await flushSamples(samples, 1);

  collector.stop();
  collector.stop();
  await vi.advanceTimersByTimeAsync(100);
  assert.equal(samples.length, 1);

  collector.start();
  await vi.advanceTimersByTimeAsync(20);
  await flushSamples(samples, 2);
  collector.dispose();
  collector.dispose();
  collector.start();
  await vi.advanceTimersByTimeAsync(100);
  assert.equal(samples.length, 2);
});

test('rejects invalid warm-up and cadence values', () => {
  const port = new FakeRenderer();
  const baseOptions = {
    warmUpMs: 0,
    cadenceMs: 10,
    getConfig: () => DEFAULT_CONFIG,
    onSample: () => {},
  };

  assert.throws(() => new PerformanceCollector(port, { ...baseOptions, warmUpMs: -1 }), RangeError);
  assert.throws(() => new PerformanceCollector(port, { ...baseOptions, cadenceMs: 0 }), RangeError);
});
