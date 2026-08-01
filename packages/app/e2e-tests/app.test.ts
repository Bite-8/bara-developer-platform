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

import { test, expect } from '@playwright/test';

test('App should render the welcome page', async ({ page }) => {
  await page.goto('/');

  const enterButton = page.getByRole('button', { name: 'Enter' });
  await expect(enterButton).toBeVisible();
  await enterButton.click();

  const nav = page.getByRole('navigation');
  await expect(
    nav.getByRole('link', { name: 'Catalog', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'APIs', exact: true }),
  ).toBeVisible();
});

test('IDP Project detail should show recommended action before backend control context', async ({
  page,
}) => {
  await page.goto('/');

  const enterButton = page.getByRole('button', { name: 'Enter' });
  await expect(enterButton).toBeVisible();
  await enterButton.click();

  await expect(
    page.getByRole('navigation').getByRole('link', {
      name: 'Catalog',
      exact: true,
    }),
  ).toBeVisible();
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
  await expect(page.getByText('Expected change')).toBeVisible();
  await expect(page.getByText('Policy:', { exact: false })).toBeVisible();
  await expect(page.getByText('Risk:', { exact: false })).toBeVisible();
});
