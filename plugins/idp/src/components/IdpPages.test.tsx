import { renderInTestApp } from '@backstage/test-utils';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';

import {
  EnvironmentDetailPage,
  IdpDashboardPage,
  ProjectDetailContent,
  TemplateRunContent,
} from './IdpPages';
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

const unrelatedEnvironment: IdpEnvironment = {
  id: 'payment-prod',
  projectId: 'payment-api',
  name: 'payment-prod',
  type: 'prod',
  deploymentStatus: 'running',
  appStatus: 'running',
  infraStatus: 'running',
  alertStatus: 'normal',
  relatedCatalogEntityRefs: ['resource:default/payment-prod'],
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
  environments: [
    {
      entityRef: 'resource:default/examples-dev',
      ownerRefs: ['group:default/guests'],
      criticality: 'development',
    },
  ],
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

const templatePreview = () => ({
  plan: {
    id: 'preview-node',
    kind: 'Plan' as const,
    planRef: 'plan:preview-node',
    actor: { entityRef: 'user:default/guest', type: 'user' as const },
    targetEntityRef: 'system:default/examples',
    eventType: 'plan.created' as const,
    createdAt: '2026-08-01T00:00:00.000Z',
    status: 'planned' as const,
    expectedChangeSummary:
      'Preview node-api for examples in examples-dev without side effects.',
    requiredApproval: 'none' as const,
    policyDecision: {
      result: 'allow' as const,
      reasons: ['Plan preview is side-effect-free.'],
    },
    riskSummary: {
      level: 'low' as const,
      summary: 'Development dry-run only.',
      factors: ['side-effect-free-preview'],
    },
  },
  operationLog: {
    id: 'log-preview-node',
    operationLogRef: 'operation-log:preview-node',
    actor: { entityRef: 'user:default/guest', type: 'user' as const },
    targetEntityRef: 'system:default/examples',
    eventType: 'plan.created' as const,
    createdAt: '2026-08-01T00:00:00.000Z',
    status: 'planned' as const,
    message: 'Plan preview planned.',
  },
});

const dryRunActionRun = () => ({
  actionRun: {
    id: 'dry-run-preview-node',
    kind: 'ActionRun' as const,
    actionRunRef: 'action-run:dry-run-preview-node',
    planRef: 'plan:preview-node',
    actor: { entityRef: 'user:default/guest', type: 'user' as const },
    targetEntityRef: 'system:default/examples',
    eventType: 'dry-run.completed' as const,
    createdAt: '2026-08-01T00:00:01.000Z',
    status: 'dry-run-succeeded' as const,
    mode: 'dry-run' as const,
    resultSummary:
      'Record-only dry-run completed; no Scaffolder task, Git PR, or external execution was started.',
  },
  operationLog: {
    id: 'log-dry-run-preview-node',
    operationLogRef: 'operation-log:dry-run-preview-node',
    actor: { entityRef: 'user:default/guest', type: 'user' as const },
    targetEntityRef: 'system:default/examples',
    eventType: 'dry-run.completed' as const,
    createdAt: '2026-08-01T00:00:01.000Z',
    status: 'dry-run-succeeded' as const,
    message:
      'Record-only dry-run completed; no Scaffolder task, Git PR, or external execution was started.',
    projectRef: 'system:default/examples',
    planRef: 'plan:preview-node',
    actionRunRef: 'action-run:dry-run-preview-node',
  },
  sideEffectBoundary: {
    scaffolderTaskStarted: false as const,
    gitPullRequestCreated: false as const,
    externalExecutionStarted: false as const,
    message:
      'Record-only dry-run completed; no Scaffolder task, Git PR, or external execution was started.',
  },
});

describe('IdpDashboardPage', () => {
  it('labels the portfolio as fixtures and links to authoritative Project context', async () => {
    await renderInTestApp(
      <IdpDashboardPage
        projects={[project]}
        environments={[environment]}
        templates={[template]}
        operationLogs={[]}
        executions={[]}
        refresh={jest.fn()}
      />,
    );

    expect(screen.getByText('Data boundary')).toBeTruthy();
    expect(screen.getByText('Fixture portfolio')).toBeTruthy();
    expect(screen.getByText('Fixture environment highlights')).toBeTruthy();
    expect(screen.getByText('Fixture creation templates')).toBeTruthy();
    expect(screen.getByText('Fixture recent operations')).toBeTruthy();
    expect(
      screen.getByText(/not live Catalog, GitHub, or runtime status/),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: 'Open Project context' })
        .getAttribute('href'),
    ).toBe('/idp/projects/examples');
    expect(screen.queryByText('Connected')).toBeNull();
    expect(screen.queryByText('webhooks ready')).toBeNull();
  });
});

