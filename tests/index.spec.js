import {test, expect} from '@playwright/test';

test.describe('main suite', () => {

  test('Playwright home page', async ({page}) => {
    await page.goto('https://playwright.dev/');
    const name0 = await page.innerText('.navbar__title');
    expect(name0).toBe('Playwright');
  });

  test('Example', async ({page}) => {
    await page.goto('https://example.com/');
    const name1 = await page.innerText('h1');
    expect(name1).toBe('Example Domain');
    const docLoc = page.getByRole('document');
    const docLang = (await docLoc.getAttribute('lang')) || '';
    expect(docLang.length).toBeGreaterThan(0);
  });

});
