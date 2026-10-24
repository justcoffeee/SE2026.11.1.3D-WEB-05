/**
 * Contract tests for the benchmark identity: performance snapshot shape and
 * `configHash` (docs/architecture.md §3 INV-1 and §5.1).
 *
 * If one of these fails, samples stop being comparable across runs.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../../src/presets/preset.ts';
import type { LabConfig } from '../../src/presets/preset.ts';
import { canonicalConfig, configHash } from '../../src/core/measurement/configHash.ts';
import type { PerformanceSnapshot } from '../../src/core/types/measurement.ts';

const withConfig = (patch: Partial<LabConfig>): LabConfig => ({ ...DEFAULT_CONFIG, ...patch });

test('configHash: canonical string is the documented one', () => {
  assert.equal(
    canonicalConfig(DEFAULT_CONFIG),
    '{"mode":"attractor","particleCount":20000,"particleSize":2.5,"speed":1.2,"strength":1.5}',
  );
});

test('configHash: canonical form ignores property insertion order and unrelated fields', () => {
  const reordered = {
    strength: 1.5,
    speed: 1.2,
    particleColor: '#000000',
    particleSize: 2.5,
    particleCount: 20000,
    backendPreference: 'webgl2',
    mode: 'attractor',
  } as LabConfig;

  assert.equal(canonicalConfig(reordered), canonicalConfig(DEFAULT_CONFIG));
});

test('configHash: deterministic, SHA-256 lowercase hex, 64 chars', async () => {
  const first = await configHash(DEFAULT_CONFIG);
  const second = await configHash({ ...DEFAULT_CONFIG });

  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{64}$/);
  // Pinned value for DEFAULT_CONFIG; cross-checked against `node:crypto`.
  assert.equal(first, '96f45d23374376e93b829d7e85053ddf8fe572de52e1b77d3fd217bb8d572faf');
});

test('configHash: numbers are rounded to 3 decimals, so equivalent configs agree', async () => {
  const base = await configHash(withConfig({ speed: 1.2, particleSize: 2.5 }));
  const noisy = await configHash(withConfig({ speed: 1.2001, particleSize: 2.5004 }));

  assert.equal(noisy, base);
  assert.equal(canonicalConfig(withConfig({ speed: 1.2000 })), canonicalConfig(withConfig({ speed: 1.2 })));
});

test('configHash: every benchmark-relevant field changes the hash', async () => {
  const base = await configHash(DEFAULT_CONFIG);
  const variants: LabConfig[] = [
    withConfig({ mode: 'vortex' }),
    withConfig({ particleCount: 21000 }),
    withConfig({ particleSize: 3 }),
    withConfig({ speed: 1.3 }),
    withConfig({ strength: 1.6 }),
  ];

  const hashes = await Promise.all(variants.map((config) => configHash(config)));
  assert.equal(new Set(hashes).size, variants.length);
  for (const hash of hashes) assert.notEqual(hash, base);
});

test('configHash: excluded fields do not change the hash', async () => {
  const base = await configHash(DEFAULT_CONFIG);
  const backendOnly = await configHash(withConfig({ backendPreference: 'webgl2' }));
  const colourOnly = await configHash(withConfig({ particleColor: '#ff0000' }));

  assert.equal(backendOnly, base);
  assert.equal(colourOnly, base);
});

test('configHash: missing or non-finite values throw instead of hashing a default', async () => {
  const bad: Array<Partial<LabConfig>> = [
    { particleCount: Number.NaN },
    { speed: Number.POSITIVE_INFINITY },
    { strength: Number.NEGATIVE_INFINITY },
    { mode: 'gravity' as LabConfig['mode'] },
  ];

  for (const patch of bad) {
    assert.throws(() => canonicalConfig(withConfig(patch)), TypeError);
    await assert.rejects(configHash(withConfig(patch)), TypeError);
  }

  const missing = { ...DEFAULT_CONFIG } as Partial<LabConfig>;
  delete missing.speed;
  assert.throws(() => canonicalConfig(missing as LabConfig), TypeError);
});

test('performance snapshot: records the actual backend and honest unavailable timing', async () => {
  const snapshot: PerformanceSnapshot = {
    actual: 'webgl2',
    configHash: await configHash(DEFAULT_CONFIG),
    fps: 60,
    gpuTimeMs: null,
    gpuTimingAvailable: false,
  };

  assert.deepEqual(Object.keys(snapshot).sort(), [
    'actual', 'configHash', 'fps', 'gpuTimeMs', 'gpuTimingAvailable',
  ]);
  assert.equal(snapshot.actual, 'webgl2');
  assert.match(snapshot.configHash, /^[0-9a-f]{64}$/);
  assert.equal(snapshot.gpuTimeMs, null);
});
