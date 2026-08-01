import { BackendIdpApi } from './backendIdpApi';

describe('BackendIdpApi', () => {
  it('reads Project control context from the backend API without local mock data', async () => {
    const fetchApi = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        projectRef: 'system:default/examples',
        project: { ownerRefs: [] },
        environmentRefs: [],
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
});
