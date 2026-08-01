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
      createTemplatePlanPreview: jest.fn(),
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

  it('creates a template Plan preview through a validated write path', async () => {
    const preview = {
      plan: {
        id: 'preview-node-dev',
        kind: 'Plan',
        planRef: 'plan:preview-node-dev',
        actor: { type: 'user', entityRef: 'user:default/guest' },
        targetEntityRef: 'system:default/examples',
        eventType: 'plan.created',
        createdAt: '2026-08-01T00:00:00.000Z',
        status: 'planned',
        expectedChangeSummary:
          'Preview node-service without starting execution.',
        requiredApproval: 'none',
        policyDecision: {
          result: 'allow',
          reasons: ['Plan preview has no side effects.'],
        },
        riskSummary: {
          level: 'low',
          summary: 'Plan preview only.',
          factors: ['side-effect-free-preview'],
        },
      },
      operationLog: {
        id: 'log-preview-node-dev',
        kind: 'OperationLog',
        operationLogRef: 'operation-log:preview-node-dev',
        actor: { type: 'user', entityRef: 'user:default/guest' },
        targetEntityRef: 'system:default/examples',
        eventType: 'plan.created',
        createdAt: '2026-08-01T00:00:00.000Z',
        status: 'planned',
        projectRef: 'system:default/examples',
        environmentRef: 'resource:default/examples-dev',
        templateRef: 'template:default/node-service',
        planRef: 'plan:preview-node-dev',
        message: 'Plan preview planned for template:default/node-service.',
      },
    };
    const controlContext = {
      getProjectControlContext: jest.fn(),
      createTemplatePlanPreview: jest.fn().mockResolvedValue(preview),
    };
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      controlContext: controlContext as any,
    });
    const app = express().use(router);

    const body = {
      projectRef: 'system:default/examples',
      environmentRef: 'resource:default/examples-dev',
      templateRef: 'template:default/node-service',
      parameters: { serviceName: 'checkout-api' },
      actor: { type: 'user', entityRef: 'user:default/guest' },
      idempotencyKey: 'preview-node-dev',
    };
    const response = await request(app)
      .post('/plans/template-preview')
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(preview);
    expect(controlContext.createTemplatePlanPreview).toHaveBeenCalledWith({
      request: body,
      credentials: expect.objectContaining({
        principal: expect.objectContaining({
          userEntityRef: mockCredentials.user().principal.userEntityRef,
        }),
      }),
    });
  });

  it('rejects invalid template Plan preview requests', async () => {
    const controlContext = {
      getProjectControlContext: jest.fn(),
      createTemplatePlanPreview: jest.fn(),
    };
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      controlContext: controlContext as any,
    });
    const app = express().use(router);

    const response = await request(app)
      .post('/plans/template-preview')
      .send({
        projectRef: 'system:default/examples',
        templateRef: 'template:default/node-service',
        actor: { type: 'user', entityRef: 'user:default/guest' },
        idempotencyKey: 'short',
      });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(controlContext.createTemplatePlanPreview).not.toHaveBeenCalled();
  });
});
