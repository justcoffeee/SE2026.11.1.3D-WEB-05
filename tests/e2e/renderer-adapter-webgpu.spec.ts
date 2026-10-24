import { expect, test } from '@playwright/test';

test('WebGPU adapter initializes and renders on the application canvas when available', async ({ page }) => {
  const supported = await page.evaluate(async () => {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    return gpu ? (await gpu.requestAdapter()) !== null : false;
  });
  test.skip(!supported, 'This browser does not expose WebGPU.');
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await expect(page.locator('#actual-backend')).toHaveText('WebGPU', { timeout: 15000 });
  const dimensions = await page.locator('#preview-canvas').evaluate((canvas: HTMLCanvasElement) => ({
    width: canvas.width,
    height: canvas.height,
  }));
  expect(dimensions.width).toBeGreaterThan(1);
  expect(dimensions.height).toBeGreaterThan(1);
  expect(pageErrors).toEqual([]);
});
