import {
  DEFAULT_CONFIG,
  downloadPreset,
  parsePreset,
  type LabConfig,
} from '../../presets/preset.ts';
import { byId } from '../dom.ts';
import type { ToastTone } from '../notifications.ts';

const formatNumber = (value: number): string =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value);

interface ControlCallbacks {
  getConfig: () => LabConfig;
  updateConfig: (next: LabConfig, resetSimulation?: boolean) => void;
  resetSimulation: () => void;
  toggleSimulation: () => void;
  notify: (message: string, tone?: ToastTone) => void;
}

export function renderLabControls(config: LabConfig): void {
  byId<HTMLInputElement>('particle-count').value = String(config.particleCount);
  byId<HTMLInputElement>('speed').value = String(config.speed);
  byId<HTMLInputElement>('particle-size').value = String(config.particleSize);
  byId<HTMLInputElement>('particle-color').value = config.particleColor;
  byId<HTMLInputElement>('strength').value = String(config.strength);
  byId<HTMLSelectElement>('backend').value = config.backendPreference;

  byId<HTMLOutputElement>('particle-count-value').textContent = formatNumber(config.particleCount);
  byId<HTMLOutputElement>('speed-value').textContent = `${formatNumber(config.speed)}×`;
  byId<HTMLOutputElement>('particle-size-value').textContent = `${formatNumber(config.particleSize)} px`;
  byId<HTMLOutputElement>('particle-color-value').textContent = config.particleColor.toUpperCase();
  byId<HTMLOutputElement>('strength-value').textContent = formatNumber(config.strength);
  byId<HTMLElement>('strength-label').textContent =
    config.mode === 'attractor' ? 'Attraction strength' : 'Vortex strength';
  byId<HTMLElement>('mode-description').textContent = config.mode === 'attractor'
    ? 'Particle chịu tác động của trường hút (minh họa).'
    : 'Particle xoáy quanh tâm (minh họa).';
  byId<HTMLElement>('scene-mode').textContent =
    config.mode === 'attractor' ? 'ATTRACTOR FIELD' : 'VORTEX FIELD';

  (['attractor', 'vortex'] as const).forEach((mode) => {
    const button = byId<HTMLButtonElement>(`mode-${mode}`);
    button.classList.toggle('active', config.mode === mode);
    button.setAttribute('aria-pressed', String(config.mode === mode));
  });
}

export function bindLabControls(callbacks: ControlCallbacks): () => void {
  const disposers: Array<() => void> = [];
  let disposed = false;
  const listen = (
    element: HTMLElement,
    event: string,
    handler: EventListener,
  ): void => {
    const guarded: EventListener = (event) => {
      try { handler(event); }
      catch { callbacks.notify('Không thể cập nhật renderer. Vui lòng thử lại.', 'error'); }
    };
    element.addEventListener(event, guarded);
    disposers.push(() => element.removeEventListener(event, guarded));
  };

  const numericFields = {
    'particle-count': 'particleCount',
    speed: 'speed',
    'particle-size': 'particleSize',
    strength: 'strength',
  } as const;

  (Object.keys(numericFields) as Array<keyof typeof numericFields>).forEach((id) => {
    listen(byId<HTMLInputElement>(id), 'input', (event) => {
      const value = Number((event.target as HTMLInputElement).value);
      callbacks.updateConfig(
        { ...callbacks.getConfig(), [numericFields[id]]: value },
        numericFields[id] === 'particleCount',
      );
    });
  });

  listen(byId<HTMLInputElement>('particle-color'), 'input', (event) => {
    callbacks.updateConfig({
      ...callbacks.getConfig(),
      particleColor: (event.target as HTMLInputElement).value,
    });
  });

  listen(byId<HTMLSelectElement>('backend'), 'change', (event) => {
    callbacks.updateConfig({
      ...callbacks.getConfig(),
      backendPreference: (event.target as HTMLSelectElement).value as LabConfig['backendPreference'],
    });
    callbacks.notify('Lựa chọn backend sẽ có hiệu lực ở lần khởi tạo renderer tiếp theo.', 'info');
  });

  (['attractor', 'vortex'] as const).forEach((mode) => {
    listen(byId<HTMLButtonElement>(`mode-${mode}`), 'click', () => {
      callbacks.updateConfig({ ...callbacks.getConfig(), mode }, true);
    });
  });

  listen(byId<HTMLButtonElement>('toggle-preview'), 'click', () => {
    callbacks.toggleSimulation();
  });

  listen(byId<HTMLButtonElement>('reset-preview'), 'click', () => {
    callbacks.resetSimulation();
    callbacks.notify('Đã khởi tạo lại mô phỏng.');
  });

  listen(byId<HTMLButtonElement>('export-preset'), 'click', () => {
    try {
      downloadPreset(callbacks.getConfig());
      callbacks.notify('Đã xuất preset JSON.');
    } catch (error) {
      callbacks.notify(error instanceof Error ? error.message : 'Không thể xuất preset.', 'error');
    }
  });

  listen(byId<HTMLButtonElement>('import-preset'), 'click', () => {
    byId<HTMLInputElement>('preset-file').click();
  });

  listen(byId<HTMLInputElement>('preset-file'), 'change', async (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error('Tệp preset vượt quá giới hạn 1 MB.');
      const next = parsePreset(await file.text());
      if (disposed) return;
      callbacks.updateConfig(next, true);
      callbacks.notify('Đã nhập preset hợp lệ.');
    } catch (error) {
      if (!disposed) callbacks.notify(error instanceof Error ? error.message : 'Không thể đọc preset.', 'error');
    } finally {
      input.value = '';
    }
  });

  listen(byId<HTMLButtonElement>('restore-defaults'), 'click', () => {
    callbacks.updateConfig({ ...DEFAULT_CONFIG }, true);
    callbacks.notify('Đã khôi phục cấu hình mặc định.');
  });

  return () => {
    if (disposed) return;
    disposed = true;
    disposers.forEach((dispose) => dispose());
  };
}
