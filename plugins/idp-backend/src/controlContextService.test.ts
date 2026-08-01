import { mockCredentials } from '@backstage/backend-test-utils';
import { Entity } from '@backstage/catalog-model';

import { ControlContextService } from './controlContextService';
import { ActionRunSummary, OperationLogRecord, PlanSummary } from './contracts';
import {
  desiredStateContract,
  InMemoryRuntimeAuditStore,
} from './runtimeStore';

const credentials = mockCredentials.user('user:default/guest');

const projectEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'System',
  metadata: { name: 'payments', title: 'Payments' },
  spec: { owner: 'group:default/platform' },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/platform' },
    { type: 'hasPart', targetRef: 'resource:default/payments-prod' },
    { type: 'hasPart', targetRef: 'template:default/node-service' },
  ],
};

const environmentEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Resource',
  metadata: { name: 'payments-prod' },
  spec: { type: 'production-environment', owner: 'group:default/platform' },
  relations: [{ type: 'partOf', targetRef: 'system:default/payments' }],
};

const templateEntity: Entity = {
  apiVersion: 'scaffolder.backstage.io/v1beta3',
  kind: 'Template',
  metadata: { name: 'node-service' },
  spec: { type: 'service', owner: 'group:default/platform' },
  relations: [{ type: 'partOf', targetRef: 'system:default/payments' }],
};

const unrelatedTemplateEntity: Entity = {
  apiVersion: 'scaffolder.backstage.io/v1beta3',
  kind: 'Template',
  metadata: { name: 'unrelated-service' },
  spec: { type: 'service', owner: 'group:default/platform' },
};

const createCatalog = () => ({
  getEntityByRef: jest.fn().mockResolvedValue(projectEntity),
  getEntitiesByRefs: jest
    .fn()
    .mockResolvedValue({ items: [environmentEntity, templateEntity] }),
  getEntities: jest.fn().mockResolvedValue({
    items: [environmentEntity, templateEntity, unrelatedTemplateEntity],
  }),
});

