export type RuntimeStatus =
  | 'proposed'
  | 'planned'
  | 'needs-approval'
  | 'approved'
  | 'denied'
  | 'dry-run-running'
  | 'dry-run-succeeded'
  | 'dry-run-failed'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type ControlEventType =
  | 'intent.created'
  | 'plan.created'
  | 'policy.evaluated'
  | 'approval.requested'
  | 'approval.recorded'
  | 'dry-run.started'
  | 'dry-run.completed'
  | 'execution.started'
  | 'execution.completed'
  | 'external-reference.linked';

export type ActorRef = {
  entityRef: string;
  type: 'user' | 'group' | 'service' | 'agent';
};

export type PolicyDecision = {
  result: 'allow' | 'deny' | 'needs-approval';
  reasons: string[];
  requiredApprovalRefs?: string[];
};

export type RiskSummary = {
  level: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  summary: string;
  factors: string[];
};

export type RuntimeRecordBase = {
  id: string;
  actor: ActorRef;
  targetEntityRef: string;
  eventType: ControlEventType;
  createdAt: string;
  status: RuntimeStatus;
  riskSummary?: RiskSummary;
  policyDecision?: PolicyDecision;
};

export type IntentRecord = RuntimeRecordBase & {
  kind: 'Intent';
  goal: string;
  source: 'ui' | 'agent' | 'api';
  projectRef: string;
  environmentRef?: string;
};

export type PlanSummary = RuntimeRecordBase & {
  kind: 'Plan';
  intentId?: string;
  planRef: string;
  expectedChangeSummary: string;
  requiredApproval: 'none' | 'owner' | 'environment-owner' | 'manual';
};

export type CreateTemplatePlanPreviewRequest = {
  projectRef: string;
  environmentRef?: string;
  templateRef: string;
  parameters: Record<string, unknown>;
  actor: ActorRef;
  idempotencyKey: string;
};

export type CreateTemplatePlanPreviewResponse = {
  plan: PlanSummary;
  operationLog: OperationLogRecord;
};

export type ActionRunSummary = RuntimeRecordBase & {
  kind: 'ActionRun';
  actionRunRef: string;
  planRef?: string;
  mode: 'dry-run' | 'execute';
  externalExecutionRef?: string;
  resultSummary?: string;
};

export type OperationLogRecord = RuntimeRecordBase & {
  kind: 'OperationLog';
  operationLogRef: string;
  projectRef?: string;
  environmentRef?: string;
  templateRef?: string;
  planRef?: string;
  actionRunRef?: string;
  message: string;
};

export type AllowedActionSummary = {
  observe: 'allowed';
  plan: 'allowed' | 'needs-approval' | 'denied';
  dryRun: 'allowed' | 'needs-approval' | 'denied';
  proposeChange: 'allowed' | 'needs-approval' | 'denied';
  executeNonProduction: 'allowed' | 'needs-approval' | 'denied';
  executeProduction: 'allowed' | 'needs-approval' | 'denied';
  reasons: string[];
};

export type DesiredStateContract = {
  authoritativeSource: 'catalog-and-git';
  idpBackendStoresAuthoritativeDesiredState: false;
  notes: string[];
};

export type ProjectControlContext = {
  projectRef: string;
  project: {
    title?: string;
    ownerRefs: string[];
    catalogEntityRef?: string;
  };
  environmentRefs: string[];
  templateRefs: string[];
  allowedActions: AllowedActionSummary;
  recentOperationLogs: OperationLogRecord[];
  latestPlan?: PlanSummary;
  latestActionRun?: ActionRunSummary;
  desiredState: DesiredStateContract;
};
