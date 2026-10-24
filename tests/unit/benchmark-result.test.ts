/**
 * Contract tests for the benchmark result file (TV1).
 *
 * The result file is the artefact a reviewer reads instead of trusting the
 * person who ran the benchmark. It must refuse an incomplete result instead of
 * writing "n/a" over a missing environment or inventing timing.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../../src/presets/preset.ts';
import { toMarkdown } from '../../src/core/measurement/result.ts';
import type { BenchmarkResult } from '../../src/core/measurement/result.ts';

const HASH = 'a'.repeat(64);

const result = (patch: Partial<BenchmarkResult> = {}): BenchmarkResult => ({
  environment: {
    browser: 'Chrome',
    browserVersion: '141',
    os: 'Windows 11',
    gpu: 'RTX 3060',
    driver: '581.15',
    commit: '4bddd58',
    sameHost: true,
  },
  config: { ...DEFAULT_CONFIG },
  configHash: HASH,
  protocol: { warmUpSeconds: null, sampleCount: 3, durationSeconds: null },
  groups: [
    {
      configHash: HASH,
      actual: 'webgpu',
      count: 3,
      fps: { count: 3, min: 50, max: 70, median: 60, p95: 70 },
      gpuTimeMs: { count: 3, min: 2, max: 3, median: 2.5, p95: 3 },
    },
    {
      configHash: HASH,
      actual: 'webgl2',
      count: 3,
      fps: { count: 3, min: 50, max: 70, median: 60, p95: 70 },
      gpuTimeMs: null,
    },
  ],
  limitations: [],
  ...patch,
});

test('result: markdown carries environment, configuration and one row per backend', () => {
  const text = toMarkdown(result());

  assert.match(text, /## Environment/);
  assert.match(text, /Chrome 141/);
  assert.match(text, /Windows 11/);
  assert.match(text, /## Configuration/);
  assert.ok(text.includes(HASH));
  assert.match(text, /## Runs/);
  assert.match(text, /\| webgpu \|/);
  assert.match(text, /\| webgl2 \|/);
});

test('result: missing GPU timing is written as n/a, never as zero', () => {
  const text = toMarkdown(result());

  const webgl2Row = text.split('\n').find((line) => line.startsWith('| webgl2 '))!;
  assert.match(webgl2Row, /n\/a/);
  assert.doesNotMatch(webgl2Row, /\| 0 \|/);
});

test('result: unfixed protocol values stay unset instead of being guessed', () => {
  const text = toMarkdown(result());

  assert.match(text, /warm-up: not fixed/);
  assert.match(text, /duration: not fixed/);
  assert.match(text, /sample count: 3/);
});

test('result: an incomplete environment is rejected', () => {
  for (const field of ['browser', 'os', 'gpu', 'commit'] as const) {
    assert.throws(
      () => toMarkdown(result({ environment: { ...result().environment, [field]: '' } })),
      TypeError,
    );
  }
});

test('result: a run without groups or with a malformed hash is not a result', () => {
  assert.throws(() => toMarkdown(result({ groups: [] })), TypeError);
  assert.throws(() => toMarkdown(result({ configHash: 'abc' })), TypeError);
});

test('result: a group from another configuration is rejected', () => {
  assert.throws(
    () => toMarkdown(result({ groups: [{ ...result().groups[0]!, configHash: 'b'.repeat(64) }] })),
    TypeError,
  );
});
