import { DEFAULT_CONFIG } from '../presets/preset.ts';
import type { LabConfig } from '../presets/preset.ts';
import type { RendererPort, RendererTarget } from '../core/renderer/RendererPort.ts';
import { bindLabControls, renderLabControls } from './controls/controlBindings.ts';
import { byId } from './dom.ts';
import { createToastController } from './notifications.ts';
import { renderRuntimeStatus } from './overlays/statusOverlay.ts';
import { createRendererRuntimeState } from './state/runtimeState.ts';
import { createLabMarkup } from './template.ts';

export type RendererPortFactory = (
  canvas: HTMLCanvasElement,
  config: Readonly<LabConfig>,
) => RendererPort;

/** The composition root owns init/canvas binding; UI only consumes the injected port. */
export function mountLabUI(
  root: HTMLElement,
  port?: RendererPort,
  rendererFactory?: RendererPortFactory,
): () => void {
  let config: LabConfig = { ...DEFAULT_CONFIG };
  let disposed = false;
  let configApplied = !port && !rendererFactory;

  root.innerHTML = createLabMarkup();

  const canvas = byId<HTMLCanvasElement>('preview-canvas');
  const adapter = port ? null : rendererFactory?.(canvas, config) ?? null;
  const rendererPort = port ?? adapter;
  let adapterInitialized = !adapter;
  const getRendererTarget = (): RendererTarget => {
    const bounds = (canvas.parentElement ?? canvas).getBoundingClientRect();
    return {
      width: Math.max(1, bounds.width),
      height: Math.max(1, bounds.height),
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    };
  };
  const resizeObserver = adapter?.resize
    ? new ResizeObserver(() => adapter.resize?.(getRendererTarget()))
    : null;
  if (resizeObserver && canvas.parentElement) resizeObserver.observe(canvas.parentElement);

  const toast = createToastController();

  const refreshStatus = (): void => {
    if (disposed) return;
    if (!configApplied) {
      renderRuntimeStatus(createRendererRuntimeState(undefined, true));
      return;
    }
    try {
      const status = rendererPort?.getStatus();
      renderRuntimeStatus(createRendererRuntimeState(status));
      const running = status?.running ?? false;
      const toggle = byId<HTMLButtonElement>('toggle-preview');
      toggle.textContent = running ? 'Ⅱ' : '▶';
      toggle.setAttribute('aria-label', running ? 'Tạm dừng xem trước' : 'Tiếp tục xem trước');
    } catch {
      renderRuntimeStatus(createRendererRuntimeState(undefined, true));
    }
  };

  const resetSimulation = (): void => {
    try { rendererPort?.reset(); }
    catch { throw new Error('Không thể khởi tạo lại mô phỏng. Vui lòng thử lại.'); }
  };

  const updateConfig = (next: LabConfig, shouldReset = false): void => {
    if (disposed) return;
    try {
      rendererPort?.applyConfig(next);
    } catch {
      renderLabControls(config);
      throw new Error('Không thể áp dụng cấu hình. Cấu hình trước vẫn được giữ trong UI.');
    }
    configApplied = Boolean(port) || adapterInitialized;
    config = next;
    renderLabControls(config);
    if (shouldReset) {
      try { resetSimulation(); }
      catch {
        refreshStatus();
        throw new Error('Cấu hình đã được áp dụng. Không thể khởi tạo lại mô phỏng; vui lòng thử Reset.');
      }
    }
    refreshStatus();
  };

  const disposeControls = bindLabControls({
    getConfig: () => config,
    updateConfig,
    resetSimulation: () => { resetSimulation(); refreshStatus(); },
    toggleSimulation: () => {
      if (!rendererPort) return;
      if (rendererPort.getStatus().running) rendererPort.pause();
      else rendererPort.start();
      refreshStatus();
    },
    notify: toast.notify,
  });

  renderLabControls(config);
  try {
    rendererPort?.applyConfig(config);
    if (port) configApplied = true;
    refreshStatus();
  } catch {
    renderRuntimeStatus(createRendererRuntimeState(undefined, true));
  }

  if (adapter) {
    void adapter.init(getRendererTarget()).then((actual) => {
      if (disposed) return;
      adapterInitialized = true;
      configApplied = true;
      if (actual !== 'unavailable') adapter.start();
      refreshStatus();
    }).catch(() => {
      if (disposed) return;
      adapterInitialized = true;
      configApplied = true;
      refreshStatus();
    });
  }

  const statusTimer = window.setInterval(refreshStatus, 500);
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    window.clearInterval(statusTimer);
    window.removeEventListener('beforeunload', dispose);
    disposeControls();
    toast.dispose();
    resizeObserver?.disconnect();
    rendererPort?.dispose();
  };
  window.addEventListener('beforeunload', dispose, { once: true });
  return dispose;
}
