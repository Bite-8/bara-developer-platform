import { mockCredentials, mockServices } from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';

describe('createRouter', () => {
  it('exposes a mock-free Project control context read path', async () => {
    const controlContext = {
      getProjectControlContext: jest.fn().mockResolvedValue({
        projectRef: 'system:default/examples',
        project: { ownerRefs: ['group:default/guests'] },
        environmentRefs: [],
        templateRefs: ['template:default/example-nodejs-template'],
        allowedActions: {
          observe: 'allowed',
          plan: 'allowed',
          dryRun: 'allowed',
          proposeChange: 'needs-approval',
          executeNonProduction: 'needs-approval',
          executeProduction: 'needs-approval',
          reasons: ['Catalog ownership is available for approval routing.'],
        },
        recentOperationLogs: [],
        desiredState: {
          authoritativeSource: 'catalog-and-git',
          idpBackendStoresAuthoritativeDesiredState: false,
          notes: [],
        },
      }),
    };
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      controlContext: controlContext as any,
    });
    const app = express().use(router);

    const response = await request(app)
      .get('/control-context/project')
      .query({ projectRef: 'system:default/examples' });

    expect(response.status).toBe(200);
    expect(response.body.projectRef).toBe('system:default/examples');
    expect(controlContext.getProjectControlContext).toHaveBeenCalledWith({
      projectRef: 'system:default/examples',
      credentials: expect.objectContaining({
        principal: expect.objectContaining({
          userEntityRef: mockCredentials.user().principal.userEntityRef,
        }),
      }),
    });
  });
});
