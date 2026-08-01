import { renderInTestApp } from '@backstage/test-utils';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';

import { ProjectDetailContent, TemplateRunContent } from './IdpPages';
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
    id: 'examples-latest',
    kind: 'Plan',
    planRef: 'plan:examples-latest',
    actor: { entityRef: 'user:default/guest', type: 'user' },
    targetEntityRef: 'system:default/examples',
    eventType: 'plan.created',
    createdAt: '2026-07-31T00:01:00Z',
    status: 'planned',
    expectedChangeSummary: 'Create a reviewable plan preview',
    requiredApproval: 'none',
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
    createTemplatePlanPreview: jest.fn(),
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

describe('TemplateRunContent', () => {
  it('creates and displays a side-effect-free Plan preview instead of executing a template', async () => {
    const preview = {
      plan: {
        id: 'preview-node',
        kind: 'Plan' as const,
        planRef: 'plan:preview-node',
        actor: { entityRef: 'user:default/guest', type: 'user' as const },
        targetEntityRef: 'system:default/examples',
        eventType: 'plan.created' as const,
        createdAt: '2026-08-01T00:00:00.000Z',
        status: 'needs-approval' as const,
        expectedChangeSummary:
          'Preview node-api for examples in examples-dev; no Scaffolder task, Git PR, AI generation, or execution is started.',
        requiredApproval: 'environment-owner' as const,
        policyDecision: {
          result: 'needs-approval' as const,
          reasons: [
            'Production-like or critical environment targets require explicit human approval before side effects.',
          ],
          requiredApprovalRefs: ['group:default/guests'],
        },
        riskSummary: {
          level: 'medium' as const,
          summary: 'Production-like target requires approval before execution.',
          factors: ['production-like-environment', 'side-effect-free-preview'],
        },
      },
      operationLog: {
        id: 'log-preview-node',
        operationLogRef: 'operation-log:preview-node',
        actor: { entityRef: 'user:default/guest', type: 'user' as const },
        targetEntityRef: 'system:default/examples',
        eventType: 'plan.created' as const,
        createdAt: '2026-08-01T00:00:00.000Z',
        status: 'needs-approval' as const,
        message: 'Plan preview needs-approval.',
      },
    };
    const controlContextApi = {
      getProjectControlContext: jest.fn(),
      createTemplatePlanPreview: jest.fn().mockResolvedValue(preview),
    };

    const rendered = await renderInTestApp(
      <Routes>
        <Route
          path="/idp/templates/:templateId/run"
          element={
            <TemplateRunContent
              projects={[project]}
              environments={[environment]}
              templates={[
                {
                  ...template,
                  scaffolderTemplateRef: 'template:default/node-api',
                  parameters: [
                    {
                      name: 'serviceName',
                      label: 'Service name',
                      type: 'string',
                      required: true,
                    },
                  ],
                },
              ]}
              operationLogs={[] as IdpOperationLog[]}
              executions={[] as IdpTemplateExecution[]}
              refresh={jest.fn()}
              controlContextApi={controlContextApi}
            />
          }
        />
      </Routes>,
      { routeEntries: ['/idp/templates/node-api/run'] },
    );

    const selectInputs = rendered.container.querySelectorAll(
      'input.MuiSelect-nativeInput',
    );
    fireEvent.change(selectInputs[0], {
      target: { value: 'examples' },
    });
    fireEvent.change(selectInputs[1], {
      target: { value: 'examples-dev' },
    });
    const textInputs =
      rendered.container.querySelectorAll('input[type="text"]');
    fireEvent.change(textInputs[0], {
      target: { value: 'checkout-api' },
    });
    fireEvent.click(screen.getByText('Create plan preview'));

    await waitFor(() => {
      expect(controlContextApi.createTemplatePlanPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          projectRef: 'system:default/examples',
          environmentRef: 'resource:default/examples-dev',
          templateRef: 'template:default/node-api',
          parameters: { serviceName: 'checkout-api' },
        }),
      );
    });
    expect(
      controlContextApi.createTemplatePlanPreview,
    ).not.toHaveBeenCalledWith(
      expect.objectContaining({
        actor: expect.anything(),
      }),
    );
    expect(screen.getByText('Expected change')).toBeTruthy();
    expect(screen.getByText(preview.plan.expectedChangeSummary)).toBeTruthy();
    expect(screen.getByText('Audit actor: user:default/guest')).toBeTruthy();
    expect(screen.getByText('Policy: needs-approval')).toBeTruthy();
    expect(
      screen.getByText('Required approval: environment-owner'),
    ).toBeTruthy();
    expect(screen.getByText('Risk: medium')).toBeTruthy();
    expect(screen.getByText('production-like-environment')).toBeTruthy();
    expect(screen.queryByText('Create TemplateExecution')).toBeNull();
  });
});
