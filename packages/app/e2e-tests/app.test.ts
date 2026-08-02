/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { test, expect, Page } from '@playwright/test';

const enterApp = async (page: Page) => {
  await page.goto('/');

  const enterButton = page.getByRole('button', { name: 'Enter' });
  await expect(enterButton).toBeVisible();
  await enterButton.click();

  await expect(
    page.getByRole('navigation').getByRole('link', {
      name: 'IDP',
      exact: true,
    }),
  ).toBeVisible();
};

test('App should open Bara control-plane entry after guest entry', async ({
  page,
}) => {
  await enterApp(page);

  const nav = page.getByRole('navigation');
  await expect(
    nav.getByRole('link', { name: 'IDP', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Bara IDP', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Data boundary', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/not live Catalog, GitHub, or runtime status/),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open Project context' }),
  ).toHaveAttribute('href', '/idp/projects/examples');
  await expect(page.getByText('Connected', { exact: true })).toHaveCount(0);
  await expect(
    nav.getByRole('link', { name: 'Catalog', exact: true }),
  ).toBeVisible();
  await nav.getByRole('link', { name: 'Catalog', exact: true }).click();
  await expect(page).toHaveURL(/\/catalog$/);
});

test('IDP Project detail should show recommended action before backend control context and record a dry-run', async ({
  page,
}) => {
  await enterApp(page);
  await page.goto('/idp/projects/examples');

  const recommendedHeading = page.getByRole('heading', {
    name: 'Recommended next action',
  });
  const backendHeading = page.getByRole('heading', {
    name: 'Backend control context',
  });
  await expect(recommendedHeading).toBeVisible();
  await expect(backendHeading).toBeVisible();
  const headingOrder = await page
    .getByRole('heading')
    .evaluateAll(headings =>
      headings.map(heading => heading.textContent?.trim() ?? ''),
    );
  expect(headingOrder.indexOf('Recommended next action')).toBeLessThan(
    headingOrder.indexOf('Backend control context'),
  );
  await expect(
    page.getByRole('heading', { name: 'system:default/examples' }),
  ).toBeVisible();
  await expect(page.getByText('catalog-and-git')).toBeVisible();
  await expect(page.getByText('resource:default/examples-dev')).toBeVisible();
  await expect(
    page.getByText('template:default/example-nodejs-template'),
  ).toBeVisible();
  await expect(page.getByText('Approval summary')).toBeVisible();

  await page.getByRole('button', { name: 'Create plan preview' }).click();
  await expect(page).toHaveURL(
    /\/idp\/templates\/node-api\/run\?projectId=examples&environmentId=examples-dev/,
  );
  await expect(page.getByText('Step: input')).toBeVisible();
  await expect(page.getByText('Examples', { exact: true })).toBeVisible();
  await expect(page.getByText('examples-dev', { exact: true })).toBeVisible();

  await page.locator('#template-parameter-serviceName').fill('examples-api');
  await page.getByRole('button', { name: 'Create plan preview' }).click();
  await expect(
    page.getByRole('heading', { name: 'Expected change' }),
  ).toBeVisible();
  await expect(page.getByText('Policy:', { exact: false })).toBeVisible();
  await expect(page.getByText('Risk:', { exact: false })).toBeVisible();

  await expect(
    page.getByRole('heading', { name: 'Record-only dry-run' }),
  ).toBeVisible();
  await expect(
    page.getByText(
      /does not start a Scaffolder task, create a Git pull request, or start external execution/,
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Run dry-run' }).click();
  await expect(
    page.getByText(/ActionRun ref: action-run:dry-run-/),
  ).toBeVisible();
  await expect(
    page.getByText(/OperationLog ref:\s*operation-log:dry-run-/),
  ).toBeVisible();
  await expect(page.getByText('Scaffolder task started: false')).toBeVisible();
  await expect(page.getByText('Git pull request created: false')).toBeVisible();
  await expect(
    page.getByText('External execution started: false'),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Record-only dry-run completed; no Scaffolder task, Git PR, or external execution was started.',
      { exact: true },
    ),
  ).toBeVisible();

  await page
    .getByRole('button', { name: 'Open Project control context' })
    .click();
  await expect(page).toHaveURL(/\/idp\/projects\/examples$/);
  await expect(
    page.getByRole('heading', { name: 'Backend control context' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /action-run:dry-run-/ }),
  ).toBeVisible();
  await expect(
    page.getByText('dry-run · dry-run-succeeded', { exact: true }),
  ).toBeVisible();
});

test('IDP Environment detail should preserve Plan preview project and environment context', async ({
  page,
}) => {
  await enterApp(page);
  await page.goto('/idp/environments/examples-dev');

  await expect(
    page.getByRole('heading', { name: 'examples-dev' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Create plan preview' }).click();
  await expect(page).toHaveURL(
    /\/idp\/templates\/node-api\/run\?projectId=examples&environmentId=examples-dev/,
  );
  await expect(page.getByText('Step: input')).toBeVisible();
  await expect(page.getByText('Examples', { exact: true })).toBeVisible();
  await expect(page.getByText('examples-dev', { exact: true })).toBeVisible();
});
