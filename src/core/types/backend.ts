/**
 * Backend identity shared by the UI, the renderer port and the perf collector.
 *
 * `BackendPreference` is what the user asked for; `ActualBackend` is what the
 * engine really runs. They must never be conflated: a run requested as `auto`
 * can end up on `webgl2` or on `unavailable`, and the benchmark row has to say
 * so. See docs/architecture.md (INV-1).
 */

/** Backend selected by the user, before the engine has resolved it. */
export type BackendPreference = 'auto' | 'webgpu' | 'webgl2';

/** Backend the engine actually ran on. `unavailable` means neither backend started. */
export type ActualBackend = 'webgpu' | 'webgl2' | 'unavailable';
