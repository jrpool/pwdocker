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
  await page.goto(report.target.url);
  const document = await page.evaluateHandle(() => window.document);
  const alfaPage = await Playwright.toPage(document);
  const result = await Audit.run(alfaPage);
  report.acts.push({
    type: 'test',
    which: 'alfa',
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
    const message = `ERROR: ASLint injection failed (${error.message.slice(0, 400)})`;
    data.prevented = true;
    data.error = message;
  });
  const reportLoc = page.locator('#aslintResult');
  // If the injection succeeded:
  if (! data.prevented) {
    try {
      // Wait for the test result to be attached to the page.
      const waitOptions = {
        state: 'attached',
        timeout: 1000 * process.env.TIMELIMIT_ASLINT
      };
      await reportLoc.waitFor(waitOptions);
    }
    // If the result was not attached in time:
    catch(error) {
      // Report this.
      const message = 'Attachment of test results to page failed';
      data.prevented = true;
      data.error = `${message} (${error.message})`;
    };
  }
  // If the injection and the result attachment both succeeded:
  if (! data.prevented) {
    // Get their text.
    const toolReport = await reportLoc.textContent();
    // Populate the act report.
    result = JSON.parse(toolReport);
    // If any rules were reported violated:
    if (result.rules) {
      // For each such rule:
      Object.keys(result.rules).forEach(ruleID => {
        // If the rule was passed or skipped or rules to be tested were specified and exclude it:
        const excluded = act.rules && ! act.rules.includes(ruleID);
        const instanceType = result.rules[ruleID].status.type;
        // If rules to be tested were specified and exclude it or the rule was passed or skipped:
        if (excluded || ['passed', 'skipped'].includes(instanceType)) {
          // Delete the rule report.
          delete result.rules[ruleID];
        }
      });
    }
  }
  // Return the act report.
  try {
    JSON.stringify(data);
  }
  catch(error) {
    const message = `ERROR: ASLint result cannot be made JSON (${error.message.slice(0, 200)})`;
    data = {
      prevented: true,
      error: message
    };
  };
  return {
    data,
    result
  };

  const document = await page.evaluateHandle(() => window.document);
  const alfaPage = await Playwright.toPage(document);
  const result = await Audit.run(alfaPage);
  report.acts.push({
    type: 'test',
    which: 'alfa',
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
