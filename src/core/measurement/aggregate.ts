/**
 * Benchmark aggregation (TV1). The collector produces samples (TV5); this module
 * turns them into the numbers a report row may show.
 *
 * It returns the candidate statistics instead of choosing one: which statistic
 * a benchmark declares is a protocol decision that is still open
 * (`docs/01-requirements/mvp-acceptance.md` §2), so nothing here bakes in a
 * preference.
 */

import type { ActualBackend } from '../types/backend.ts';
import type { PerformanceSnapshot } from '../types/measurement.ts';

export interface ValueSummary {
  readonly count: number;
  readonly min: number;
  readonly max: number;
  readonly median: number;
  readonly p95: number;
}

/** Nearest-rank percentile over an ascending array: index `ceil(p * n) - 1`. */
function percentile(sorted: readonly number[], p: number): number {
  const index = Math.ceil(p * sorted.length) - 1;
  return sorted[Math.min(Math.max(index, 0), sorted.length - 1)]!;
}

/**
 * Summarises one measured value across samples.
 *
 * `null` for an empty input — a run with no samples has no statistic, and
 * writing `0` would be the same lie INV-1 forbids for GPU timing.
 * Non-finite values throw: a sample is a measurement, not a placeholder.
 */
export function summarize(values: readonly number[]): ValueSummary | null {
  for (const value of values) {
    if (!Number.isFinite(value)) {
      throw new TypeError('summarize: every value must be a finite number');
    }
  }
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;

  return {
    count: sorted.length,
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
    median,
    p95: percentile(sorted, 0.95),
  };
}

export interface AggregateGroup {
  readonly configHash: string;
  readonly actual: ActualBackend;
  /** Samples in the group. Raw samples are not exposed: the result must not
   * depend on the order they arrived in. */
  readonly count: number;
  readonly fps: ValueSummary | null;
  readonly gpuTimeMs: ValueSummary | null;
}

const CONFIG_HASH_PATTERN = /^[0-9a-f]{64}$/;

/**
 * INV-1 at the aggregation boundary. A sample that claims timing it does not
 * have, or omits timing it does, is rejected before it can reach a statistic —
 * an average of mixed truths is worse than a failed run.
 */
function assertSample(sample: PerformanceSnapshot): void {
  if (!CONFIG_HASH_PATTERN.test(sample.configHash)) {
    throw new TypeError(`aggregateByBackend: malformed configHash "${sample.configHash}"`);
  }
  if (sample.gpuTimingAvailable) {
    if (sample.gpuTimeMs === null || !Number.isFinite(sample.gpuTimeMs)) {
      throw new TypeError('aggregateByBackend: gpuTimingAvailable is true but gpuTimeMs is not a finite number');
    }
  } else if (sample.gpuTimeMs !== null) {
    throw new TypeError('aggregateByBackend: gpuTimeMs must be null when timing is unavailable (INV-1)');
  }
  if (sample.fps !== null && !Number.isFinite(sample.fps)) {
    throw new TypeError('aggregateByBackend: fps must be a finite number or null');
  }
}

/**
 * Groups samples by `configHash × actual`, sorted by the key.
 *
 * `mode` is not part of the key because `configHash` already covers it
 * (`docs/architecture.md` §5.1); `actual` is the backend that ran. A sample
 * carries no requested preference to group by, by construction.
 */
export function aggregateByBackend(samples: readonly PerformanceSnapshot[]): AggregateGroup[] {
  const buckets = new Map<string, PerformanceSnapshot[]>();
  for (const sample of samples) {
    assertSample(sample);
    const key = `${sample.configHash}\u0000${sample.actual}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(sample);
    else buckets.set(key, [sample]);
  }

  return [...buckets.values()]
    .map((bucket) => {
      const first = bucket[0]!;
      const fps = bucket.map((s) => s.fps).filter((value): value is number => value !== null);
      const gpuTime = bucket.map((s) => s.gpuTimeMs).filter((value): value is number => value !== null);
      return {
        configHash: first.configHash,
        actual: first.actual,
        count: bucket.length,
        fps: summarize(fps),
        gpuTimeMs: summarize(gpuTime),
      };
    })
    .sort((a, b) => {
      if (a.configHash !== b.configHash) return a.configHash < b.configHash ? -1 : 1;
      if (a.actual === b.actual) return 0;
      return a.actual < b.actual ? -1 : 1;
    });
}
