import {
  DatabaseService,
  isDatabaseConflictError,
  resolvePackagePath,
} from '@backstage/backend-plugin-api';
import { ConflictError, InputError } from '@backstage/errors';
import type { Knex } from 'knex';
import { z } from 'zod';

import {
  ActionRunSummary,
  CreateTemplatePlanPreviewResponse,
  DesiredStateContract,
  OperationLogRecord,
  PlanSummary,
} from './contracts';

export const desiredStateContract: DesiredStateContract = {
  authoritativeSource: 'catalog-and-git',
  idpBackendStoresAuthoritativeDesiredState: false,
  notes: [
    'Project, Environment, and Template desired state is read from Backstage Catalog or Git YAML.',
    'The IDP backend runtime store owns only Intent, Plan, ActionRun, and OperationLog audit/runtime records.',
  ],
};

export interface RuntimeAuditStore {
  listOperationLogs(options: {
    projectRef: string;
    limit: number;
  }): Promise<OperationLogRecord[]>;
  appendOperationLog(record: OperationLogRecord): Promise<OperationLogRecord>;
  appendPlan(record: PlanSummary): Promise<PlanSummary>;
  appendPlanWithOperationLog(records: {
    plan: PlanSummary;
    operationLog: OperationLogRecord;
  }): Promise<CreateTemplatePlanPreviewResponse>;
  appendActionRun(record: ActionRunSummary): Promise<ActionRunSummary>;
  getLatestPlan(projectRef: string): Promise<PlanSummary | undefined>;
  getLatestActionRun(projectRef: string): Promise<ActionRunSummary | undefined>;
  getDesiredStateContract(): DesiredStateContract;
}

const cloneRecord = <T>(record: T): T => structuredClone(record);

type RuntimeRecord = OperationLogRecord | PlanSummary | ActionRunSummary;
type RuntimeRecordKind = RuntimeRecord['kind'];

const operationLogTable = 'idp_operation_log';
const planTable = 'idp_plan_summary';
const actionRunTable = 'idp_action_run_summary';

const isoInstantSchema = z.string().datetime({ offset: true });

const normalizeCreatedAt = (createdAt: string): string => {
  if (!isoInstantSchema.safeParse(createdAt).success) {
    throw new InputError(
      `Runtime audit record createdAt must be a valid ISO 8601 instant, got '${createdAt}'.`,
    );
  }

  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp)) {
    throw new InputError(
      `Runtime audit record createdAt must be a valid ISO 8601 instant, got '${createdAt}'.`,
    );
  }

  return new Date(timestamp).toISOString();
};

const withNormalizedCreatedAt = <T extends RuntimeRecord>(record: T): T => ({
  ...record,
  createdAt: normalizeCreatedAt(record.createdAt),
});

const parsePayload = <T>(payload: string | object): T =>
  typeof payload === 'string' ? (JSON.parse(payload) as T) : (payload as T);

const duplicateRecordError = (kind: RuntimeRecordKind, id: string) =>
  new ConflictError(
    `${kind} runtime audit record '${id}' already exists and cannot be overwritten.`,
  );

const rethrowDuplicateInsert = (
  error: unknown,
  record: RuntimeRecord,
): never => {
  if (isDatabaseConflictError(error)) {
    throw duplicateRecordError(record.kind, record.id);
  }

  throw error;
};

const assertRecordDoesNotExist = async (options: {
  trx: Knex.Transaction;
  table: string;
  kind: RuntimeRecordKind;
  id: string;
}) => {
  const existing = await options
    .trx(options.table)
    .select('id')
    .where({ id: options.id })
    .first();

  if (existing) {
    throw duplicateRecordError(options.kind, options.id);
  }
};

export class InMemoryRuntimeAuditStore implements RuntimeAuditStore {
  private readonly operationLogs: OperationLogRecord[] = [];
  private readonly plans: PlanSummary[] = [];
  private readonly actionRuns: ActionRunSummary[] = [];

