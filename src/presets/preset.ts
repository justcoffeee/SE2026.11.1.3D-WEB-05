/** Hợp đồng cấu hình đề xuất bởi TV4; cần TV1/TV2/TV3 review trước khi tích hợp engine. */
export type SimulationMode = 'attractor' | 'vortex';
export type BackendPreference = 'auto' | 'webgpu' | 'webgl2';

export interface LabConfig {
  mode: SimulationMode;
  backendPreference: BackendPreference;
  particleCount: number;
  speed: number;
  particleSize: number;
  particleColor: string;
  strength: number;
}

export interface LabPreset {
  schemaVersion: 1;
  app: '3D-WEB-05';
  config: LabConfig;
}

export const DEFAULT_CONFIG: Readonly<LabConfig> = Object.freeze({
  mode: 'attractor',
  backendPreference: 'auto',
  particleCount: 20000,
  speed: 1.2,
  particleSize: 2.5,
  particleColor: '#6ce6ff',
  strength: 1.5,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNumberInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

/** Chỉ nhận cấu hình hợp lệ, không tự động tin tưởng dữ liệu JSON do người dùng tải lên. */
export function parsePreset(text: string): LabConfig {
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new Error('Tệp không phải JSON hợp lệ.');
  }

  if (!isRecord(value) || value.schemaVersion !== 1 || value.app !== '3D-WEB-05' || !isRecord(value.config)) {
    throw new Error('Sai định dạng preset hoặc phiên bản chưa được hỗ trợ.');
  }

  const c = value.config;
  if (c.mode !== 'attractor' && c.mode !== 'vortex') throw new Error('Simulation mode không hợp lệ.');
  if (c.backendPreference !== 'auto' && c.backendPreference !== 'webgpu' && c.backendPreference !== 'webgl2') {
    throw new Error('Tùy chọn backend không hợp lệ.');
  }
  if (!isNumberInRange(c.particleCount, 1000, 50000) || !Number.isInteger(c.particleCount) || c.particleCount % 1000 !== 0) {
    throw new Error('Số particle phải từ 1.000 đến 50.000, theo bước 1.000.');
  }
  if (!isNumberInRange(c.speed, 0.1, 3)) throw new Error('Tốc độ nằm ngoài khoảng 0.1–3.');
  if (!isNumberInRange(c.particleSize, 1, 8)) throw new Error('Kích thước particle nằm ngoài khoảng 1–8.');
  if (!isNumberInRange(c.strength, 0.2, 4)) throw new Error('Cường độ nằm ngoài khoảng 0.2–4.');
  if (typeof c.particleColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(c.particleColor)) {
    throw new Error('Màu phải ở dạng #RRGGBB.');
  }

  return {
    mode: c.mode,
    backendPreference: c.backendPreference,
    particleCount: c.particleCount,
    speed: c.speed,
    particleSize: c.particleSize,
    particleColor: c.particleColor,
    strength: c.strength,
  };
}

export function serializePreset(config: LabConfig): string {
  const preset: LabPreset = { schemaVersion: 1, app: '3D-WEB-05', config: { ...config } };
  // Validate chính dữ liệu xuất ra để tránh preset hỏng khi state thay đổi ở tương lai.
  parsePreset(JSON.stringify(preset));
  return `${JSON.stringify(preset, null, 2)}\n`;
}

export function downloadPreset(config: LabConfig): void {
  const blob = new Blob([serializePreset(config)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `particle-lab-${config.mode}-preset.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
