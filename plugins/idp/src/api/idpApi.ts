import {
  IdpDryRunActionRun,
  IdpDryRunActionRunInput,
  IdpEnvironment,
  IdpOperationLog,
  IdpProjectControlContext,
  IdpProject,
  IdpTemplate,
  IdpTemplateExecution,
  IdpTemplatePlanPreview,
  IdpTemplatePlanPreviewInput,
} from '../types';

export type TemplateExecutionInput = {
  templateId: string;
  projectId?: string;
  environmentId?: string;
  parameters: Record<string, unknown>;
  requestedBy: string;
};

export type IdpApi = {
  listProjects(): Promise<IdpProject[]>;
  getProject(projectId: string): Promise<IdpProject | undefined>;
  listEnvironments(): Promise<IdpEnvironment[]>;
  getEnvironment(environmentId: string): Promise<IdpEnvironment | undefined>;
  listTemplates(): Promise<IdpTemplate[]>;
  getTemplate(templateId: string): Promise<IdpTemplate | undefined>;
  listOperationLogs(filters?: {
    projectId?: string;
    environmentId?: string;
    templateId?: string;
    executionId?: string;
  }): Promise<IdpOperationLog[]>;
  listTemplateExecutions(filters?: {
    projectId?: string;
    environmentId?: string;
    templateId?: string;
  }): Promise<IdpTemplateExecution[]>;
  executeTemplate(input: TemplateExecutionInput): Promise<IdpTemplateExecution>;
  createTemplatePlanPreview(
    input: IdpTemplatePlanPreviewInput,
  ): Promise<IdpTemplatePlanPreview>;
  createDryRunActionRun(
    input: IdpDryRunActionRunInput,
  ): Promise<IdpDryRunActionRun>;
  getProjectControlContext(
    projectRef: string,
  ): Promise<IdpProjectControlContext>;
};
