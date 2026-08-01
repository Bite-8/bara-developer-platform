export type ProjectStatus = 'active' | 'archived' | 'provisioning' | 'error';

export type IdpProject = {
  id: string;
  name: string;
  description: string;
  owner: string;
  repositories: string[];
  relatedCatalogEntityRefs: string[];
  environmentIds: string[];
  templateIds: string[];
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

export type EnvironmentType = 'dev' | 'stg' | 'prod' | 'sandbox' | 'customer';

export type DeploymentStatus =
  | 'running'
  | 'deploying'
  | 'failed'
  | 'stopped'
  | 'unknown';

export type AlertStatus = 'normal' | 'warning' | 'critical' | 'unknown';

export type IdpEnvironment = {
  id: string;
  projectId: string;
  name: string;
  type: EnvironmentType;
  awsAccountId?: string;
  region?: string;
  deploymentStatus: DeploymentStatus;
  appStatus: DeploymentStatus;
  infraStatus: DeploymentStatus;
  alertStatus: AlertStatus;
  endpointUrl?: string;
  lastDeployedAt?: string;
  repository?: string;
  relatedCatalogEntityRefs: string[];
  createdAt: string;
  updatedAt: string;
};

export type TemplateKind =
  | 'infrastructure'
  | 'application'
  | 'full-stack'
  | 'configuration';

export type TemplateStatus = 'available' | 'draft' | 'deprecated';

export type IdpTemplateParameter = {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  description?: string;
  options?: string[];
  defaultValue?: string | number | boolean;
};

export type IdpTemplate = {
  id: string;
  name: string;
  kind: TemplateKind;
  description: string;
  targetCloud?: string;
  targetLanguage?: string;
  targetFramework?: string;
  outputs: string[];
  version: string;
  usageCount: number;
  status: TemplateStatus;
  displayOrder: number;
  enabled: boolean;
  allowedRoles: string[];
  scaffolderTemplateRef?: string;
  repositoryUrl?: string;
  parameters: IdpTemplateParameter[];
  createdAt: string;
  updatedAt: string;
};

export type TemplateExecutionStatus =
  | 'draft'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type IdpTemplateExecution = {
  id: string;
  templateId: string;
  projectId?: string;
  environmentId?: string;
  status: TemplateExecutionStatus;
  parameters: Record<string, unknown>;
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type IdpDeployment = {
  id: string;
  projectId: string;
  environmentId: string;
  status: DeploymentStatus;
  version?: string;
  repository?: string;
  commitSha?: string;
  startedAt: string;
  finishedAt?: string;
  triggeredBy: string;
};

export type IdpOperationLog = {
  id: string;
  projectId?: string;
  environmentId?: string;
  templateId?: string;
  executionId?: string;
  type:
    | 'project_created'
    | 'environment_created'
    | 'template_executed'
    | 'deployment_started'
    | 'deployment_finished'
    | 'catalog_registered'
    | 'repository_created'
    | 'infra_provisioned'
    | 'error_occurred';
  message: string;
  actor: string;
  createdAt: string;
};

export type IdpRuntimeStatus =
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

export type IdpPolicyDecision = {
  result: 'allow' | 'deny' | 'needs-approval';
  reasons: string[];
  requiredApprovalRefs?: string[];
};

export type IdpRiskSummary = {
  level: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  summary: string;
  factors: string[];
};

export type IdpControlOperationLog = {
  id: string;
  operationLogRef: string;
  actor: {
    entityRef: string;
    type: 'user' | 'group' | 'service' | 'agent';
  };
  targetEntityRef: string;
  eventType:
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
  createdAt: string;
  status: IdpRuntimeStatus;
  message: string;
  projectRef?: string;
  environmentRef?: string;
  templateRef?: string;
  planRef?: string;
  actionRunRef?: string;
  riskSummary?: IdpRiskSummary;
  policyDecision?: IdpPolicyDecision;
};

export type IdpPlanSummary = {
  id: string;
  kind: 'Plan';
  planRef: string;
  actor: {
    entityRef: string;
    type: 'user' | 'group' | 'service' | 'agent';
  };
  targetEntityRef: string;
  eventType: 'plan.created';
  createdAt: string;
  status: IdpRuntimeStatus;
  expectedChangeSummary: string;
  requiredApproval: 'none' | 'owner' | 'environment-owner' | 'manual';
  riskSummary?: IdpRiskSummary;
  policyDecision?: IdpPolicyDecision;
};

export type IdpTemplatePlanPreviewInput = {
  projectRef: string;
  environmentRef?: string;
  templateRef: string;
  parameters: Record<string, unknown>;
  actor: {
    entityRef: string;
    type: 'user' | 'group' | 'service' | 'agent';
  };
  idempotencyKey: string;
};

export type IdpTemplatePlanPreview = {
  plan: IdpPlanSummary;
  operationLog: IdpControlOperationLog;
};

export type IdpProjectControlContext = {
  projectRef: string;
  project: {
    title?: string;
    ownerRefs: string[];
    catalogEntityRef?: string;
  };
  environmentRefs: string[];
  templateRefs: string[];
  allowedActions: {
    observe: 'allowed';
    plan: 'allowed' | 'needs-approval' | 'denied';
    dryRun: 'allowed' | 'needs-approval' | 'denied';
    proposeChange: 'allowed' | 'needs-approval' | 'denied';
    executeNonProduction: 'allowed' | 'needs-approval' | 'denied';
    executeProduction: 'allowed' | 'needs-approval' | 'denied';
    reasons: string[];
  };
  recentOperationLogs: IdpControlOperationLog[];
  latestPlan?: IdpPlanSummary;
  latestActionRun?: {
    actionRunRef: string;
    status: IdpRuntimeStatus;
    mode: 'dry-run' | 'execute';
    externalExecutionRef?: string;
    resultSummary?: string;
    riskSummary?: IdpRiskSummary;
    policyDecision?: IdpPolicyDecision;
  };
  desiredState: {
    authoritativeSource: 'catalog-and-git';
    idpBackendStoresAuthoritativeDesiredState: false;
    notes: string[];
  };
};
