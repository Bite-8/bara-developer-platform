import { BackendIdpApi } from './backendIdpApi';

describe('BackendIdpApi', () => {
  it('reads Project control context from the backend API without local mock data', async () => {
    const fetchApi = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        projectRef: 'system:default/examples',
        project: { ownerRefs: [] },
        environmentRefs: [],
        environments: [],
        templateRefs: ['template:default/example-nodejs-template'],
        allowedActions: {
          observe: 'allowed',
          plan: 'allowed',
          dryRun: 'allowed',
          proposeChange: 'needs-approval',
          executeNonProduction: 'needs-approval',
          executeProduction: 'needs-approval',
          reasons: [],
        },
        recentOperationLogs: [],
        desiredState: {
          authoritativeSource: 'catalog-and-git',
          idpBackendStoresAuthoritativeDesiredState: false,
          notes: [],
        },
      }),
    });

    const api = new BackendIdpApi({
      baseUrl: 'http://localhost:7007/api/idp',
      fetchApi,
    });

    await expect(
      api.getProjectControlContext('system:default/examples'),
    ).resolves.toMatchObject({
      projectRef: 'system:default/examples',
      templateRefs: ['template:default/example-nodejs-template'],
    });
    expect(fetchApi).toHaveBeenCalledWith(
      'http://localhost:7007/api/idp/control-context/project?projectRef=system%3Adefault%2Fexamples',
    );
  });

  it('creates a template Plan preview with the backend API', async () => {
    const preview = {
      plan: {
        id: 'preview-node',
        kind: 'Plan',
        planRef: 'plan:preview-node',
        actor: { entityRef: 'user:default/guest', type: 'user' },
        targetEntityRef: 'system:default/examples',
        eventType: 'plan.created',
        createdAt: '2026-08-01T00:00:00.000Z',
        status: 'planned',
        expectedChangeSummary: 'Preview node-service without side effects.',
        requiredApproval: 'none',
      },
      operationLog: {
        id: 'log-preview-node',
        operationLogRef: 'operation-log:preview-node',
        actor: { entityRef: 'user:default/guest', type: 'user' },
        targetEntityRef: 'system:default/examples',
        eventType: 'plan.created',
        createdAt: '2026-08-01T00:00:00.000Z',
        status: 'planned',
        message: 'Plan preview planned.',
      },
    };
    const fetchApi = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => preview,
    });
    const api = new BackendIdpApi({
      baseUrl: 'http://localhost:7007/api/idp',
      fetchApi,
    });
    const input = {
      projectRef: 'system:default/examples',
      environmentRef: 'resource:default/examples-dev',
      templateRef: 'template:default/node-service',
      parameters: { serviceName: 'checkout-api' },
      idempotencyKey: 'preview-node',
    };

    await expect(api.createTemplatePlanPreview(input)).resolves.toEqual(
      preview,
    );
    expect(fetchApi).toHaveBeenCalledWith(
      'http://localhost:7007/api/idp/plans/template-preview',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
  });

  it('creates a dry-run ActionRun with the backend API', async () => {
    const dryRun = {
      actionRun: {
        id: 'dry-run-preview-node',
        kind: 'ActionRun',
        actionRunRef: 'action-run:dry-run-preview-node',
        planRef: 'plan:preview-node',
        actor: { entityRef: 'user:default/guest', type: 'user' },
        targetEntityRef: 'system:default/examples',
        eventType: 'dry-run.completed',
        createdAt: '2026-08-01T00:00:01.000Z',
        status: 'dry-run-succeeded',
        mode: 'dry-run',
        resultSummary:
          'Record-only dry-run completed; no Scaffolder task, Git PR, or external execution was started.',
      },
      operationLog: {
        id: 'log-dry-run-preview-node',
        operationLogRef: 'operation-log:dry-run-preview-node',
        actor: { entityRef: 'user:default/guest', type: 'user' },
        targetEntityRef: 'system:default/examples',
        eventType: 'dry-run.completed',
        createdAt: '2026-08-01T00:00:01.000Z',
        status: 'dry-run-succeeded',
        message:
          'Record-only dry-run completed; no Scaffolder task, Git PR, or external execution was started.',
      },
      sideEffectBoundary: {
        scaffolderTaskStarted: false,
        gitPullRequestCreated: false,
        externalExecutionStarted: false,
        message:
          'Record-only dry-run completed; no Scaffolder task, Git PR, or external execution was started.',
      },
    };
    const fetchApi = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => dryRun,
    });
    const api = new BackendIdpApi({
      baseUrl: 'http://localhost:7007/api/idp',
      fetchApi,
    });
    const input = {
      projectRef: 'system:default/examples',
      planRef: 'plan:preview-node',
      idempotencyKey: 'dry-run-preview-node',
    };

    await expect(api.createDryRunActionRun(input)).resolves.toEqual(dryRun);
    expect(fetchApi).toHaveBeenCalledWith(
      'http://localhost:7007/api/idp/action-runs/dry-run',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
      },
    );
  });

  it('rejects non-2xx dry-run responses', async () => {
    const fetchApi = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: 'duplicate dry-run' }),
    });
    const api = new BackendIdpApi({
      baseUrl: 'http://localhost:7007/api/idp',
      fetchApi,
    });

    await expect(
      api.createDryRunActionRun({
        projectRef: 'system:default/examples',
        planRef: 'plan:preview-node',
        idempotencyKey: 'dry-run-preview-node',
      }),
    ).rejects.toThrow('IDP backend dry-run ActionRun request failed: 409');
  });
});
