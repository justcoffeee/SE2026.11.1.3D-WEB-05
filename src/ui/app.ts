import { DEFAULT_CONFIG } from '../presets/preset.ts';
import type { LabConfig } from '../presets/preset.ts';
import type { RendererPort } from '../core/renderer/RendererPort.ts';
import { bindLabControls, renderLabControls } from './controls/controlBindings.ts';
import { byId } from './dom.ts';
import { createToastController } from './notifications.ts';
import { renderRuntimeStatus } from './overlays/statusOverlay.ts';
import { createRendererRuntimeState } from './state/runtimeState.ts';
import { createLabMarkup } from './template.ts';

/** The composition root owns init/canvas binding; UI only consumes the injected port. */
export function mountLabUI(root: HTMLElement, port?: RendererPort): () => void {
  let config: LabConfig = { ...DEFAULT_CONFIG };
  let disposed = false;
  let configApplied = !port;

  root.innerHTML = createLabMarkup();

  const toast = createToastController();

  const refreshStatus = (): void => {
    if (disposed) return;
    if (!configApplied) {
      renderRuntimeStatus(createRendererRuntimeState(undefined, true));
      return;
    }
    try {
      const status = port?.getStatus();
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
    try { port?.reset(); }
    catch { throw new Error('Không thể khởi tạo lại mô phỏng. Vui lòng thử lại.'); }
  };

  const updateConfig = (next: LabConfig, shouldReset = false): void => {
    if (disposed) return;
    try {
      port?.applyConfig(next);
    } catch {
      renderLabControls(config);
      throw new Error('Không thể áp dụng cấu hình. Cấu hình trước vẫn được giữ trong UI.');
    }
    configApplied = true;
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
      if (!port) return;
      if (port.getStatus().running) port.pause();
      else port.start();
      refreshStatus();
    },
    notify: toast.notify,
  });

  renderLabControls(config);
  try {
    port?.applyConfig(config);
    configApplied = true;
    refreshStatus();
  } catch {
    renderRuntimeStatus(createRendererRuntimeState(undefined, true));
  }

  const statusTimer = window.setInterval(refreshStatus, 500);
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    window.clearInterval(statusTimer);
    window.removeEventListener('beforeunload', dispose);
    disposeControls();
    toast.dispose();
    port?.dispose();
  };
  window.addEventListener('beforeunload', dispose, { once: true });
  return dispose;
}
