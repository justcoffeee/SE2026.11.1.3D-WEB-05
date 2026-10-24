import { expect, test } from '@playwright/test';

test('forced WebGL2 initializes a renderer on the application canvas when supported', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const webgl2Supported = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl2') !== null;
  });

  await page.goto('/?webgl=1');
  await expect(page.locator('#actual-backend')).toHaveText(webgl2Supported ? 'WebGL2 fallback' : 'Không khả dụng');
  await expect(page.locator('#runtime-phase-label')).toHaveText(webgl2Supported ? 'FALLBACK ACTIVE' : 'UNSUPPORTED');

  if (webgl2Supported) {
    const dimensions = await page.locator('#preview-canvas').evaluate((canvas: HTMLCanvasElement) => ({
      width: canvas.width,
      height: canvas.height,
    }));
    expect(dimensions.width).toBeGreaterThan(1);
    expect(dimensions.height).toBeGreaterThan(1);
    await expect(page.locator('#toggle-preview')).toBeEnabled();
  }
  expect(pageErrors).toEqual([]);
});