describe('ControlContextService', () => {
  it('returns project control context from Catalog plus runtime audit store', async () => {
    const catalog = createCatalog();
    const runtimeStore = new InMemoryRuntimeAuditStore();
    const log: OperationLogRecord = {
      id: 'log-1',
      kind: 'OperationLog',
      operationLogRef: 'operation-log:log-1',
      actor: { type: 'user', entityRef: 'user:default/guest' },
      targetEntityRef: 'system:default/payments',
      eventType: 'plan.created',
      createdAt: '2026-07-30T00:00:00.000Z',
      status: 'planned',
      projectRef: 'system:default/payments',
      message: 'Plan created',
      riskSummary: {
        level: 'low',
        summary: 'Catalog read only',
        factors: ['observe-only'],
      },
    };
    const olderPlan: PlanSummary = {
      id: 'plan-1',
      kind: 'Plan',
      planRef: 'plan:plan-1',
      actor: { type: 'agent', entityRef: 'user:default/agent' },
      targetEntityRef: 'system:default/payments',
      eventType: 'plan.created',
      createdAt: '2026-07-30T00:00:00.000Z',
      status: 'planned',
      expectedChangeSummary: 'Older plan',
      requiredApproval: 'none',
    };
    const latestPlan: PlanSummary = {
      ...olderPlan,
      id: 'plan-2',
      planRef: 'plan:plan-2',
      createdAt: '2026-07-30T00:02:00.000Z',
      expectedChangeSummary: 'Latest plan',
      requiredApproval: 'owner',
    };
    const olderActionRun: ActionRunSummary = {
      id: 'run-1',
      kind: 'ActionRun',
      actionRunRef: 'action-run:run-1',
      actor: { type: 'agent', entityRef: 'user:default/agent' },
      targetEntityRef: 'system:default/payments',
      eventType: 'dry-run.started',
      createdAt: '2026-07-30T00:01:00.000Z',
      status: 'dry-run-running',
      mode: 'dry-run',
      planRef: 'plan:plan-1',
    };
    const latestActionRun: ActionRunSummary = {
      ...olderActionRun,
      id: 'run-2',
      actionRunRef: 'action-run:run-2',
      planRef: 'plan:plan-2',
      eventType: 'dry-run.completed',
      createdAt: '2026-07-30T00:03:00.000Z',
      status: 'dry-run-succeeded',
      resultSummary: 'Latest dry-run completed',
    };

    await runtimeStore.appendOperationLog(log);
    await runtimeStore.appendPlan(latestPlan);
    await runtimeStore.appendPlan(olderPlan);
    await runtimeStore.appendActionRun(latestActionRun);
    await runtimeStore.appendActionRun(olderActionRun);

    const service = new ControlContextService(catalog as any, runtimeStore);
    const context = await service.getProjectControlContext({
      projectRef: 'system:default/payments',
      credentials,
    });

    expect(context).toMatchObject({
      projectRef: 'system:default/payments',
      project: {
        title: 'Payments',
        ownerRefs: ['group:default/platform'],
      },
      environmentRefs: ['resource:default/payments-prod'],
      templateRefs: ['template:default/node-service'],
      allowedActions: {
        observe: 'allowed',
        plan: 'allowed',
        dryRun: 'allowed',
        executeProduction: 'needs-approval',
      },
      desiredState: desiredStateContract,
    });
    expect(context.recentOperationLogs).toEqual([log]);
    expect(context.latestPlan).toEqual(latestPlan);
    expect(context.latestActionRun).toEqual(latestActionRun);
    expect(catalog.getEntityByRef).toHaveBeenCalledWith(
      'system:default/payments',
      { credentials },
    );
    expect(context.templateRefs).not.toContain(
      'template:default/unrelated-service',
    );
    expect(catalog.getEntitiesByRefs).toHaveBeenCalledWith(
      {
        entityRefs: [
          'resource:default/payments-prod',
          'template:default/node-service',
        ],
      },
      { credentials },
    );
  });

  it('keeps Project, Environment, and Template desired state outside the IDP runtime store', () => {
    const store = new InMemoryRuntimeAuditStore();

    expect(store.getDesiredStateContract()).toEqual({
      authoritativeSource: 'catalog-and-git',
      idpBackendStoresAuthoritativeDesiredState: false,
      notes: expect.arrayContaining([
        expect.stringContaining('Project, Environment, and Template'),
      ]),
    });
    expect(Object.keys(store as any)).not.toEqual(
      expect.arrayContaining(['projects', 'environments', 'templates']),
    );
  });

  it('creates a side-effect-free template Plan preview and returns it from Project control context', async () => {
    const catalog = createCatalog();
    const runtimeStore = new InMemoryRuntimeAuditStore();
    const service = new ControlContextService(catalog as any, runtimeStore);

    const preview = await service.createTemplatePlanPreview({
      credentials,
      request: {
        projectRef: 'system:default/payments',
        environmentRef: 'resource:default/payments-dev',
        templateRef: 'template:default/node-service',
        parameters: { serviceName: 'checkout-api' },
        actor: { type: 'user', entityRef: 'user:default/guest' },
        idempotencyKey: 'preview-checkout-api',
      },
    });

    expect(preview.plan).toMatchObject({
      kind: 'Plan',
      planRef: 'plan:preview-checkout-api',
      targetEntityRef: 'system:default/payments',
      status: 'planned',
      expectedChangeSummary: expect.stringContaining(
        'no Scaffolder task, Git PR, AI generation, or execution is started',
      ),
      requiredApproval: 'none',
      policyDecision: {
        result: 'allow',
        reasons: expect.arrayContaining([
          expect.stringContaining('Plan preview has no side effects'),
        ]),
      },
      riskSummary: {
        level: 'low',
        summary: expect.stringContaining('without side effects'),
        factors: expect.arrayContaining(['side-effect-free-preview']),
      },
    });
    expect(preview.operationLog).toMatchObject({
      kind: 'OperationLog',
      eventType: 'plan.created',
      projectRef: 'system:default/payments',
      environmentRef: 'resource:default/payments-dev',
      templateRef: 'template:default/node-service',
      planRef: preview.plan.planRef,
    });

    const context = await service.getProjectControlContext({
      projectRef: 'system:default/payments',
      credentials,
    });
    expect(context.latestPlan).toEqual(preview.plan);
    expect(context.recentOperationLogs).toEqual([preview.operationLog]);
    expect(context.latestActionRun).toBeUndefined();
  });

  it('marks production-like template Plan previews as needing approval', async () => {
    const catalog = createCatalog();
    const service = new ControlContextService(
      catalog as any,
      new InMemoryRuntimeAuditStore(),
    );

    const preview = await service.createTemplatePlanPreview({
      credentials,
      request: {
        projectRef: 'system:default/payments',
        environmentRef: 'resource:default/payments-prod',
        templateRef: 'template:default/node-service',
        parameters: {},
        actor: { type: 'user', entityRef: 'user:default/guest' },
        idempotencyKey: 'preview-prod-node',
      },
    });

    expect(preview.plan).toMatchObject({
      status: 'needs-approval',
      requiredApproval: 'environment-owner',
      policyDecision: {
        result: 'needs-approval',
        requiredApprovalRefs: ['group:default/platform'],
        reasons: expect.arrayContaining([
          expect.stringContaining('Production-like'),
        ]),
      },
      riskSummary: {
        level: 'medium',
        factors: expect.arrayContaining(['production-like-environment']),
      },
    });
  });

  it('denies template Plan previews when target Project ownership is missing', async () => {
    const ownerlessProject: Entity = {
      ...projectEntity,
      spec: {},
      relations: projectEntity.relations?.filter(
        relation => relation.type !== 'ownedBy',
      ),
    };
    const catalog = {
      ...createCatalog(),
      getEntityByRef: jest.fn().mockResolvedValue(ownerlessProject),
    };
    const service = new ControlContextService(
      catalog as any,
      new InMemoryRuntimeAuditStore(),
    );

    const preview = await service.createTemplatePlanPreview({
      credentials,
      request: {
        projectRef: 'system:default/payments',
        environmentRef: 'resource:default/payments-dev',
        templateRef: 'template:default/node-service',
        parameters: {},
        actor: { type: 'user', entityRef: 'user:default/guest' },
        idempotencyKey: 'preview-ownerless-node',
      },
    });

    expect(preview.plan).toMatchObject({
      status: 'denied',
      requiredApproval: 'manual',
      policyDecision: {
        result: 'deny',
        reasons: expect.arrayContaining([
          expect.stringContaining('Catalog ownership is missing'),
        ]),
      },
      riskSummary: {
        level: 'high',
        factors: expect.arrayContaining(['ownerless-target']),
      },
    });
  });

  it('treats OperationLog as append-only', async () => {
    const store = new InMemoryRuntimeAuditStore();
    const baseLog: OperationLogRecord = {
      id: 'log-1',
      kind: 'OperationLog',
      operationLogRef: 'operation-log:log-1',
      actor: { type: 'agent', entityRef: 'user:default/agent' },
      targetEntityRef: 'system:default/payments',
      eventType: 'dry-run.completed',
      createdAt: '2026-07-30T00:00:00.000Z',
      status: 'dry-run-succeeded',
      projectRef: 'system:default/payments',
      actionRunRef: 'action-run:dry-run-1',
      message: 'Dry-run completed',
      policyDecision: {
        result: 'allow',
        reasons: ['no side effects'],
      },
    };

    await store.appendOperationLog(baseLog);
    await store.appendOperationLog({
      ...baseLog,
      id: 'log-2',
      operationLogRef: 'operation-log:log-2',
      createdAt: '2026-07-30T00:01:00.000Z',
      eventType: 'execution.started',
      status: 'running',
      message: 'Execution started',
    });

    await expect(
      store.listOperationLogs({
        projectRef: 'system:default/payments',
        limit: 20,
      }),
    ).resolves.toHaveLength(2);

    const [returnedLog] = await store.listOperationLogs({
      projectRef: 'system:default/payments',
      limit: 20,
    });
    returnedLog.message = 'Mutated outside store';
    returnedLog.policyDecision?.reasons.push('mutated reason');

    await expect(
      store.listOperationLogs({
        projectRef: 'system:default/payments',
        limit: 20,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        id: 'log-2',
        message: 'Execution started',
        policyDecision: {
          result: 'allow',
          reasons: ['no side effects'],
        },
      }),
      expect.objectContaining({
        id: 'log-1',
        message: 'Dry-run completed',
        policyDecision: {
          result: 'allow',
          reasons: ['no side effects'],
        },
      }),
    ]);
  });
});
