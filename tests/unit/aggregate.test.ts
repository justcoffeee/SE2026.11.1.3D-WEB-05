/**
 * Contract tests for benchmark aggregation (TV1).
 *
 * The statistics are what a report row shows; if they change, published
 * numbers stop meaning the same thing.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { summarize } from '../../src/core/measurement/aggregate.ts';

test('aggregate: an empty run has no statistic, not zero', () => {
  assert.equal(summarize([]), null);
});

test('aggregate: a single sample summarises to itself', () => {
  assert.deepEqual(summarize([42]), { count: 1, min: 42, max: 42, median: 42, p95: 42 });
});

test('aggregate: odd count uses the middle value as median', () => {
  assert.equal(summarize([3, 1, 2])?.median, 2);
});

test('aggregate: even count averages the two middle values', () => {
  assert.equal(summarize([1, 2, 3, 4])?.median, 2.5);
});

test('aggregate: p95 uses nearest rank', () => {
  const twenty = Array.from({ length: 20 }, (_, i) => i + 1);
  const hundred = Array.from({ length: 100 }, (_, i) => i + 1);

  assert.equal(summarize(twenty)?.p95, 19);
  assert.equal(summarize(hundred)?.p95, 95);
  assert.equal(summarize(hundred)?.min, 1);
  assert.equal(summarize(hundred)?.max, 100);
});

test('aggregate: input order does not change the result and input is not mutated', () => {
  const input = [5, 1, 4, 2, 3];
  const copy = [...input];

  const summary = summarize(input);

  assert.deepEqual(summary, summarize([...input].reverse()));
  assert.deepEqual(input, copy);
});

test('aggregate: non-finite values are rejected instead of skewing the statistic', () => {
  for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.throws(() => summarize([1, bad, 3]), TypeError);
  }
});