  async listOperationLogs(options: {
    projectRef: string;
    limit: number;
  }): Promise<OperationLogRecord[]> {
    return this.operationLogs
      .filter(
        log => (log.projectRef ?? log.targetEntityRef) === options.projectRef,
      )
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
      )
      .slice(0, options.limit)
      .map(log => cloneRecord(log));
  }

  async appendOperationLog(
    record: OperationLogRecord,
  ): Promise<OperationLogRecord> {
    const storedRecord = withNormalizedCreatedAt(cloneRecord(record));
    this.assertUniqueId('OperationLog', storedRecord.id, this.operationLogs);
    this.operationLogs.push(storedRecord);
    return cloneRecord(storedRecord);
  }

  async appendPlan(record: PlanSummary): Promise<PlanSummary> {
    const storedRecord = withNormalizedCreatedAt(cloneRecord(record));
    this.assertUniqueId('Plan', storedRecord.id, this.plans);
    this.plans.push(storedRecord);
    return cloneRecord(storedRecord);
  }

  async appendPlanWithOperationLog(records: {
    plan: PlanSummary;
    operationLog: OperationLogRecord;
  }): Promise<CreateTemplatePlanPreviewResponse> {
    const plan = withNormalizedCreatedAt(cloneRecord(records.plan));
    const operationLog = withNormalizedCreatedAt(
      cloneRecord(records.operationLog),
    );
    this.assertUniqueId('Plan', plan.id, this.plans);
    this.assertUniqueId('OperationLog', operationLog.id, this.operationLogs);
    this.plans.push(plan);
    this.operationLogs.push(operationLog);

    return {
      plan: cloneRecord(plan),
      operationLog: cloneRecord(operationLog),
    };
  }

  async appendActionRun(record: ActionRunSummary): Promise<ActionRunSummary> {
    const storedRecord = withNormalizedCreatedAt(cloneRecord(record));
    this.assertUniqueId('ActionRun', storedRecord.id, this.actionRuns);
    this.actionRuns.push(storedRecord);
    return cloneRecord(storedRecord);
  }

  async getLatestPlan(projectRef: string): Promise<PlanSummary | undefined> {
    const latestPlan = this.plans
      .filter(plan => plan.targetEntityRef === projectRef)
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
      )[0];

    return latestPlan ? cloneRecord(latestPlan) : undefined;
  }

  async getLatestActionRun(
    projectRef: string,
  ): Promise<ActionRunSummary | undefined> {
    const latestActionRun = this.actionRuns
      .filter(run => run.targetEntityRef === projectRef)
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
      )[0];

    return latestActionRun ? cloneRecord(latestActionRun) : undefined;
  }

  getDesiredStateContract(): DesiredStateContract {
    return desiredStateContract;
  }

  private assertUniqueId(
    kind: RuntimeRecordKind,
    id: string,
    records: RuntimeRecord[],
  ) {
    if (records.some(record => record.id === id)) {
      throw duplicateRecordError(kind, id);
    }
  }
}

export const runtimeAuditMigrationsDirectory = () =>
  resolvePackagePath('@internal/plugin-idp-backend', 'migrations');

export async function migrateRuntimeAuditStore(client: Knex): Promise<void> {
  await client.migrate.latest({
    directory: runtimeAuditMigrationsDirectory(),
  });
}

export class DatabaseRuntimeAuditStore implements RuntimeAuditStore {
  constructor(private readonly client: Knex) {}

  async listOperationLogs(options: {
    projectRef: string;
    limit: number;
  }): Promise<OperationLogRecord[]> {
    const rows = await this.client(operationLogTable)
      .select('payload')
      .where({ project_ref: options.projectRef })
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(options.limit);

    return rows.map(row => parsePayload<OperationLogRecord>(row.payload));
  }

  async appendOperationLog(
    record: OperationLogRecord,
  ): Promise<OperationLogRecord> {
    const normalized = withNormalizedCreatedAt(record);

    try {
      await this.client.transaction(async trx => {
        await this.insertOperationLog(trx, normalized);
      });
    } catch (error) {
      rethrowDuplicateInsert(error, normalized);
    }

    return cloneRecord(normalized);
  }

  async appendPlan(record: PlanSummary): Promise<PlanSummary> {
    const normalized = withNormalizedCreatedAt(record);

    try {
      await this.client.transaction(async trx => {
        await this.insertPlan(trx, normalized);
      });
    } catch (error) {
      rethrowDuplicateInsert(error, normalized);
    }

    return cloneRecord(normalized);
  }

