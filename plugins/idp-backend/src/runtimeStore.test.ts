import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ConflictError, InputError } from '@backstage/errors';
import knex, { Knex } from 'knex';

import { ActionRunSummary, OperationLogRecord, PlanSummary } from './contracts';
import {
  DatabaseRuntimeAuditStore,
  migrateRuntimeAuditStore,
} from './runtimeStore';

const projectRef = 'system:default/payments';

const operationLog = (overrides: Partial<OperationLogRecord> = {}) => ({
  id: 'log-1',
  kind: 'OperationLog' as const,
  operationLogRef: 'operation-log:log-1',
  actor: { type: 'user' as const, entityRef: 'user:default/guest' },
  targetEntityRef: projectRef,
  projectRef,
  eventType: 'plan.created' as const,
  createdAt: '2026-08-01T10:00:00+09:00',
  status: 'planned' as const,
  message: 'Plan preview created',
  ...overrides,
});

const plan = (overrides: Partial<PlanSummary> = {}) => ({
  id: 'plan-1',
  kind: 'Plan' as const,
  planRef: 'plan:plan-1',
  actor: { type: 'user' as const, entityRef: 'user:default/guest' },
  targetEntityRef: projectRef,
  eventType: 'plan.created' as const,
  createdAt: '2026-08-01T01:00:00.000Z',
  status: 'planned' as const,
  expectedChangeSummary: 'Preview a service change',
  requiredApproval: 'none' as const,
  ...overrides,
});

const actionRun = (overrides: Partial<ActionRunSummary> = {}) => ({
  id: 'run-1',
  kind: 'ActionRun' as const,
  actionRunRef: 'action-run:run-1',
  actor: { type: 'user' as const, entityRef: 'user:default/guest' },
  targetEntityRef: projectRef,
  eventType: 'dry-run.completed' as const,
  createdAt: '2026-08-01T02:00:00.000Z',
  status: 'dry-run-succeeded' as const,
  mode: 'dry-run' as const,
  ...overrides,
});

const createClient = (filename: string) =>
  knex({
    client: 'better-sqlite3',
    connection: { filename },
    useNullAsDefault: true,
  });

describe('DatabaseRuntimeAuditStore', () => {
  let directory: string;
  let databaseFile: string;
  let client: Knex;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'bara-runtime-audit-store-'));
    databaseFile = join(directory, 'runtime-audit.sqlite');
    client = createClient(databaseFile);
    await migrateRuntimeAuditStore(client);
  });

  afterEach(async () => {
    await client.destroy();
    await rm(directory, { recursive: true, force: true });
  });

  it('creates only runtime/audit tables with the query indexes', async () => {
    await expect(client.schema.hasTable('idp_operation_log')).resolves.toBe(
      true,
    );
    await expect(client.schema.hasTable('idp_plan_summary')).resolves.toBe(
      true,
    );
    await expect(
      client.schema.hasTable('idp_action_run_summary'),
    ).resolves.toBe(true);
    await expect(client.schema.hasTable('idp_project')).resolves.toBe(false);
    await expect(client.schema.hasTable('idp_environment')).resolves.toBe(
      false,
    );
    await expect(client.schema.hasTable('idp_template')).resolves.toBe(false);

    const indexes = (await client('sqlite_master')
      .select('name')
      .where({ type: 'index' })
      .whereLike('name', 'idx_idp_%')) as { name: string }[];
    expect(indexes.map(index => index.name).sort()).toEqual([
      'idx_idp_action_project_created',
      'idx_idp_action_target_created',
      'idx_idp_oplog_project_created',
      'idx_idp_oplog_target_created',
      'idx_idp_plan_project_created',
      'idx_idp_plan_target_created',
    ]);
  });

  it('retains normalized records and latest ordering after a database reconnect', async () => {
    const store = new DatabaseRuntimeAuditStore(client);
    const storedLog = await store.appendOperationLog(operationLog());
    await store.appendPlan(plan({ id: 'plan-older', planRef: 'plan:older' }));
    await store.appendPlan(
      plan({
        id: 'plan-newer',
        planRef: 'plan:newer',
        createdAt: '2026-08-01T03:00:00.000Z',
      }),
    );
    await store.appendActionRun(actionRun());

    expect(storedLog.createdAt).toBe('2026-08-01T01:00:00.000Z');

    await client.destroy();
    client = createClient(databaseFile);
    await migrateRuntimeAuditStore(client);

    const reconnectedStore = new DatabaseRuntimeAuditStore(client);
    await expect(
      reconnectedStore.listOperationLogs({ projectRef, limit: 20 }),
    ).resolves.toEqual([storedLog]);
    await expect(
      reconnectedStore.getLatestPlan(projectRef),
    ).resolves.toMatchObject({ id: 'plan-newer', planRef: 'plan:newer' });
    await expect(
      reconnectedStore.getLatestActionRun(projectRef),
    ).resolves.toMatchObject({ id: 'run-1', actionRunRef: 'action-run:run-1' });
  });

  it('rejects duplicate append-only records without overwriting the stored value', async () => {
    const store = new DatabaseRuntimeAuditStore(client);
    await store.appendOperationLog(operationLog());

    await expect(
      store.appendOperationLog(operationLog({ message: 'Mutated value' })),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(
      store.listOperationLogs({ projectRef, limit: 20 }),
    ).resolves.toEqual([
      operationLog({ createdAt: '2026-08-01T01:00:00.000Z' }),
    ]);
  });

  it('rolls back a Plan preview when the paired OperationLog cannot append', async () => {
    const store = new DatabaseRuntimeAuditStore(client);
    await store.appendOperationLog(operationLog());

    await expect(
      store.appendPlanWithOperationLog({
        plan: plan({ id: 'plan-atomic', planRef: 'plan:atomic' }),
        operationLog: operationLog(),
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(store.getLatestPlan(projectRef)).resolves.toBeUndefined();
  });

  it('rolls back a dry-run ActionRun when the paired OperationLog cannot append', async () => {
    const store = new DatabaseRuntimeAuditStore(client);
    await store.appendOperationLog(operationLog({ id: 'log-dry-run-atomic' }));

    await expect(
      store.appendActionRunWithOperationLog({
        actionRun: actionRun({
          id: 'dry-run-atomic',
          actionRunRef: 'action-run:dry-run-atomic',
          planRef: 'plan:plan-1',
        }),
        operationLog: operationLog({
          id: 'log-dry-run-atomic',
          operationLogRef: 'operation-log:dry-run-atomic',
          eventType: 'dry-run.completed',
          status: 'dry-run-succeeded',
          actionRunRef: 'action-run:dry-run-atomic',
        }),
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(store.getLatestActionRun(projectRef)).resolves.toBeUndefined();
  });

  it('finds an existing Plan by planRef without mutating it', async () => {
    const store = new DatabaseRuntimeAuditStore(client);
    const storedPlan = await store.appendPlan(
      plan({ id: 'plan-by-ref', planRef: 'plan:by-ref' }),
    );

    await expect(store.getPlanByRef('plan:by-ref')).resolves.toEqual(
      storedPlan,
    );
    await expect(store.getPlanByRef('plan:missing')).resolves.toBeUndefined();
  });

  it('rejects createdAt values that are not ISO 8601 instants', async () => {
    const store = new DatabaseRuntimeAuditStore(client);

    await expect(
      store.appendPlan(plan({ createdAt: 'not-a-timestamp' })),
    ).rejects.toBeInstanceOf(InputError);
    await expect(
      store.appendPlan(plan({ createdAt: '2026-02-30T00:00:00.000Z' })),
    ).rejects.toBeInstanceOf(InputError);
  });
});
