/**
 * Perf sample shape shared by the collector (TV5), the ingestion side and the
 * benchmark report (docs/architecture.md §4.1).
 *
 * INV-1 (docs/architecture.md §3): a sample identifies the backend that really
 * ran, and `gpuTimeMs` is null if and only if `gpuTimingAvailable` is false.
 * Use `configHash()` from `src/core/measurement/configHash.ts` to fill
 * `configHash`; `backendPreference` never belongs in a sample.
 */
import type { ActualBackend } from './backend.ts';

export interface PerformanceSnapshot {
  /** Backend the engine actually ran on — never the requested preference. */
  actual: ActualBackend;
  /** Identity of the effective configuration, from `configHash()`. */
  configHash: string;
  fps: number | null;
  gpuTimeMs: number | null;
  gpuTimingAvailable: boolean;
}
