import { expect, test } from '@playwright/test';

const fixturePage = '/tests/e2e/fixtures/renderer-port.html';

test('live status replaces metrics and backend identity across failure and recovery', async ({ page }) => {
  await page.clock.install();
  await page.goto(fixturePage);
  await expect(page.locator('#actual-backend')).toHaveText('WebGPU');
  await page.evaluate(() => window.uiTest.setStatus({ fps: 61.7, gpuTimingAvailable: true, gpuTimeMs: 1.25 }));
  await page.clock.fastForward(500);
  await expect(page.locator('#runtime-fps')).toHaveText('62 FPS');
  await expect(page.locator('#gpu-timing')).toHaveText('1.25 ms');

  await page.evaluate(() => window.uiTest.setStatus({ actual: 'webgl2', requested: 'webgpu', fps: 48,
    gpuTimingAvailable: false, gpuTimeMs: 0 }));
  await page.clock.fastForward(500);
  await expect(page.locator('#actual-backend')).toHaveText('WebGL2 fallback');
  await expect(page.locator('#runtime-fps')).toHaveText('48 FPS');
  await expect(page.locator('#gpu-timing')).toHaveText('Không khả dụng');

  await page.evaluate(() => window.uiTest.setStatus({ actual: 'unavailable' }));
  await page.clock.fastForward(500);
  await expect(page.locator('#actual-backend')).toHaveText('Không khả dụng');
  await expect(page.locator('#runtime-fps')).toHaveText('—');
  await expect(page.locator('#mode-vortex')).toBeDisabled();
  await expect(page.locator('#export-preset')).toBeEnabled();
  await expect(page.locator('#import-preset')).toBeEnabled();

  await page.evaluate(() => window.uiTest.setFailure(true));
  await page.clock.fastForward(500);
  await expect(page.locator('#lab-shell')).toHaveAttribute('data-runtime-phase', 'error');
  await expect(page.locator('#runtime-notice')).not.toContainText('internal');

  await page.evaluate(() => {
    window.uiTest.setFailure(false);
    window.uiTest.setStatus({ actual: 'webgpu', fps: 60, gpuTimingAvailable: true, gpuTimeMs: 2 });
  });
  await page.clock.fastForward(500);
  await expect(page.locator('#runtime-phase-label')).toHaveText('READY');
  await expect(page.locator('#runtime-notice')).toBeHidden();
  await expect(page.locator('#actual-backend')).toHaveText('WebGPU');
  await expect(page.locator('#mode-vortex')).toBeEnabled();
  await expect(page.locator('#gpu-timing')).toHaveText('2.00 ms');
});

test('paused and invalid samples never keep old GPU timing visible', async ({ page }) => {
  await page.clock.install();
  await page.goto(fixturePage);
  await page.evaluate(() => window.uiTest.setStatus({ fps: 60, gpuTimingAvailable: true, gpuTimeMs: 3 }));
  await page.clock.fastForward(500);
  await expect(page.locator('#gpu-timing')).toHaveText('3.00 ms');
  await page.evaluate(() => window.uiTest.setStatus({ running: false }));
  await page.clock.fastForward(500);
  await expect(page.locator('#runtime-fps')).toHaveText('—');
  await expect(page.locator('#gpu-timing')).toHaveText('Không khả dụng');
  await expect(page.locator('#gpu-timing-detail')).toContainText('tạm dừng');
  await page.evaluate(() => window.uiTest.setStatus({ running: true, fps: NaN, gpuTimeMs: -1 }));
  await page.clock.fastForward(500);
  await expect(page.locator('#runtime-fps')).toHaveText('—');
  await expect(page.locator('#gpu-timing')).toHaveText('Không khả dụng');
});
