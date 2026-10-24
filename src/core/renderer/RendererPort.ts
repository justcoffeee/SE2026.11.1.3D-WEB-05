/**
 * Contract every renderer implementation must satisfy.
 *
 * Two callers depend on this and nothing else:
 *  - `src/ui/` drives the simulation through it (start/pause/reset/applyConfig);
 *  - `src/perf/` reads measurements through `getStatus()`.
 *
 * Deliberately DOM-free and `three`-free: a canvas, an OffscreenCanvas or a
 * test double can all be passed as `RendererTarget`. This is what lets the UI
 * and the perf collector be tested without a GPU.
 *
 * Known coupling: `LabConfig` still lives in `src/presets/preset.ts`, so this
 * module depends on the preset domain for a type. Moving the config types into
 * `src/core/types/` is tracked as D-06 in docs/architecture.md.
 */
import type { ActualBackend, BackendPreference } from '../types/backend.ts';
import type { LabConfig } from '../../presets/preset.ts';

export interface RendererTarget {
  width: number;
  height: number;
  /** Device pixel ratio to render at, already clamped by the caller. */
  pixelRatio: number;
}

/**
 * Snapshot returned to the UI and the perf collector.
 *
 * `actual` is authoritative and comes from the engine after init; `requested`
 * is kept only so the UI can explain a fallback. `gpuTimeMs` is null whenever
 * `gpuTimingAvailable` is false — never 0.
 */
export interface RendererStatus {
  requested: BackendPreference;
  actual: ActualBackend;
  running: boolean;
  gpuTimingAvailable: boolean;
  fps: number | null;
  gpuTimeMs: number | null;
}

export interface RendererPort {
  /**
   * Creates the backend and resolves with the backend actually in use.
   * Resolves with `unavailable` instead of throwing when neither backend can
   * start, so the UI can show a fallback state rather than a blank canvas.
   */
  init(target: RendererTarget): Promise<ActualBackend>;

  /** Updates the drawing buffer and projection when the host canvas changes size. */
  resize?(target: RendererTarget): void;

  /** Applies simulation parameters. Safe to call every frame while dragging. */
  applyConfig(config: Readonly<LabConfig>): void;

  start(): void;
  pause(): void;
  reset(): void;

  getStatus(): RendererStatus;

  /** Releases GPU resources. Subsequent calls are no-ops. */
  dispose(): void;
}
