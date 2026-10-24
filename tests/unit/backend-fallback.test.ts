import { describe, expect, it, vi } from 'vitest';
import { forceWebGLFromSearch, startBackend } from '../../src/simulations/backend/fallback.ts';

describe('backend fallback', () => {
  it('uses WebGPU when it initializes successfully', async () => {
    const webgpu = vi.fn(async () => 'gpu');
    const webgl2 = vi.fn(async () => 'gl');

    await expect(startBackend('auto', false, { webgpu, webgl2 })).resolves.toEqual({
      actual: 'webgpu',
      instance: 'gpu',
    });
    expect(webgl2).not.toHaveBeenCalled();
  });

  it('falls back to WebGL2 after WebGPU initialization fails', async () => {
    const result = await startBackend('auto', false, {
      webgpu: async () => { throw new Error('device unavailable'); },
      webgl2: async () => 'gl',
    });

    expect(result).toEqual({ actual: 'webgl2', instance: 'gl' });
  });

  it('reports unavailable after both initializers fail', async () => {
    const result = await startBackend('auto', false, {
      webgpu: async () => { throw new Error('no WebGPU'); },
      webgl2: async () => { throw new Error('no WebGL2'); },
    });

    expect(result).toEqual({ actual: 'unavailable', instance: null });
  });

  it('forces WebGL2 from the query flag and retains the requested preference outside the resolver', async () => {
    expect(forceWebGLFromSearch('?webgl=1')).toBe(true);
    expect(forceWebGLFromSearch('?webgl=true')).toBe(false);
    const webgpu = vi.fn(async () => 'gpu');
    const result = await startBackend('auto', true, { webgpu, webgl2: async () => 'gl' });
    expect(result).toEqual({ actual: 'webgl2', instance: 'gl' });
    expect(webgpu).not.toHaveBeenCalled();
  });
});
