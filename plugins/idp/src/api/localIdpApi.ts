import {
  environments as seedEnvironments,
  executions as seedExecutions,
  operationLogs as seedOperationLogs,
  projects as seedProjects,
  templates as seedTemplates,
} from '../data/mockData';
import {
  IdpOperationLog,
  IdpTemplateExecution,
  IdpTemplatePlanPreview,
} from '../types';
import { IdpApi, TemplateExecutionInput } from './idpApi';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const executions: IdpTemplateExecution[] = clone(seedExecutions);
const operationLogs: IdpOperationLog[] = clone(seedOperationLogs);

// Local in-memory adapter for browser verification only. Replace this class with
// an implementation that calls a Backstage backend plugin/API when IDP DB,
// Scaffolder, GitHub, and AWS integrations are added.
class LocalIdpApi implements IdpApi {
  async listProjects() {
    return clone(seedProjects);
  }

  async getProject(projectId: string) {
    return clone(seedProjects.find(project => project.id === projectId));
  }

  async listEnvironments() {
    return clone(seedEnvironments);
  }

  async getEnvironment(environmentId: string) {
    return clone(
      seedEnvironments.find(environment => environment.id === environmentId),
    );
  }

  async listTemplates() {
    return clone(seedTemplates);
  }

  async getTemplate(templateId: string) {
    return clone(seedTemplates.find(template => template.id === templateId));
  }

  async listOperationLogs(
    filters: Parameters<IdpApi['listOperationLogs']>[0] = {},
  ) {
    return clone(
      operationLogs.filter(
        log =>
          (!filters.projectId || log.projectId === filters.projectId) &&
          (!filters.environmentId ||
            log.environmentId === filters.environmentId) &&
          (!filters.templateId || log.templateId === filters.templateId) &&
          (!filters.executionId || log.executionId === filters.executionId),
      ),
    );
  }

  async listTemplateExecutions(
    filters: Parameters<IdpApi['listTemplateExecutions']>[0] = {},
  ) {
    return clone(
      executions.filter(
        execution =>
          (!filters.projectId || execution.projectId === filters.projectId) &&
          (!filters.environmentId ||
            execution.environmentId === filters.environmentId) &&
          (!filters.templateId || execution.templateId === filters.templateId),
      ),
    );
  }

  async executeTemplate(input: TemplateExecutionInput) {
    const now = new Date().toISOString();
    const serviceName = String(input.parameters.serviceName ?? 'service');
    const execution: IdpTemplateExecution = {
      id: `exec-${Date.now()}`,
      templateId: input.templateId,
      projectId: input.projectId,
      environmentId: input.environmentId,
      status: serviceName.toLowerCase().includes('fail')
        ? 'failed'
        : 'succeeded',
      parameters: clone(input.parameters),
      requestedBy: input.requestedBy,
      createdAt: now,
      updatedAt: now,
    };
    executions.unshift(execution);
    operationLogs.unshift({
      id: `log-${Date.now()}`,
      projectId: input.projectId,
      environmentId: input.environmentId,
      templateId: input.templateId,
      executionId: execution.id,
      type:
        execution.status === 'failed' ? 'error_occurred' : 'template_executed',
      message: `${input.templateId} execution ${execution.status} for ${serviceName}`,
      actor: input.requestedBy,
      createdAt: now,
    });
    return clone(execution);
  }

  async createTemplatePlanPreview(): Promise<IdpTemplatePlanPreview> {
    throw new Error(
      'Template Plan preview must be created by the backend IDP plugin.',
    );
  }

  async getProjectControlContext(projectRef: string) {
    const now = new Date().toISOString();
    return {
      projectRef,
      project: {
        ownerRefs: [],
      },
      environmentRefs: [],
      templateRefs: [],
      allowedActions: {
        observe: 'allowed' as const,
        plan: 'allowed' as const,
        dryRun: 'allowed' as const,
        proposeChange: 'needs-approval' as const,
        executeNonProduction: 'needs-approval' as const,
        executeProduction: 'needs-approval' as const,
        reasons: [
          'Local adapter mirrors the backend control context contract for browser verification.',
        ],
      },
      recentOperationLogs: [
        {
          id: `local-context-${now}`,
          operationLogRef: `operation-log:local-context-${now}`,
          actor: {
            entityRef: 'user:default/guest',
            type: 'user' as const,
          },
          targetEntityRef: projectRef,
          eventType: 'plan.created' as const,
          createdAt: now,
          status: 'planned' as const,
          message:
            'Local contract sample; use BackendIdpApi for mock-free reads.',
          projectRef,
        },
      ],
      desiredState: {
        authoritativeSource: 'catalog-and-git' as const,
        idpBackendStoresAuthoritativeDesiredState: false as const,
        notes: [
          'Project, Environment, and Template desired state remains owned by Catalog/Git.',
        ],
      },
    };
  }
}

export const idpApi: IdpApi = new LocalIdpApi();
