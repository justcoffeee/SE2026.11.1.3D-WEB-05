import type { PerformanceSnapshot } from '../core/types/measurement.ts';
import type { RendererPort } from '../core/renderer/RendererPort.ts';
import { configHash } from '../core/measurement/configHash.ts';
import type { LabConfig } from '../presets/preset.ts';

export interface PerformanceCollectorOptions {
  /** Delay before the first sample, allowing the renderer to warm up. */
  readonly warmUpMs: number;
  /** Fixed delay between sample starts after warm-up. */
  readonly cadenceMs: number;
  /** Returns the effective config at the time each sample is taken. */
  readonly getConfig: () => Readonly<LabConfig>;
  readonly onSample: (snapshot: PerformanceSnapshot) => void;
  /** Receives config/status/callback errors; defaults to `console.error`. */
  readonly onError?: (error: unknown) => void;
}

/**
 * Samples the current renderer status on a fixed cadence after warm-up.
 * The collector does not own or dispose the RendererPort.
 */
export class PerformanceCollector {
  #running = false;
  #disposed = false;
  #sampling = false;
  #generation = 0;
  #warmUpTimer: ReturnType<typeof setTimeout> | null = null;
  #cadenceTimer: ReturnType<typeof setInterval> | null = null;
  readonly #onError: (error: unknown) => void;

  constructor(
    private readonly port: RendererPort,
    private readonly options: PerformanceCollectorOptions,
  ) {
    if (!Number.isFinite(options.warmUpMs) || options.warmUpMs < 0) {
      throw new RangeError('PerformanceCollector: warmUpMs must be a finite number >= 0');
    }
    if (!Number.isFinite(options.cadenceMs) || options.cadenceMs <= 0) {
      throw new RangeError('PerformanceCollector: cadenceMs must be a finite number > 0');
    }
    this.#onError = options.onError ?? ((error) => console.error('PerformanceCollector sample failed', error));
  }

  /** Starts sampling once; repeated calls while running have no effect. */
  start(): void {
    if (this.#running || this.#disposed) return;

    this.#running = true;
    const generation = ++this.#generation;
    this.#warmUpTimer = setTimeout(() => {
      this.#warmUpTimer = null;
      if (!this.#isActive(generation)) return;

      void this.#capture(generation);
      this.#cadenceTimer = setInterval(() => {
        void this.#capture(generation);
      }, this.options.cadenceMs);
    }, this.options.warmUpMs);
  }

  /** Stops sampling; repeated calls while stopped have no effect. */
  stop(): void {
    if (!this.#running) return;

    this.#running = false;
    this.#generation += 1;
    if (this.#warmUpTimer !== null) {
      clearTimeout(this.#warmUpTimer);
      this.#warmUpTimer = null;
    }
    if (this.#cadenceTimer !== null) {
      clearInterval(this.#cadenceTimer);
      this.#cadenceTimer = null;
    }
  }

  /** Stops and permanently disables the collector; repeated calls are safe. */
  dispose(): void {
    if (this.#disposed) return;
    this.stop();
    this.#disposed = true;
  }

  #isActive(generation: number): boolean {
    return this.#running && !this.#disposed && generation === this.#generation;
  }

  async #capture(generation: number): Promise<void> {
    if (!this.#isActive(generation) || this.#sampling) return;
    this.#sampling = true;

    try {
      const status = this.port.getStatus();
      const hash = await configHash(this.options.getConfig());
      if (!this.#isActive(generation)) return;

      // Enforce INV-1 even if a RendererPort implementation returns an
      // inconsistent status: unavailable or invalid timing is recorded as null.
      const gpuTimingAvailable =
        status.gpuTimingAvailable &&
        status.gpuTimeMs !== null &&
        Number.isFinite(status.gpuTimeMs);
      const snapshot: PerformanceSnapshot = {
        actual: status.actual,
        configHash: hash,
        fps: status.fps !== null && Number.isFinite(status.fps) ? status.fps : null,
        gpuTimingAvailable,
        gpuTimeMs: gpuTimingAvailable ? status.gpuTimeMs : null,
      };

      this.options.onSample(snapshot);
    } catch (error) {
      this.#onError(error);
    } finally {
      this.#sampling = false;
    }
  }
}
