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
  metadata: {
    name: 'payments-prod',
    annotations: { 'bara.dev/criticality': 'production' },
  },
  spec: { type: 'production-environment', owner: 'group:default/platform' },
  relations: [
    { type: 'ownedBy', targetRef: 'group:default/platform' },
    { type: 'partOf', targetRef: 'system:default/payments' },
  ],
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
  getEntityByRef: jest.fn().mockImplementation((entityRef: string) => {
    if (entityRef === 'resource:default/payments-prod') {
      return Promise.resolve(environmentEntity);
    }

    return Promise.resolve(projectEntity);
  }),
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
      environments: [
        {
          entityRef: 'resource:default/payments-prod',
          ownerRefs: ['group:default/platform'],
          criticality: 'production',
        },
      ],
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
        idempotencyKey: 'preview-checkout-api',
      },
    });

    expect(preview.plan).toMatchObject({
      kind: 'Plan',
      planRef: 'plan:preview-checkout-api',
      actor: { type: 'user', entityRef: 'user:default/guest' },
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
      actor: { type: 'user', entityRef: 'user:default/guest' },
    });

    const context = await service.getProjectControlContext({
      projectRef: 'system:default/payments',
      credentials,
    });
    expect(context.latestPlan).toEqual(preview.plan);
    expect(context.recentOperationLogs).toEqual([preview.operationLog]);
    expect(context.latestActionRun).toBeUndefined();
  });

  it('records a side-effect-free dry-run ActionRun for an existing Plan and returns it from Project control context', async () => {
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
        idempotencyKey: 'preview-dry-run-checkout-api',
      },
    });

    const dryRun = await service.createDryRunActionRun({
      credentials,
      request: {
        projectRef: 'system:default/payments',
        planRef: preview.plan.planRef,
        idempotencyKey: 'dry-run-checkout-api',
      },
    });

    expect(dryRun).toMatchObject({
      actionRun: {
        kind: 'ActionRun',
        actionRunRef: 'action-run:dry-run-dry-run-checkout-api',
        planRef: preview.plan.planRef,
        mode: 'dry-run',
        eventType: 'dry-run.completed',
        status: 'dry-run-succeeded',
        actor: { type: 'user', entityRef: 'user:default/guest' },
        targetEntityRef: 'system:default/payments',
        resultSummary: expect.stringContaining(
          'no Scaffolder task, Git PR, or external execution was started',
        ),
      },
      operationLog: {
        kind: 'OperationLog',
        eventType: 'dry-run.completed',
        status: 'dry-run-succeeded',
        projectRef: 'system:default/payments',
        planRef: preview.plan.planRef,
        actionRunRef: 'action-run:dry-run-dry-run-checkout-api',
        message: expect.stringContaining('no Scaffolder task'),
      },
      sideEffectBoundary: {
        scaffolderTaskStarted: false,
        gitPullRequestCreated: false,
        externalExecutionStarted: false,
        message: expect.stringContaining('external execution was started'),
      },
    });
    expect(dryRun.actionRun).not.toHaveProperty('externalExecutionRef');

    const context = await service.getProjectControlContext({
      projectRef: 'system:default/payments',
      credentials,
    });
    expect(context.latestPlan).toEqual(preview.plan);
    expect(context.latestActionRun).toEqual(dryRun.actionRun);
    expect(context.recentOperationLogs).toEqual([
      dryRun.operationLog,
      preview.operationLog,
    ]);
  });

  it('rejects dry-run ActionRun creation for missing, mismatched, or denied Plans without appending a run', async () => {
    const runtimeStore = new InMemoryRuntimeAuditStore();
    const service = new ControlContextService(
      createCatalog() as any,
      runtimeStore,
    );

    await expect(
      service.createDryRunActionRun({
        credentials,
        request: {
          projectRef: 'system:default/payments',
          planRef: 'plan:missing',
          idempotencyKey: 'dry-run-missing-plan',
        },
      }),
    ).rejects.toThrow(/No Plan runtime audit record/);

    await runtimeStore.appendPlan({
      id: 'plan-mismatch',
      kind: 'Plan',
      planRef: 'plan:mismatch',
      actor: { type: 'user', entityRef: 'user:default/guest' },
      targetEntityRef: 'system:default/other-project',
      eventType: 'plan.created',
      createdAt: '2026-08-01T00:00:00.000Z',
      status: 'planned',
      expectedChangeSummary: 'Different project',
      requiredApproval: 'none',
    });
    await expect(
      service.createDryRunActionRun({
        credentials,
        request: {
          projectRef: 'system:default/payments',
          planRef: 'plan:mismatch',
          idempotencyKey: 'dry-run-mismatch',
        },
      }),
    ).rejects.toThrow(/belongs to 'system:default\/other-project'/);

    await runtimeStore.appendPlan({
      id: 'plan-denied',
      kind: 'Plan',
      planRef: 'plan:denied',
      actor: { type: 'user', entityRef: 'user:default/guest' },
      targetEntityRef: 'system:default/payments',
      eventType: 'plan.created',
      createdAt: '2026-08-01T00:01:00.000Z',
      status: 'denied',
      expectedChangeSummary: 'Denied project',
      requiredApproval: 'manual',
      policyDecision: {
        result: 'deny',
        reasons: ['Catalog ownership is missing'],
      },
    });
    await expect(
      service.createDryRunActionRun({
        credentials,
        request: {
          projectRef: 'system:default/payments',
          planRef: 'plan:denied',
          idempotencyKey: 'dry-run-denied',
        },
      }),
    ).rejects.toThrow(/is denied/);

    await expect(
      runtimeStore.getLatestActionRun('system:default/payments'),
    ).resolves.toBeUndefined();
    await expect(
      runtimeStore.listOperationLogs({
        projectRef: 'system:default/payments',
        limit: 20,
      }),
    ).resolves.toEqual([]);
  });

  it('stores service credentials as the audit actor when a service creates a Plan preview', async () => {
    const service = new ControlContextService(
      createCatalog() as any,
      new InMemoryRuntimeAuditStore(),
    );

    const preview = await service.createTemplatePlanPreview({
      credentials: mockCredentials.service('plugin:idp-automation'),
      request: {
        projectRef: 'system:default/payments',
        templateRef: 'template:default/node-service',
        parameters: {},
        idempotencyKey: 'preview-service-actor',
      },
    });

    expect(preview.plan.actor).toEqual({
      type: 'service',
      entityRef: 'plugin:idp-automation',
    });
    expect(preview.operationLog.actor).toEqual({
      type: 'service',
      entityRef: 'plugin:idp-automation',
    });
  });

  it('rejects Plan preview creation when credentials do not identify a user or service actor', async () => {
    const service = new ControlContextService(
      createCatalog() as any,
      new InMemoryRuntimeAuditStore(),
    );

    await expect(
      service.createTemplatePlanPreview({
        credentials: mockCredentials.none(),
        request: {
          projectRef: 'system:default/payments',
          templateRef: 'template:default/node-service',
          parameters: {},
          idempotencyKey: 'preview-no-actor',
        },
      }),
    ).rejects.toThrow(/identity is required/);
  });

  it('marks Catalog production-criticality Plan previews as needing approval', async () => {
    const catalog = createCatalog();
    const productionCriticalEnvironment: Entity = {
      ...environmentEntity,
      metadata: {
        name: 'payments-live',
        annotations: { 'bara.dev/criticality': 'production' },
      },
    };
    catalog.getEntityByRef.mockImplementation((entityRef: string) => {
      if (entityRef === 'resource:default/payments-live') {
        return Promise.resolve(productionCriticalEnvironment);
      }

      return Promise.resolve(projectEntity);
    });
    const service = new ControlContextService(
      catalog as any,
      new InMemoryRuntimeAuditStore(),
    );

    const preview = await service.createTemplatePlanPreview({
      credentials,
      request: {
        projectRef: 'system:default/payments',
        environmentRef: 'resource:default/payments-live',
        templateRef: 'template:default/node-service',
        parameters: {},
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
    expect(catalog.getEntityByRef).toHaveBeenCalledWith(
      'resource:default/payments-live',
      { credentials },
    );
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
