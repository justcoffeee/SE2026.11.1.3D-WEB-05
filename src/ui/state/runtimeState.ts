import type { RendererStatus } from '../../core/renderer/RendererPort.ts';

export type RuntimePhase = 'initializing' | 'ready' | 'fallback' | 'unsupported' | 'error';
export type ActualBackend = 'canvas2d-mock' | 'webgpu' | 'webgl2' | 'unavailable';
export type RuntimeFixtureKey = 'canvas-mock' | 'initializing' | 'ready-webgpu' | 'fallback-webgl2' | 'unsupported' | 'error';
export type RuntimeNoticeTone = 'info' | 'warning' | 'error';

export interface RuntimeNotice {
  title: string;
  message: string;
  tone: RuntimeNoticeTone;
}

/**
 * View-model chỉ thuộc lớp UI. Đây không phải contract engine chính thức.
 * TV1/TV5 có thể viết adapter ánh xạ dữ liệu thật sang cấu trúc này khi tích hợp.
 */
export interface UiRuntimeState {
  phase: RuntimePhase;
  actualBackend: ActualBackend;
  backendLabel: string;
  backendDetail: string;
  fps: number | null;
  fpsDetail: string;
  gpuTimeMs: number | null;
  gpuTimingAvailable: boolean;
  gpuTimingDetail: string;
  controlsDisabled: boolean;
  fixture: boolean;
  notice?: RuntimeNotice;
}

export const RUNTIME_FIXTURE_KEYS: readonly RuntimeFixtureKey[] = [
  'canvas-mock',
  'initializing',
  'ready-webgpu',
  'fallback-webgl2',
  'unsupported',
  'error',
];

export function resolveRuntimeFixture(search: string): RuntimeFixtureKey {
  const requested = new URLSearchParams(search).get('uiState');
  return RUNTIME_FIXTURE_KEYS.includes(requested as RuntimeFixtureKey)
    ? requested as RuntimeFixtureKey
    : 'canvas-mock';
}

export function createRuntimeState(fixture: RuntimeFixtureKey = 'canvas-mock'): UiRuntimeState {
  switch (fixture) {
    case 'initializing':
      return {
        phase: 'initializing', actualBackend: 'unavailable', backendLabel: 'Đang khởi tạo',
        backendDetail: 'Chờ Core xác định backend thực tế', fps: null,
        fpsDetail: 'Chưa có dữ liệu từ engine', gpuTimeMs: null, gpuTimingAvailable: false,
        gpuTimingDetail: 'Chờ backend hoàn tất khởi tạo', controlsDisabled: true, fixture: true,
        notice: { tone: 'info', title: 'Đang khởi tạo renderer', message: 'Đây là fixture UI; Canvas2D phía sau vẫn chỉ dùng để kiểm tra bố cục.' },
      };
    case 'ready-webgpu':
      return {
        phase: 'ready', actualBackend: 'webgpu', backendLabel: 'WebGPU (fixture UI)',
        backendDetail: 'Chờ adapter Core cung cấp trạng thái thật', fps: null,
        fpsDetail: 'Không tạo số đo giả trong fixture', gpuTimeMs: null, gpuTimingAvailable: false,
        gpuTimingDetail: 'Chờ PerformanceSnapshot từ TV5', controlsDisabled: false, fixture: true,
        notice: { tone: 'info', title: 'Fixture trạng thái WebGPU ready', message: 'Chỉ kiểm tra cách trình bày; không chứng minh WebGPU đang chạy.' },
      };
    case 'fallback-webgl2':
      return {
        phase: 'fallback', actualBackend: 'webgl2', backendLabel: 'WebGL2 fallback (fixture UI)',
        backendDetail: 'Lý do minh họa: WebGPU không khả dụng', fps: null,
        fpsDetail: 'Chờ dữ liệu thật từ performance module', gpuTimeMs: null, gpuTimingAvailable: false,
        gpuTimingDetail: 'Không khả dụng trên fixture fallback', controlsDisabled: false, fixture: true,
        notice: { tone: 'warning', title: 'Đã chuyển sang WebGL2', message: 'Fixture dùng để kiểm tra thông báo fallback; chưa có backend thật.' },
      };
    case 'unsupported':
      return {
        phase: 'unsupported', actualBackend: 'unavailable', backendLabel: 'Không khả dụng',
        backendDetail: 'Không có backend đồ họa phù hợp', fps: null,
        fpsDetail: 'Simulation chưa chạy', gpuTimeMs: null, gpuTimingAvailable: false,
        gpuTimingDetail: 'Không khả dụng', controlsDisabled: true, fixture: true,
        notice: { tone: 'error', title: 'Thiết bị không được hỗ trợ', message: 'Cần hiển thị hướng dẫn và giữ preset có thể tải xuống khi engine thật báo unsupported.' },
      };
    case 'error':
      return {
        phase: 'error', actualBackend: 'unavailable', backendLabel: 'Lỗi khởi tạo',
        backendDetail: 'Chờ mã lỗi an toàn từ Core', fps: null,
        fpsDetail: 'Simulation đã dừng', gpuTimeMs: null, gpuTimingAvailable: false,
        gpuTimingDetail: 'Không khả dụng', controlsDisabled: true, fixture: true,
        notice: { tone: 'error', title: 'Không thể khởi tạo renderer', message: 'Fixture kiểm tra lỗi tổng quát; không hiển thị stack trace hoặc thông tin nội bộ.' },
      };
    case 'canvas-mock':
    default:
      return {
        phase: 'ready', actualBackend: 'canvas2d-mock', backendLabel: 'Canvas 2D (mockup)',
        backendDetail: 'Chưa kết nối Three.js / GPU', fps: null,
        fpsDetail: 'Chỉ đo Canvas2D preview, không phải benchmark', gpuTimeMs: null,
        gpuTimingAvailable: false, gpuTimingDetail: 'Chờ TV5 tích hợp', controlsDisabled: false, fixture: false,
      };
  }
}

