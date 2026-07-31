import { renderInTestApp } from '@backstage/test-utils';
import { act, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';

import { ProjectDetailContent } from './IdpPages';
import {
  IdpEnvironment,
  IdpOperationLog,
  IdpProject,
  IdpProjectControlContext,
  IdpTemplate,
  IdpTemplateExecution,
} from '../types';

const project: IdpProject = {
  id: 'examples',
  name: 'Examples',
  description: 'Example Project',
  owner: 'group:default/guests',
  repositories: ['https://github.com/acme/examples'],
  relatedCatalogEntityRefs: ['system:default/examples'],
  environmentIds: ['examples-dev'],
  templateIds: ['node-api'],
  status: 'active',
  createdAt: '2026-07-31T00:00:00Z',
  updatedAt: '2026-07-31T00:00:00Z',
};

const environment: IdpEnvironment = {
  id: 'examples-dev',
  projectId: 'examples',
  name: 'examples-dev',
  type: 'dev',
  deploymentStatus: 'running',
  appStatus: 'running',
  infraStatus: 'running',
  alertStatus: 'normal',
  relatedCatalogEntityRefs: ['resource:default/examples-dev'],
  createdAt: '2026-07-31T00:00:00Z',
  updatedAt: '2026-07-31T00:00:00Z',
};

const template: IdpTemplate = {
  id: 'node-api',
  name: 'Node API',
  kind: 'application',
  description: 'Node service template',
  outputs: ['service'],
  version: '1.0.0',
  usageCount: 1,
  status: 'available',
  displayOrder: 1,
  enabled: true,
  allowedRoles: ['group:default/guests'],
  parameters: [],
  createdAt: '2026-07-31T00:00:00Z',
  updatedAt: '2026-07-31T00:00:00Z',
};

const controlContext = (
  overrides: Partial<IdpProjectControlContext> = {},
): IdpProjectControlContext => ({
  projectRef: 'system:default/examples',
  project: {
    title: 'Examples',
    ownerRefs: ['group:default/guests'],
    catalogEntityRef: 'system:default/examples',
  },
  environmentRefs: ['resource:default/examples-dev'],
  templateRefs: ['template:default/example-nodejs-template'],
  allowedActions: {
    observe: 'allowed',
    plan: 'allowed',
    dryRun: 'allowed',
    proposeChange: 'needs-approval',
    executeNonProduction: 'needs-approval',
    executeProduction: 'denied',
    reasons: [
      'Production or critical execution requires explicit human approval.',
      'Catalog ownership is available for approval routing.',
    ],
  },
  recentOperationLogs: [
    {
      id: 'log-1',
      operationLogRef: 'operation-log:log-1',
      actor: { entityRef: 'user:default/guest', type: 'user' },
      targetEntityRef: 'system:default/examples',
      eventType: 'plan.created',
      createdAt: '2026-07-31T00:01:00Z',
      status: 'planned',
      message: 'Backend plan created',
      projectRef: 'system:default/examples',
    },
  ],
  latestPlan: {
    planRef: 'plan:examples-latest',
    status: 'planned',
    expectedChangeSummary: 'Create a reviewable plan preview',
  },
  latestActionRun: {
    actionRunRef: 'action-run:examples-dry-run',
    status: 'dry-run-succeeded',
    mode: 'dry-run',
    resultSummary: 'Dry-run completed',
  },
  desiredState: {
    authoritativeSource: 'catalog-and-git',
    idpBackendStoresAuthoritativeDesiredState: false,
    notes: ['Project desired state stays in Catalog/Git.'],
  },
  ...overrides,
});

const renderProjectDetail = async ({
  contextPromise = Promise.resolve(controlContext()),
}: {
  contextPromise?: Promise<IdpProjectControlContext>;
} = {}) => {
  const controlContextApi = {
    getProjectControlContext: jest.fn().mockReturnValue(contextPromise),
  };

  await renderInTestApp(
    <Routes>
      <Route
        path="/idp/projects/:projectId"
        element={
          <ProjectDetailContent
            projects={[project]}
            environments={[environment]}
            templates={[template]}
            operationLogs={[] as IdpOperationLog[]}
            executions={[] as IdpTemplateExecution[]}
            refresh={jest.fn()}
            controlContextApi={controlContextApi}
          />
        }
      />
    </Routes>,
    { routeEntries: ['/idp/projects/examples'] },
  );

  return { controlContextApi };
};

describe('ProjectDetailContent', () => {
  it('loads and displays backend Project control context', async () => {
    const { controlContextApi } = await renderProjectDetail();

    await waitFor(() => {
      expect(
        screen.getAllByText('system:default/examples').length,
      ).toBeGreaterThan(0);
    });

    expect(controlContextApi.getProjectControlContext).toHaveBeenCalledWith(
      'system:default/examples',
    );
    expect(screen.getByText('Backend control context')).toBeTruthy();
    expect(screen.getByText('group:default/guests')).toBeTruthy();
    expect(screen.getByText('catalog-and-git')).toBeTruthy();
    expect(screen.getByText('resource:default/examples-dev')).toBeTruthy();
    expect(
      screen.getByText('template:default/example-nodejs-template'),
    ).toBeTruthy();
    expect(screen.getByText('plan:examples-latest')).toBeTruthy();
    expect(screen.getByText('action-run:examples-dry-run')).toBeTruthy();
    expect(screen.getByText('Backend plan created')).toBeTruthy();
  });

  it('shows loading and empty runtime states without using local runtime mock data', async () => {
    let resolveContext: (value: IdpProjectControlContext) => void = () => {};
    const contextPromise = new Promise<IdpProjectControlContext>(resolve => {
      resolveContext = resolve;
    });

    await renderProjectDetail({ contextPromise });

    expect(screen.getByText('Loading backend control context...')).toBeTruthy();

    await act(async () => {
      resolveContext(
        controlContext({
          recentOperationLogs: [],
          latestPlan: undefined,
          latestActionRun: undefined,
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          'No recent runtime operation logs are recorded for this Project yet.',
        ),
      ).toBeTruthy();
    });
    expect(
      screen.getByText('No latest plan is recorded for this Project yet.'),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'No latest action run is recorded for this Project yet.',
      ),
    ).toBeTruthy();
  });

  it('shows backend control context errors', async () => {
    await renderProjectDetail({
      contextPromise: new Promise((_, reject) => {
        setTimeout(() => reject(new Error('not found')), 0);
      }),
    });

    await waitFor(() => {
      expect(
        screen.getByText('Backend control context could not be loaded.'),
      ).toBeTruthy();
    });
    expect(screen.getByText('not found')).toBeTruthy();
  });

  it('describes allowed actions as an approval summary, not enforcement', async () => {
    await renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText('Approval summary')).toBeTruthy();
    });

    expect(screen.getByText('Propose change: needs-approval')).toBeTruthy();
    expect(screen.getByText('Execute production: denied')).toBeTruthy();
    expect(
      screen.getByText(
        /not permission enforcement or completed approval records/,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Production or critical execution requires explicit human approval.',
      ),
    ).toBeTruthy();
  });
});
