// IMPORTS

const aChecker = require('accessibility-checker');
import {Audit} from '@siteimprove/alfa-test-utils';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs/promises';
import {Playwright} from '@siteimprove/alfa-playwright';
import {test} from '@playwright/test';

// CONSTANTS

process.env.TARGET_URL = 'https://example.com';
process.env.TARGET_WHAT = 'Example';
process.env.ASLINT_BUNDLE_PATH = `${__dirname}/../node_modules/aslint-testaro/aslint.bundle.js`;
process.env.TIMELIMIT_ASLINT = 15;

const report = {
  target: {
    url: process.env.TARGET_URL,
    what: process.env.TARGET_WHAT
  },
  acts: []
};

// TESTS

test.afterAll(async () => {
  const reportJSON = `${JSON.stringify(report, null, 2)}\n`;
  await fs.writeFile(`${__dirname}/report.json`, reportJSON);
});

test('alfa', async ({page}) => {
  // Navigate to the target.
  await page.goto(report.target.url);
  // Get the page content.
  const document = await page.evaluateHandle(() => window.document);
  const alfaPage = await Playwright.toPage(document);
  // Perform the tool tests and get the result.
  const result = await Audit.run(alfaPage);
  // Add the data and result to the report.
  report.acts.push({
    type: 'test',
    which: 'alfa',
    data: {},
    result
  });
});

test('aslint', async ({page}) => {
  await page.goto(report.target.url);
  // Get the ASLint runner and bundle scripts.
  const aslintRunner = await fs.readFile(`${__dirname}/aslint.js`, 'utf8');
  const aslintBundle = await fs.readFile(
    `${__dirname}/../node_modules/aslint-testaro/aslint.bundle.js`, 'utf8'
  );
  // Initialize the data and result.
  let data = {};
  let result = {};
  // Inject the ASLint bundle and runner into the head of the page.
  await page.evaluate(args => {
    const {aslintBundle, aslintRunner} = args;
    // Bundle.
    const bundleEl = document.createElement('script');
    bundleEl.id = 'aslintBundle';
    bundleEl.textContent = aslintBundle;
    document.head.insertAdjacentElement('beforeend', bundleEl);
    // Runner.
    const runnerEl = document.createElement('script');
    runnerEl.textContent = aslintRunner;
    document.body.insertAdjacentElement('beforeend', runnerEl);
  }, {aslintBundle, aslintRunner})
  .catch(error => {
    const message = `Script injection failed (${error.message.slice(0, 400)})`;
    data.prevented = true;
    data.error = message;
  });
  const reportLoc = page.locator('#aslintResult');
  // If the injection succeeded:
  if (! data.prevented) {
    try {
      // Wait for the test result to be in the page.
      const waitOptions = {
        state: 'attached',
        timeout: 1000 * process.env.TIMELIMIT_ASLINT
      };
      await reportLoc.waitFor(waitOptions);
    }
    // If the result was not attached in time:
    catch(error) {
      // Report this.
      const message = 'Insertion of test result into page failed or timed out';
      data.prevented = true;
      data.error = `${message} (${error.message})`;
    };
  }
  // If the injection and the result insertion both succeeded:
  if (! data.prevented) {
    // Populate the result.
    const resultJSON = await reportLoc.textContent();
    try {
      // Parse it as JSON.
      result = JSON.parse(resultJSON);
    }
    // If it is not JSON:
    catch(error) {
      // Report this.
      const message = 'Test result not JSON';
      data.prevented = true;
      data.error = `${message} (${error.message})`;
    };
  }
  // Add the data and result to the report.
  report.acts.push({
    type: 'test',
    which: 'aslint',
    data,
    result
  });
});

test('axe', async ({page}) => {
  await page.goto(report.target.url);
  const axeBuilder = new AxeBuilder({page});
  const result = await axeBuilder.analyze();
  report.acts.push({
    type: 'test',
    which: 'axe',
    result
  });
});

test('ibm', async ({page}) => {
  await page.goto(report.target.url);
  const result = await aChecker.getCompliance(page, '');
  await aChecker.close();
  report.acts.push({
    type: 'test',
    which: 'ibm',
    result
  });
});
