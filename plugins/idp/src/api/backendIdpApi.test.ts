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
});
