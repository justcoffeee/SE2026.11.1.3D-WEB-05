/**
 * Contract tests for grouping benchmark samples by `(configHash) × actual`.
 *
 * Grouping is what makes a comparison legitimate: samples from different
 * configurations or different backends must never land in one row, and an
 * INV-1 violation must stop the run instead of producing a clean-looking
 * average of a lie.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { PerformanceSnapshot } from '../../src/core/types/measurement.ts';
import { aggregateByBackend } from '../../src/core/measurement/aggregate.ts';

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);

const snap = (patch: Partial<PerformanceSnapshot> = {}): PerformanceSnapshot => ({
  actual: 'webgpu',
  configHash: HASH_A,
  fps: 60,
  gpuTimeMs: 2.5,
  gpuTimingAvailable: true,
  ...patch,
});

test('groups: an empty run produces no group', () => {
  assert.deepEqual(aggregateByBackend([]), []);
});

test('groups: splits by configHash and actual backend, sorted deterministically', () => {
  const groups = aggregateByBackend([
    snap(),
    snap({ actual: 'webgl2' }),
    snap({ configHash: HASH_B }),
    snap(),
  ]);

  assert.deepEqual(
    groups.map((group) => [group.configHash, group.actual, group.count]),
    [
      [HASH_A, 'webgl2', 1],
      [HASH_A, 'webgpu', 2],
      [HASH_B, 'webgpu', 1],
    ],
  );
});

test('groups: input order does not change the output', () => {
  const samples = [snap({ fps: 30 }), snap({ fps: 90 }), snap({ actual: 'webgl2' })];

  assert.deepEqual(aggregateByBackend(samples), aggregateByBackend([...samples].reverse()));
});

test('groups: an unavailable backend keeps gpu timing null and never turns it into 0', () => {
  const [group] = aggregateByBackend([
    snap({ actual: 'unavailable', gpuTimingAvailable: false, gpuTimeMs: null, fps: null }),
  ]);

  assert.equal(group?.actual, 'unavailable');
  assert.equal(group?.gpuTimeMs, null);
  assert.equal(group?.fps, null);
});

test('groups: null fps values are excluded from the statistic, not counted as zero', () => {
  const [group] = aggregateByBackend([snap({ fps: 60 }), snap({ fps: null }), snap({ fps: 90 })]);

  assert.equal(group?.fps?.count, 2);
  assert.equal(group?.fps?.median, 75);
});

test('groups: an INV-1 violation stops the run', () => {
  // Timing reported while the backend says it has none.
  assert.throws(() => aggregateByBackend([snap({ gpuTimingAvailable: false, gpuTimeMs: 2.5 })]), TypeError);
  // Timing missing while the backend says it is available.
  assert.throws(() => aggregateByBackend([snap({ gpuTimingAvailable: true, gpuTimeMs: null })]), TypeError);
  // A non-finite measurement is not a measurement.
  assert.throws(() => aggregateByBackend([snap({ fps: Number.NaN })]), TypeError);
});

test('groups: a malformed configHash is rejected instead of creating a bucket', () => {
  for (const bad of ['', 'abc', 'A'.repeat(64), `${'a'.repeat(63)}z`]) {
    assert.throws(() => aggregateByBackend([snap({ configHash: bad })]), TypeError);
  }
});
