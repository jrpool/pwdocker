const aChecker = require('accessibility-checker');
import {Audit, Logging} from '@siteimprove/alfa-test-utils';
import AxeBuilder from '@axe-core/playwright';
import {expect, test} from '@playwright/test';
import {Playwright} from '@siteimprove/alfa-playwright';

const report = {
  target: {
    what: 'Example',
    url: 'https://example.com/'
  }
};

test.describe('simple', () => {
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

test.describe('alfa', () => {
  test('alfa', async ({page}) => {
    await page.goto(report.target.url);
    const document = await page.evaluateHandle(() => window.document);
    const alfaPage = await Playwright.toPage(document);
    const alfaResult = await Audit.run(alfaPage);
    Logging.fromAudit(alfaResult).print();
  });
});

test.describe('axe', () => {
  test('axe', async ({page}) => {
    await page.goto(report.target.url);
    const axeBuilder = new AxeBuilder({page});
    const results = await axeBuilder.analyze();
    console.log(`Axe results:\n${JSON.stringify(results, null, 2)}`);
  });
});

test.describe('ibm', () => {
  test('ibm', async ({page}) => {
    await page.goto(report.target.url);
    const results = await aChecker.getCompliance(page, 'pwdocker');
    console.log(`ibm results:\n${JSON.stringify(results, null, 2)}`);
    await aChecker.close();
  });
});
