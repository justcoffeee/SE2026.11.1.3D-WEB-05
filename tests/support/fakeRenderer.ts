/**
 * Reusable `RendererPort` test double for UI and perf tests.
 *
 * Starts no canvas and imports no DOM or `three` code, so consumers can be
 * tested without a GPU. Every call is recorded: a test can assert ordering and
 * arguments, not just the final status.
 */
import type { ActualBackend, BackendPreference } from '../../src/core/types/backend.ts';
import type { LabConfig } from '../../src/presets/preset.ts';
import type { RendererPort, RendererStatus, RendererTarget } from '../../src/core/renderer/RendererPort.ts';

export type RendererCall =
  | { readonly type: 'init'; readonly target: RendererTarget }
  | { readonly type: 'applyConfig'; readonly config: Readonly<LabConfig> }
  | { readonly type: 'start' }
  | { readonly type: 'pause' }
  | { readonly type: 'reset' }
  | { readonly type: 'getStatus' }
  | { readonly type: 'dispose' };

export interface FakeRendererOptions {
  /** Backend the user asked for. Defaults to `auto`. */
  readonly requested?: BackendPreference;
  /** Backend the fake engine resolves to. Defaults to `unavailable`. */
  readonly actual?: ActualBackend;
  readonly running?: boolean;
  /** Defaults to `actual !== 'unavailable'`. */
  readonly gpuTimingAvailable?: boolean;
  readonly fps?: number | null;
  readonly gpuTimeMs?: number | null;
}

export class FakeRenderer implements RendererPort {
  readonly calls: RendererCall[] = [];

  #status: RendererStatus;
  #lastConfig: Readonly<LabConfig> | null = null;
  #disposed = false;

  constructor(options: FakeRendererOptions = {}) {
    const actual = options.actual ?? 'unavailable';
    this.#status = {
      requested: options.requested ?? 'auto',
      actual,
      running: options.running ?? false,
      gpuTimingAvailable: options.gpuTimingAvailable ?? actual !== 'unavailable',
      fps: options.fps ?? null,
      gpuTimeMs: options.gpuTimeMs ?? null,
    };
  }

  get lastConfig(): Readonly<LabConfig> | null {
    return this.#lastConfig;
  }

  get disposed(): boolean {
    return this.#disposed;
  }

  async init(target: RendererTarget): Promise<ActualBackend> {
    this.calls.push({ type: 'init', target });
    return this.#status.actual;
  }

  applyConfig(config: Readonly<LabConfig>): void {
    this.calls.push({ type: 'applyConfig', config });
    this.#lastConfig = config;
  }

  start(): void {
    this.calls.push({ type: 'start' });
    this.#status = { ...this.#status, running: true };
  }

  pause(): void {
    this.calls.push({ type: 'pause' });
    this.#status = { ...this.#status, running: false };
  }

  reset(): void {
    this.calls.push({ type: 'reset' });
    this.#lastConfig = null;
  }

  getStatus(): RendererStatus {
    this.calls.push({ type: 'getStatus' });
    return { ...this.#status };
  }

  dispose(): void {
    this.calls.push({ type: 'dispose' });
    if (this.#disposed) return;
    this.#disposed = true;
    this.#status = { ...this.#status, running: false };
  }
}
