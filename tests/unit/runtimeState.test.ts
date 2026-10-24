import { expect, test } from 'vitest';
import {
  createRuntimeState,
  createRendererRuntimeState,
  formatFps,
  formatGpuTiming,
  resolveRuntimeFixture,
  withPreviewFps,
} from '../../src/ui/state/runtimeState.ts';

test('query không hợp lệ quay về Canvas2D mock', () => {
  expect(resolveRuntimeFixture('?uiState=unknown')).toBe('canvas-mock');
  expect(resolveRuntimeFixture('')).toBe('canvas-mock');
});

test('port projection uses actual rather than requested and preserves unavailable timing', () => {
  const state = createRendererRuntimeState({ requested: 'webgpu', actual: 'webgl2', running: true,
    fps: 58, gpuTimingAvailable: false, gpuTimeMs: 7 });
  expect(state.actualBackend).toBe('webgl2');
  expect(state.phase).toBe('fallback');
  expect(state.fixture).toBe(false);
  expect(state.fps).toBe(58);
  expect(state.gpuTimeMs).toBeNull();
});

test('unavailable renderer and invalid metrics cannot appear as measurements', () => {
  expect(createRendererRuntimeState().controlsDisabled).toBe(true);
  expect(createRendererRuntimeState(undefined, true).phase).toBe('error');
  for (const invalid of [NaN, Infinity, -1]) {
    const state = createRendererRuntimeState({ requested: 'auto', actual: 'webgpu', running: true,
      fps: invalid, gpuTimingAvailable: true, gpuTimeMs: invalid });
    expect(state.fps).toBeNull();
    expect(state.gpuTimeMs).toBeNull();
    expect(state.gpuTimingAvailable).toBe(false);
  }
});

test('fixture nhận đúng từ query string', () => {
  expect(resolveRuntimeFixture('?foo=1&uiState=fallback-webgl2')).toBe('fallback-webgl2');
  expect(resolveRuntimeFixture('?uiState=error')).toBe('error');
});

test('trạng thái lỗi và unsupported khóa điều khiển', () => {
  for (const fixture of ['initializing', 'unsupported', 'error'] as const) {
    const state = createRuntimeState(fixture);
    expect(state.controlsDisabled).toBe(true);
    expect(state.fps).toBeNull();
    expect(state.gpuTimeMs).toBeNull();
  }
});

test('fixture backend không tạo số hiệu năng giả', () => {
  for (const fixture of ['ready-webgpu', 'fallback-webgl2'] as const) {
    const state = createRuntimeState(fixture);
    expect(formatFps(state)).toBe('—');
    expect(formatGpuTiming(state)).toBe('Không khả dụng');
    expect(state.fpsDetail).toMatch(/Không tạo|Chờ/);
  }
});

test('chỉ Canvas2D mock nhận FPS từ preview', () => {
  const canvas = withPreviewFps(createRuntimeState('canvas-mock'), 59.6);
  expect(formatFps(canvas)).toBe('60 FPS');

  const fixture = createRuntimeState('ready-webgpu');
  expect(withPreviewFps(fixture, 60)).toBe(fixture);
});

test('GPU timing chỉ hiển thị khi adapter xác nhận khả dụng', () => {
  const state = {
    ...createRuntimeState('ready-webgpu'),
    gpuTimingAvailable: true,
    gpuTimeMs: 4.126,
  };
  expect(formatGpuTiming(state)).toBe('4.13 ms');
});
