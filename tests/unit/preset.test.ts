import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, parsePreset, serializePreset } from '../../src/presets/preset.ts';

test('xuất JSON và import trở lại giữ nguyên cấu hình', () => {
  const original = { ...DEFAULT_CONFIG, mode: 'vortex' as const, backendPreference: 'webgl2' as const };
  assert.deepEqual(parsePreset(serializePreset(original)), original);
});

test('JSON không hợp lệ bị từ chối', () => {
  assert.throws(() => parsePreset('{invalid'), /JSON/);
});

test('preset sai schema bị từ chối', () => {
  assert.throws(() => parsePreset(JSON.stringify({ schemaVersion: 2, app: '3D-WEB-05', config: DEFAULT_CONFIG })), /định dạng/);
});

test('không chấp nhận số particle vượt phạm vi', () => {
  const data = JSON.parse(serializePreset({ ...DEFAULT_CONFIG }));
  data.config.particleCount = 100000000;
  assert.throws(() => parsePreset(JSON.stringify(data)), /Số particle/);
});

test('không chấp nhận màu sai định dạng', () => {
  const data = JSON.parse(serializePreset({ ...DEFAULT_CONFIG }));
  data.config.particleColor = '<script>';
  assert.throws(() => parsePreset(JSON.stringify(data)), /Màu/);
});

test('không chấp nhận hệ số ngoài phạm vi', () => {
  const data = JSON.parse(serializePreset({ ...DEFAULT_CONFIG }));
  data.config.strength = Infinity;
  assert.throws(() => parsePreset(JSON.stringify(data)), /Cường độ/);
});
