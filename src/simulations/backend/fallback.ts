import type { ActualBackend, BackendPreference } from '../../core/types/backend.ts';

export interface BackendFactories<T> {
  readonly webgpu: () => Promise<T>;
  readonly webgl2: () => Promise<T>;
}

export interface StartedBackend<T> {
  readonly actual: ActualBackend;
  readonly instance: T | null;
}

/** Start the requested backend, falling back to WebGL2 without losing the user's preference. */
export async function startBackend<T>(
  preference: BackendPreference,
  forceWebGL: boolean,
  factories: BackendFactories<T>,
): Promise<StartedBackend<T>> {
  if (!forceWebGL && preference !== 'webgl2') {
    try {
      return { actual: 'webgpu', instance: await factories.webgpu() };
    } catch {
      // A failed device/renderer initialization is a normal fallback path.
    }
  }

  try {
    return { actual: 'webgl2', instance: await factories.webgl2() };
  } catch {
    return { actual: 'unavailable', instance: null };
  }
}

export function forceWebGLFromSearch(search: string): boolean {
  return new URLSearchParams(search).get('webgl') === '1';
}
