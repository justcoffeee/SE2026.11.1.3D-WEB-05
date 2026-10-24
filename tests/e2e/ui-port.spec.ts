import { expect, test } from '@playwright/test';

const fixturePage = '/tests/e2e/fixtures/renderer-port.html';

test('production without an injected renderer stays unavailable, even with a fixture query', async ({ page }) => {
  await page.goto('/?uiState=ready-webgpu');
  await expect(page.locator('#actual-backend')).toHaveText('Không khả dụng');
  await expect(page.locator('#runtime-phase-label')).toHaveText('UNSUPPORTED');
  await expect(page.locator('#runtime-fps')).toHaveText('—');
  await expect(page.locator('#gpu-timing')).toHaveText('Không khả dụng');
  await expect(page.locator('#mode-vortex')).toBeDisabled();
  await expect(page.locator('#export-preset')).toBeEnabled();
  await expect(page.locator('#import-preset')).toBeEnabled();
});

test('each control change applies once; mode/count also reset through the port', async ({ page }) => {
  await page.goto(fixturePage);
  await expect(page.locator('#actual-backend')).toHaveText('WebGPU');
  expect(await page.evaluate(() => window.uiTest.port.calls.filter(c => c.type === 'init'))).toEqual([]);
  expect(await page.evaluate(() => window.uiTest.port.calls.filter(c => c.type === 'applyConfig').length)).toBe(1);
  const cases = [
    { id: '#speed', value: '2.5', field: 'speed', expected: 2.5 },
    { id: '#particle-size', value: '4', field: 'particleSize', expected: 4 },
    { id: '#strength', value: '2', field: 'strength', expected: 2 },
    { id: '#particle-color', value: '#ff8800', field: 'particleColor', expected: '#ff8800' },
    { id: '#particle-count', value: '32000', field: 'particleCount', expected: 32000 },
  ];
  for (const change of cases) {
    await page.evaluate(() => { window.uiTest.port.calls.length = 0; });
    await page.locator(change.id).fill(change.value);
    const calls = await page.evaluate(() => window.uiTest.port.calls.filter(c => c.type !== 'getStatus'));
    expect(calls.map(c => c.type)).toEqual(change.field === 'particleCount' ? ['applyConfig', 'reset'] : ['applyConfig']);
    expect(calls[0]).toMatchObject({ config: { [change.field]: change.expected } });
  }
  await page.evaluate(() => { window.uiTest.port.calls.length = 0; });
  await page.locator('#mode-vortex').click();
  expect(await page.evaluate(() => window.uiTest.port.calls.filter(c => c.type !== 'getStatus').map(c => c.type)))
    .toEqual(['applyConfig', 'reset']);
  await page.evaluate(() => { window.uiTest.port.calls.length = 0; });
  await page.locator('#backend').selectOption('webgl2');
  expect(await page.evaluate(() => window.uiTest.port.calls.filter(c => c.type !== 'getStatus').map(c => c.type)))
    .toEqual(['applyConfig']);
  await expect(page.locator('#actual-backend')).toHaveText('WebGPU');
  await expect(page.locator('#toast')).toContainText('lần khởi tạo renderer tiếp theo');
});

test('pause, resume, reset and defaults use the port; unmount and unload dispose exactly once', async ({ page }) => {
  await page.clock.install();
  await page.goto(fixturePage);
  await page.evaluate(() => { window.uiTest.port.calls.length = 0; });
  await page.locator('#toggle-preview').click();
  await expect(page.locator('#toggle-preview')).toHaveAttribute('aria-label', 'Tiếp tục xem trước');
  await page.locator('#toggle-preview').click();
  await expect(page.locator('#toggle-preview')).toHaveAttribute('aria-label', 'Tạm dừng xem trước');
  await page.locator('#reset-preview').click();
  expect(await page.evaluate(() => window.uiTest.port.calls.filter(c => c.type !== 'getStatus').map(c => c.type)))
    .toEqual(['pause', 'start', 'reset']);

  await page.locator('#speed').fill('2.5');
  await page.evaluate(() => { window.uiTest.port.calls.length = 0; });
  await page.locator('#restore-defaults').click();
  expect(await page.evaluate(() => window.uiTest.port.calls.filter(c => c.type !== 'getStatus').map(c => c.type)))
    .toEqual(['applyConfig', 'reset']);
  await expect(page.locator('#speed-value')).toContainText('1,2');

  await page.evaluate(() => {
    window.dispatchEvent(new Event('beforeunload'));
    window.uiTest.unmount();
    window.dispatchEvent(new Event('beforeunload'));
  });
  const callsAfterDispose = await page.evaluate(() => window.uiTest.port.calls.length);
  expect(await page.evaluate(() => window.uiTest.port.calls.filter(c => c.type === 'dispose').length)).toBe(1);
  await page.locator('#mode-vortex').click();
  // Advance the browser clock to prove polling was removed, without a real delay.
  await page.clock.fastForward(1000);
  expect(await page.evaluate(() => window.uiTest.port.calls.length)).toBe(callsAfterDispose);
});

