import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  const name0 = await page.innerText('.navbar__title');
  expect(name0).toBe('Playwright');
  await page.goto('https://example.com/');
  const name1 = await page.innerText('h1');
  expect(name1).toBe('Example Domain');
});
