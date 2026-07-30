import {
  ActionRunSummary,
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
  appendActionRun(record: ActionRunSummary): Promise<ActionRunSummary>;
  getLatestPlan(projectRef: string): Promise<PlanSummary | undefined>;
  getLatestActionRun(projectRef: string): Promise<ActionRunSummary | undefined>;
  getDesiredStateContract(): DesiredStateContract;
}

const cloneRecord = <T>(record: T): T => structuredClone(record);

export class InMemoryRuntimeAuditStore implements RuntimeAuditStore {
  private readonly operationLogs: OperationLogRecord[] = [];
  private readonly plans: PlanSummary[] = [];
  private readonly actionRuns: ActionRunSummary[] = [];

  async listOperationLogs(options: {
    projectRef: string;
    limit: number;
  }): Promise<OperationLogRecord[]> {
    return this.operationLogs
      .filter(log => log.projectRef === options.projectRef)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, options.limit)
      .map(log => cloneRecord(log));
  }

  async appendOperationLog(
    record: OperationLogRecord,
  ): Promise<OperationLogRecord> {
    const storedRecord = cloneRecord(record);
    this.operationLogs.push(storedRecord);
    return cloneRecord(storedRecord);
  }

  async appendPlan(record: PlanSummary): Promise<PlanSummary> {
    const storedRecord = cloneRecord(record);
    this.plans.push(storedRecord);
    return cloneRecord(storedRecord);
  }

  async appendActionRun(record: ActionRunSummary): Promise<ActionRunSummary> {
    const storedRecord = cloneRecord(record);
    this.actionRuns.push(storedRecord);
    return cloneRecord(storedRecord);
  }

  async getLatestPlan(projectRef: string): Promise<PlanSummary | undefined> {
    const latestPlan = this.plans
      .filter(plan => plan.targetEntityRef === projectRef)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

    return latestPlan ? cloneRecord(latestPlan) : undefined;
  }

  async getLatestActionRun(
    projectRef: string,
  ): Promise<ActionRunSummary | undefined> {
    const latestActionRun = this.actionRuns
      .filter(run => run.targetEntityRef === projectRef)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

    return latestActionRun ? cloneRecord(latestActionRun) : undefined;
  }

  getDesiredStateContract(): DesiredStateContract {
    return desiredStateContract;
  }
}
