import {Audit} from '@siteimprove/alfa-test-utils';
import {test} from '@playwright/test';
import {Playwright} from '@siteimprove/alfa-playwright';

const alfa = async (targetURL, act) => {
  test('alfa', async ({page}) => {
    await page.goto(targetURL);
    const document = await page.evaluateHandle(() => window.document);
    const alfaPage = await Playwright.toPage(document);
    const alfaResult = await Audit.run(alfaPage);
    act.result = alfaResult;
  });
};

export default alfa;