  async appendPlanWithOperationLog(records: {
    plan: PlanSummary;
    operationLog: OperationLogRecord;
  }): Promise<CreateTemplatePlanPreviewResponse> {
    const plan = withNormalizedCreatedAt(records.plan);
    const operationLog = withNormalizedCreatedAt(records.operationLog);

    try {
      await this.client.transaction(async trx => {
        await this.insertPlan(trx, plan);
        await this.insertOperationLog(trx, operationLog);
      });
    } catch (error) {
      if (isDatabaseConflictError(error)) {
        throw new ConflictError(
          `Plan preview '${plan.id}' could not be stored because one of its append-only records already exists.`,
        );
      }

      throw error;
    }

    return {
      plan: cloneRecord(plan),
      operationLog: cloneRecord(operationLog),
    };
  }

  async appendActionRun(record: ActionRunSummary): Promise<ActionRunSummary> {
    const normalized = withNormalizedCreatedAt(record);

    try {
      await this.client.transaction(async trx => {
        await this.insertActionRun(trx, normalized);
      });
    } catch (error) {
      rethrowDuplicateInsert(error, normalized);
    }

    return cloneRecord(normalized);
  }

  async getLatestPlan(projectRef: string): Promise<PlanSummary | undefined> {
    const row = await this.client(planTable)
      .select('payload')
      .where({ target_entity_ref: projectRef })
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .first();

    return row ? parsePayload<PlanSummary>(row.payload) : undefined;
  }

  async getLatestActionRun(
    projectRef: string,
  ): Promise<ActionRunSummary | undefined> {
    const row = await this.client(actionRunTable)
      .select('payload')
      .where({ target_entity_ref: projectRef })
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .first();

    return row ? parsePayload<ActionRunSummary>(row.payload) : undefined;
  }

  getDesiredStateContract(): DesiredStateContract {
    return desiredStateContract;
  }

  private async insertOperationLog(
    trx: Knex.Transaction,
    record: OperationLogRecord,
  ) {
    await assertRecordDoesNotExist({
      trx,
      table: operationLogTable,
      kind: record.kind,
      id: record.id,
    });
    await trx(operationLogTable).insert({
      id: record.id,
      operation_log_ref: record.operationLogRef,
      project_ref: record.projectRef ?? record.targetEntityRef,
      target_entity_ref: record.targetEntityRef,
      environment_ref: record.environmentRef,
      template_ref: record.templateRef,
      plan_ref: record.planRef,
      action_run_ref: record.actionRunRef,
      event_type: record.eventType,
      status: record.status,
      created_at: record.createdAt,
      payload: JSON.stringify(record),
    });
  }

  private async insertPlan(trx: Knex.Transaction, record: PlanSummary) {
    await assertRecordDoesNotExist({
      trx,
      table: planTable,
      kind: record.kind,
      id: record.id,
    });
    await trx(planTable).insert({
      id: record.id,
      plan_ref: record.planRef,
      intent_id: record.intentId,
      project_ref: record.targetEntityRef,
      target_entity_ref: record.targetEntityRef,
      event_type: record.eventType,
      status: record.status,
      required_approval: record.requiredApproval,
      created_at: record.createdAt,
      payload: JSON.stringify(record),
    });
  }

  private async insertActionRun(
    trx: Knex.Transaction,
    record: ActionRunSummary,
  ) {
    await assertRecordDoesNotExist({
      trx,
      table: actionRunTable,
      kind: record.kind,
      id: record.id,
    });
    await trx(actionRunTable).insert({
      id: record.id,
      action_run_ref: record.actionRunRef,
      plan_ref: record.planRef,
      project_ref: record.targetEntityRef,
      target_entity_ref: record.targetEntityRef,
      mode: record.mode,
      external_execution_ref: record.externalExecutionRef,
      event_type: record.eventType,
      status: record.status,
      created_at: record.createdAt,
      payload: JSON.stringify(record),
    });
  }
}

export async function createRuntimeAuditStore(
  database: DatabaseService,
): Promise<RuntimeAuditStore> {
  const client = await database.getClient();

  if (!database.migrations?.skip) {
    await migrateRuntimeAuditStore(client);
  }

  return new DatabaseRuntimeAuditStore(client);
}
