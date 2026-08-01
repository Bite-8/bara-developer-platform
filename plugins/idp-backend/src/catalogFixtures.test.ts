import {
  resourceEntityV1alpha1Validator,
  systemEntityV1alpha1Validator,
} from '@backstage/catalog-model';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseAllDocuments } from 'yaml';

const fixturePath = resolve(
  __dirname,
  '../../../examples/idp-projects/payment-platform.yaml',
);

const readFixtureEntities = () =>
  parseAllDocuments(readFileSync(fixturePath, 'utf8')).map(document =>
    document.toJS(),
  );

describe('Bara Catalog desired-state fixtures', () => {
  it('models a Project and development/production Environments with standard Catalog kinds', async () => {
    const [project, development, production] = readFixtureEntities();

    await expect(systemEntityV1alpha1Validator.check(project)).resolves.toBe(
      true,
    );
    await expect(
      resourceEntityV1alpha1Validator.check(development),
    ).resolves.toBe(true);
    await expect(
      resourceEntityV1alpha1Validator.check(production),
    ).resolves.toBe(true);

    expect(project).toMatchObject({
      kind: 'System',
      metadata: {
        name: 'payment-platform',
        annotations: {
          'bara.dev/environment-ref':
            'resource:default/payment-platform-dev,resource:default/payment-platform-prod',
          'bara.dev/template-ref': 'template:default/example-nodejs-template',
        },
      },
      spec: { owner: 'group:default/guests' },
    });
    expect([development, production]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'Resource',
          metadata: expect.objectContaining({
            name: 'payment-platform-dev',
            annotations: { 'bara.dev/criticality': 'development' },
          }),
          spec: {
            type: 'environment',
            owner: 'group:default/guests',
            system: 'payment-platform',
          },
        }),
        expect.objectContaining({
          kind: 'Resource',
          metadata: expect.objectContaining({
            name: 'payment-platform-prod',
            annotations: { 'bara.dev/criticality': 'production' },
          }),
          spec: {
            type: 'environment',
            owner: 'group:default/guests',
            system: 'payment-platform',
          },
        }),
      ]),
    );
  });

  it('keeps runtime and observed state out of Catalog desired-state fixtures', () => {
    const entities = readFixtureEntities();
    const serializedFixture =
      JSON.stringify(entities).toLocaleLowerCase('en-US');

    expect(serializedFixture).not.toContain('deploymentstatus');
    expect(serializedFixture).not.toContain('observedstatus');
    expect(serializedFixture).not.toContain('lastruntime');
  });
});