const renderProjectDetail = async ({
  contextPromise = Promise.resolve(controlContext()),
}: {
  contextPromise?: Promise<IdpProjectControlContext>;
} = {}) => {
  const controlContextApi = {
    getProjectControlContext: jest.fn().mockReturnValue(contextPromise),
    createTemplatePlanPreview: jest.fn(),
    createDryRunActionRun: jest.fn(),
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
    expect(screen.getAllByText('plan:examples-latest').length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText('action-run:examples-dry-run').length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Backend plan created').length).toBeGreaterThan(
      0,
    );
  });

  it('renders a user-facing recommended next action before backend control context', async () => {
    await renderProjectDetail();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Recommended next action' }),
      ).toBeTruthy();
    });

    const nextActionHeading = screen.getByRole('heading', {
      name: 'Recommended next action',
    });
    const backendHeading = screen.getByRole('heading', {
      name: 'Backend control context',
    });
    expect(
      nextActionHeading.compareDocumentPosition(backendHeading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Review the latest Plan, then create a fresh preview if the desired change has moved.',
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /does not enforce policy, approve changes, or start execution/,
      ),
    ).toBeTruthy();
  });

  it('summarizes the latest plan, runtime log, risk, and approval context in the recommended action', async () => {
    await renderProjectDetail({
      contextPromise: Promise.resolve(
        controlContext({
          latestPlan: {
            ...controlContext().latestPlan!,
            requiredApproval: 'environment-owner',
            riskSummary: {
              level: 'medium',
              summary: 'Development environment still needs owner review.',
              factors: ['owner-review'],
            },
          },
        }),
      ),
    });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Recommended next action' }),
      ).toBeTruthy();
    });

    expect(screen.getAllByText('plan:examples-latest').length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText('Create a reviewable plan preview')).toBeTruthy();
    expect(
      screen.getByText('Required approval: environment-owner'),
    ).toBeTruthy();
    expect(screen.getByText('Risk: medium')).toBeTruthy();
    expect(screen.getAllByText('Backend plan created').length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText('Plan: allowed · Dry-run: allowed')).toBeTruthy();
    expect(
      screen.getAllByText('Propose change: needs-approval').length,
    ).toBeGreaterThan(0);
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
    expect(
      screen.getByText(
        'No latest Plan is recorded yet. Start with a Plan preview before any side-effecting action.',
      ),
    ).toBeTruthy();
    const planPreviewLink = screen.getByRole('button', {
      name: 'Create plan preview',
    });
    expect(planPreviewLink.getAttribute('href')).toBe(
      '/idp/templates/node-api/run?projectId=examples&environmentId=examples-dev',
    );
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
    expect(
      screen.getByText(
        /Backend context is unavailable, so use the Template run path/,
      ),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: 'Create plan preview' })
        .getAttribute('href'),
    ).toBe(
      '/idp/templates/node-api/run?projectId=examples&environmentId=examples-dev',
    );
  });

  it('describes allowed actions as an approval summary, not enforcement', async () => {
    await renderProjectDetail();

    await waitFor(() => {
      expect(screen.getByText('Approval summary')).toBeTruthy();
    });

    expect(
      screen.getAllByText('Propose change: needs-approval').length,
    ).toBeGreaterThan(0);
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

describe('EnvironmentDetailPage', () => {
  const renderEnvironmentDetail = async ({
    route = '/idp/environments/examples-dev',
    nextProject = project,
    nextTemplate = template,
  }: {
    route?: string;
    nextProject?: IdpProject;
    nextTemplate?: IdpTemplate;
  } = {}) => {
    await renderInTestApp(
      <Routes>
        <Route
          path="/idp/environments/:environmentId"
          element={
            <EnvironmentDetailPage
              projects={[nextProject]}
              environments={[environment]}
              templates={[nextTemplate]}
              operationLogs={[] as IdpOperationLog[]}
              executions={[] as IdpTemplateExecution[]}
              refresh={jest.fn()}
            />
          }
        />
      </Routes>,
      { routeEntries: [route] },
    );
  };

  it('links an Environment detail plan preview CTA to the related available Template run route with Project and Environment context', async () => {
    await renderEnvironmentDetail();

    const cta = screen.getByRole('button', { name: 'Create plan preview' });
    expect(cta.getAttribute('href')).toBe(
      '/idp/templates/node-api/run?projectId=examples&environmentId=examples-dev',
    );
    expect(
      screen.getByText('Preview target: Node API for Examples / examples-dev.'),
    ).toBeTruthy();
    expect(screen.getByText('No execute UI')).toBeTruthy();
    expect(screen.getByText('No external side effects')).toBeTruthy();
    expect(screen.queryByText('Create TemplateExecution')).toBeNull();
  });

  it('falls back to the Templates list when the Environment Project has no usable Template mapping', async () => {
    await renderEnvironmentDetail({
      nextProject: { ...project, templateIds: ['disabled-template'] },
      nextTemplate: {
        ...template,
        id: 'disabled-template',
        status: 'draft',
        enabled: false,
      },
    });

    expect(screen.queryByRole('button', { name: 'Create plan preview' })).toBe(
      null,
    );
    const cta = screen.getByRole('button', { name: 'Open Templates' });
    expect(cta.getAttribute('href')).toBe('/idp/templates');
    expect(
      screen.getByText(
        'Choose from available Templates before creating a Plan preview.',
      ),
    ).toBeTruthy();
  });
});

describe('TemplateRunContent', () => {
  it('prefills Project and Environment from a recommended action query string', async () => {
    const controlContextApi = {
      getProjectControlContext: jest.fn(),
      createTemplatePlanPreview: jest.fn(),
      createDryRunActionRun: jest.fn(),
    };

    const rendered = await renderInTestApp(
      <Routes>
        <Route
          path="/idp/templates/:templateId/run"
          element={
            <TemplateRunContent
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
      {
        routeEntries: [
          '/idp/templates/node-api/run?projectId=examples&environmentId=examples-dev',
        ],
      },
    );

    const selectInputs = rendered.container.querySelectorAll(
      'input.MuiSelect-nativeInput',
    );
    expect(selectInputs[0]).toHaveProperty('value', 'examples');
    expect(selectInputs[1]).toHaveProperty('value', 'examples-dev');
    expect(screen.getByText('Create plan preview')).toBeTruthy();
  });

  it('drops an Environment query string that is unrelated to the selected Project before preview creation', async () => {
    const controlContextApi = {
      getProjectControlContext: jest.fn(),
      createTemplatePlanPreview: jest.fn().mockResolvedValue({
        plan: {
          id: 'preview-node',
          kind: 'Plan' as const,
          planRef: 'plan:preview-node',
          actor: { entityRef: 'user:default/guest', type: 'user' as const },
          targetEntityRef: 'system:default/examples',
          eventType: 'plan.created' as const,
          createdAt: '2026-08-01T00:00:00.000Z',
          status: 'planned' as const,
          expectedChangeSummary:
            'Preview node-api for examples without an environment target.',
          requiredApproval: 'none' as const,
        },
        operationLog: {
          id: 'log-preview-node',
          operationLogRef: 'operation-log:preview-node',
          actor: { entityRef: 'user:default/guest', type: 'user' as const },
          targetEntityRef: 'system:default/examples',
          eventType: 'plan.created' as const,
          createdAt: '2026-08-01T00:00:00.000Z',
          status: 'planned' as const,
          message: 'Plan preview planned.',
        },
      }),
      createDryRunActionRun: jest.fn(),
    };

    const rendered = await renderInTestApp(
      <Routes>
        <Route
          path="/idp/templates/:templateId/run"
          element={
            <TemplateRunContent
              projects={[project]}
              environments={[environment, unrelatedEnvironment]}
              templates={[template]}
              operationLogs={[] as IdpOperationLog[]}
              executions={[] as IdpTemplateExecution[]}
              refresh={jest.fn()}
              controlContextApi={controlContextApi}
            />
          }
        />
      </Routes>,
      {
        routeEntries: [
          '/idp/templates/node-api/run?projectId=examples&environmentId=payment-prod',
        ],
      },
    );

    await waitFor(() => {
      const selectInputs = rendered.container.querySelectorAll(
        'input.MuiSelect-nativeInput',
      );
      expect(selectInputs[0]).toHaveProperty('value', 'examples');
      expect(selectInputs[1]).toHaveProperty('value', '');
    });

    fireEvent.click(screen.getByText('Create plan preview'));

    await waitFor(() => {
      expect(controlContextApi.createTemplatePlanPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          projectRef: 'system:default/examples',
          templateRef: 'template:default/node-api',
        }),
      );
    });
    expect(
      controlContextApi.createTemplatePlanPreview,
    ).not.toHaveBeenCalledWith(
      expect.objectContaining({
        environmentRef: 'resource:default/payment-prod',
      }),
    );
  });

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
      createDryRunActionRun: jest.fn(),
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

  it('runs a record-only dry-run from the Plan preview and displays the response boundary', async () => {
    const preview = templatePreview();
    const dryRun = dryRunActionRun();
    const controlContextApi = {
      getProjectControlContext: jest.fn(),
      createTemplatePlanPreview: jest.fn().mockResolvedValue(preview),
      createDryRunActionRun: jest.fn().mockResolvedValue(dryRun),
    };

    await renderInTestApp(
      <Routes>
        <Route
          path="/idp/templates/:templateId/run"
          element={
            <TemplateRunContent
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
      {
        routeEntries: [
          '/idp/templates/node-api/run?projectId=examples&environmentId=examples-dev',
        ],
      },
    );

    fireEvent.click(screen.getByText('Create plan preview'));
    await waitFor(() => {
      expect(screen.getByText('Run dry-run')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Run dry-run'));

    await waitFor(() => {
      expect(controlContextApi.createDryRunActionRun).toHaveBeenCalledWith(
        expect.objectContaining({
          projectRef: 'system:default/examples',
          planRef: 'plan:preview-node',
          idempotencyKey: expect.stringContaining('plan:preview-node'),
        }),
      );
    });
    expect(screen.getByText('Record-only dry-run')).toBeTruthy();
    expect(
      screen.getByText(
        /does not start a Scaffolder task, create a Git pull request, or start external execution/,
      ),
    ).toBeTruthy();
    expect(
      screen.getByText('ActionRun ref: action-run:dry-run-preview-node'),
    ).toBeTruthy();
    expect(
      screen.getByText('OperationLog ref: operation-log:dry-run-preview-node'),
    ).toBeTruthy();
    expect(screen.getByText('Scaffolder task started: false')).toBeTruthy();
    expect(screen.getByText('Git pull request created: false')).toBeTruthy();
    expect(screen.getByText('External execution started: false')).toBeTruthy();
    expect(screen.queryByText('Create TemplateExecution')).toBeNull();
  });

  it('keeps dry-run failures retryable without adding execute UI', async () => {
    const preview = templatePreview();
    const controlContextApi = {
      getProjectControlContext: jest.fn(),
      createTemplatePlanPreview: jest.fn().mockResolvedValue(preview),
      createDryRunActionRun: jest
        .fn()
        .mockRejectedValue(new Error('IDP backend dry-run ActionRun failed')),
    };

    await renderInTestApp(
      <Routes>
        <Route
          path="/idp/templates/:templateId/run"
          element={
            <TemplateRunContent
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
      {
        routeEntries: [
          '/idp/templates/node-api/run?projectId=examples&environmentId=examples-dev',
        ],
      },
    );

    fireEvent.click(screen.getByText('Create plan preview'));
    await waitFor(() => {
      expect(screen.getByText('Run dry-run')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Run dry-run'));

    await waitFor(() => {
      expect(
        screen.getByText('IDP backend dry-run ActionRun failed'),
      ).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Run dry-run' })).toHaveProperty(
      'disabled',
      false,
    );
    expect(screen.queryByText('Create TemplateExecution')).toBeNull();
  });
});
