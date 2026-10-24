import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const fixturePage = '/tests/e2e/fixtures/renderer-port.html';

const validPreset = {
  schemaVersion: 1,
  app: '3D-WEB-05',
  config: {
    mode: 'vortex',
    backendPreference: 'webgl2',
    particleCount: 32000,
    speed: 2.2,
    particleSize: 4,
    particleColor: '#ff8800',
    strength: 2.4,
  },
};

test('luồng điều khiển chính hoạt động và không tràn ngang', async ({ page }) => {
  await page.goto(fixturePage);

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Make motion');
  await expect(page.locator('#actual-backend')).toHaveText('WebGPU');

  await page.locator('#mode-vortex').click();
  await expect(page.locator('#mode-vortex')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#scene-mode')).toHaveText('VORTEX FIELD');
  await expect(page.locator('#strength-label')).toHaveText('Vortex strength');

  await page.locator('#speed').fill('2.5');
  await expect(page.locator('#speed-value')).toContainText('2,5');

  await page.locator('#restore-defaults').click();
  await expect(page.locator('#mode-attractor')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#speed-value')).toContainText('1,2');

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test('fixture runtime hiển thị đúng fallback và error', async ({ page }) => {
  await page.goto(`${fixturePage}?uiState=fallback-webgl2`);
  await expect(page.locator('#lab-shell')).toHaveAttribute('data-runtime-phase', 'fallback');
  await expect(page.locator('#runtime-notice')).toHaveAttribute('data-tone', 'warning');
  await expect(page.locator('#actual-backend')).toContainText('WebGL2 fallback');
  await expect(page.locator('#mode-vortex')).toBeEnabled();

  await page.goto(`${fixturePage}?uiState=error`);
  await expect(page.locator('#lab-shell')).toHaveAttribute('data-runtime-phase', 'error');
  await expect(page.locator('#runtime-notice')).toHaveAttribute('role', 'alert');
  await expect(page.locator('#runtime-notice-title')).toHaveText('Renderer gặp lỗi');
  await expect(page.locator('#runtime-notice-message')).not.toContainText(/Error:|at \w+ \(|\.tsx?:\d+/);
  await expect(page.locator('[data-runtime-control]:not(:disabled)')).toHaveCount(0);
  await expect(page.locator('#export-preset')).toBeEnabled();
  await expect(page.locator('#import-preset')).toBeEnabled();
});

test('preset hợp lệ được import, preset lỗi không làm đổi state', async ({ page }) => {
  await page.goto(fixturePage);

  await page.locator('#preset-file').setInputFiles({
    name: 'valid-preset.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(validPreset)),
  });
  await expect(page.locator('#mode-vortex')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#particle-count-value')).toContainText('32.000');
  await expect(page.locator('#particle-color-value')).toHaveText('#FF8800');

  const invalidPreset = structuredClone(validPreset);
  invalidPreset.config.speed = 99;
  await page.locator('#preset-file').setInputFiles({
    name: 'invalid-preset.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(invalidPreset)),
  });

  await expect(page.locator('#toast')).toContainText('Tốc độ nằm ngoài');
  await expect(page.locator('#particle-count-value')).toContainText('32.000');
  await expect(page.locator('#speed-value')).toContainText('2,2');
});

test('preset export tạo JSON đúng schema', async ({ page }) => {
  await page.goto(fixturePage);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-preset').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('particle-lab-attractor-preset.json');

  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const exported = JSON.parse(await readFile(downloadPath as string, 'utf8')) as typeof validPreset;
  expect(exported.schemaVersion).toBe(1);
  expect(exported.app).toBe('3D-WEB-05');
  expect(exported.config.mode).toBe('attractor');
  expect(exported.config.particleCount).toBe(20000);
});

test('không có vi phạm WCAG tự động mức A/AA @a11y', async ({ page }) => {
  for (const url of ['/', '/?uiState=fallback-webgl2', '/?uiState=unsupported', '/?uiState=error']) {
    await page.goto(`${fixturePage}${url.slice(1)}`);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations, `Axe violations tại ${url}`).toEqual([]);
  }
});

test('tạo ảnh minh chứng desktop/mobile theo fixture @evidence', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    let seed = 2026;
    Math.random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  });

  const screenshotDir = path.resolve(process.cwd(), 'docs/04-testing/screenshots');
  const isDesktop = testInfo.project.name === 'desktop-chromium';
  const cases = isDesktop
    ? [
        { url: '/', file: 'automated-desktop-1440x1000.png' },
        { url: '/?uiState=fallback-webgl2', file: 'automated-fallback-1440x1000.png' },
      ]
    : [
        { url: '/', file: 'automated-mobile-500x844.png' },
        { url: '/?uiState=error', file: 'automated-error-500x844.png' },
      ];

  for (const evidence of cases) {
    await page.goto(`${fixturePage}${evidence.url.slice(1)}`);
    await expect(page.locator('#lab-shell')).toBeVisible();
    await page.screenshot({
      path: path.join(screenshotDir, evidence.file),
      animations: 'disabled',
    });
  }
});