export function withPreviewFps(state: UiRuntimeState, fps: number | null): UiRuntimeState {
  if (state.actualBackend !== 'canvas2d-mock' || state.phase !== 'ready' || state.fps === fps) return state;
  return { ...state, fps };
}

export function formatFps(state: UiRuntimeState): string {
  return state.fps === null ? '—' : `${Math.round(state.fps)} FPS`;
}

export function formatGpuTiming(state: UiRuntimeState): string {
  if (!state.gpuTimingAvailable || state.gpuTimeMs === null) return 'Không khả dụng';
  return `${state.gpuTimeMs.toFixed(2)} ms`;
}

/** Projection of port facts. Query-string fixtures are never consulted here. */
export function createRendererRuntimeState(status?: RendererStatus, failed = false): UiRuntimeState {
  if (failed || !status || status.actual === 'unavailable') {
    return {
      phase: failed ? 'error' : 'unsupported', actualBackend: 'unavailable',
      backendLabel: failed ? 'Lỗi renderer' : 'Không khả dụng',
      backendDetail: status ? 'Không có backend đồ họa phù hợp' : 'Renderer chưa được kết nối',
      fps: null, fpsDetail: 'Mô phỏng chưa chạy', gpuTimeMs: null,
      gpuTimingAvailable: false, gpuTimingDetail: 'Không khả dụng',
      controlsDisabled: true, fixture: false,
      notice: {
        tone: 'error', title: failed ? 'Renderer gặp lỗi' : 'Renderer chưa sẵn sàng',
        message: 'Bạn vẫn có thể nhập và xuất preset. Mô phỏng cần renderer được khởi tạo từ ứng dụng.',
      },
    };
  }
  const fallback = status.actual === 'webgl2' && status.requested !== 'webgl2';
  const gpuTimingAvailable = status.gpuTimingAvailable && status.gpuTimeMs !== null
    && Number.isFinite(status.gpuTimeMs) && status.gpuTimeMs >= 0;
  return {
    phase: fallback ? 'fallback' : 'ready', actualBackend: status.actual,
    backendLabel: status.actual === 'webgpu' ? 'WebGPU' : fallback ? 'WebGL2 fallback' : 'WebGL2',
    backendDetail: fallback ? 'Renderer báo đang dùng WebGL2 thay cho WebGPU' : 'Backend do RendererPort báo cáo',
    fps: status.running && status.fps !== null && Number.isFinite(status.fps) && status.fps >= 0 ? status.fps : null,
    fpsDetail: status.running ? 'Dữ liệu từ RendererPort' : 'Mô phỏng đang tạm dừng',
    gpuTimeMs: gpuTimingAvailable ? status.gpuTimeMs : null,
    gpuTimingAvailable, gpuTimingDetail: gpuTimingAvailable ? 'Dữ liệu từ RendererPort' : 'Không khả dụng',
    controlsDisabled: false, fixture: false,
    ...(fallback ? { notice: { tone: 'warning' as const, title: 'Đã chuyển sang WebGL2',
      message: 'Backend thực tế do renderer xác nhận; lựa chọn mới chỉ áp dụng khi khởi tạo lại.' } } : {}),
  };
}