test('initial apply failure stays disabled across polling until a successful import', async ({ page }) => {
  await page.clock.install();
  await page.goto(`${fixturePage}?uiState=apply-error`);
  await expect(page.locator('#lab-shell')).toHaveAttribute('data-runtime-phase', 'error');
  await page.clock.fastForward(2000);
  await expect(page.locator('#mode-vortex')).toBeDisabled();
  await expect(page.locator('#lab-shell')).toHaveAttribute('data-runtime-phase', 'error');
  await expect(page.locator('#runtime-notice')).not.toContainText('internal');
  await page.evaluate(() => {
    window.uiTest.port.applyConfig = function(config) { this.calls.push({ type: 'applyConfig', config }); };
  });
  await page.locator('#preset-file').setInputFiles({ name: 'retry.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, app: '3D-WEB-05', config: {
      mode: 'attractor', backendPreference: 'auto', particleCount: 20000, speed: 1.2,
      particleSize: 2.5, particleColor: '#6ce6ff', strength: 1.5,
    } })) });
  await expect(page.locator('#toast')).toHaveText('Đã nhập preset hợp lệ.');
  await expect(page.locator('#mode-vortex')).toBeEnabled();
});

test('renderer reset errors during import do not expose backend details', async ({ page }) => {
  await page.goto(fixturePage);
  await page.evaluate(() => {
    window.uiTest.port.reset = () => { throw new Error('sensitive backend detail'); };
  });
  await page.locator('#preset-file').setInputFiles({ name: 'preset.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, app: '3D-WEB-05', config: {
      mode: 'vortex', backendPreference: 'auto', particleCount: 20000, speed: 1.2,
      particleSize: 2.5, particleColor: '#6ce6ff', strength: 1.5,
    } })) });
  await expect(page.locator('#toast')).toContainText('Không thể khởi tạo lại mô phỏng');
  await expect(page.locator('#toast')).toContainText('Cấu hình đã được áp dụng');
  await expect(page.locator('#toast')).not.toContainText('sensitive');
  await expect(page.locator('#mode-vortex')).toHaveAttribute('aria-pressed', 'true');
});

test('a pending file read cannot apply configuration after unmount', async ({ page }) => {
  await page.goto(fixturePage);
  await page.evaluate(() => {
    File.prototype.text = () => new Promise<string>(resolve => {
      window.uiTest.finishImport = () => resolve(JSON.stringify({ schemaVersion: 1, app: '3D-WEB-05', config: {
        mode: 'vortex', backendPreference: 'auto', particleCount: 20000, speed: 1.2,
        particleSize: 2.5, particleColor: '#6ce6ff', strength: 1.5,
      } }));
    });
    window.uiTest.port.calls.length = 0;
  });
  await page.locator('#preset-file').setInputFiles({ name: 'delayed.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  await expect.poll(() => page.evaluate(() => Boolean(window.uiTest.finishImport))).toBe(true);
  await page.evaluate(async () => {
    window.uiTest.unmount();
    window.uiTest.finishImport?.();
    await Promise.resolve();
  });
  expect(await page.evaluate(() => window.uiTest.port.calls.filter(c => c.type !== 'getStatus').map(c => c.type)))
    .toEqual(['dispose']);
  await expect(page.locator('#mode-attractor')).toHaveAttribute('aria-pressed', 'true');
});

test('import applies atomically once and invalid imports do not call the port', async ({ page }) => {
  await page.goto(fixturePage);
  const preset = {
    schemaVersion: 1, app: '3D-WEB-05', config: {
      mode: 'vortex', backendPreference: 'webgl2', particleCount: 32000,
      speed: 2.2, particleSize: 4, particleColor: '#ff8800', strength: 2.4,
    },
  };
  await page.evaluate(() => { window.uiTest.port.calls.length = 0; });
  await page.locator('#preset-file').setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(preset)) });
  await expect(page.locator('#toast')).toHaveText('Đã nhập preset hợp lệ.');
  expect(await page.evaluate(() => window.uiTest.port.calls.filter(c => c.type !== 'getStatus').map(c => c.type)))
    .toEqual(['applyConfig', 'reset']);
  expect(await page.evaluate(() => window.uiTest.port.calls.find(c => c.type === 'applyConfig')))
    .toMatchObject({ config: preset.config });
  await page.evaluate(() => { window.uiTest.port.calls.length = 0; });
  preset.config.speed = 99;
  await page.locator('#preset-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(preset)) });
  await expect(page.locator('#toast')).toContainText('Tốc độ nằm ngoài');
  await expect(page.locator('#speed-value')).toContainText('2,2');
  expect(await page.evaluate(() => window.uiTest.port.calls.filter(c => c.type !== 'getStatus'))).toEqual([]);
});

test('rejected apply preserves the previous UI config and does not reset', async ({ page }) => {
  await page.goto(fixturePage);
  await page.evaluate(() => {
    window.uiTest.port.calls.length = 0;
    window.uiTest.port.applyConfig = () => { throw new Error('sensitive backend detail'); };
  });
  await page.locator('#speed').fill('2.5');
  await expect(page.locator('#speed')).toHaveValue('1.2');
  await expect(page.locator('#speed-value')).toContainText('1,2');
  await expect(page.locator('#toast')).toContainText('Không thể cập nhật renderer');
  await expect(page.locator('#toast')).not.toContainText('sensitive');
  expect(await page.evaluate(() => window.uiTest.port.calls.filter(c => c.type !== 'getStatus'))).toEqual([]);
});
