import {
  IdpEnvironment,
  IdpOperationLog,
  IdpProject,
  IdpProjectControlContext,
  IdpTemplate,
  IdpTemplateExecution,
} from '../types';
import { IdpApi, TemplateExecutionInput } from './idpApi';

type FetchLike = typeof fetch;

const unsupported = <T>(message: string): Promise<T> =>
  Promise.reject(new Error(message));

export class BackendIdpApi implements Pick<IdpApi, 'getProjectControlContext'> {
  constructor(
    private readonly options: {
      baseUrl: string;
      fetchApi?: FetchLike;
    },
  ) {}

  async getProjectControlContext(
    projectRef: string,
  ): Promise<IdpProjectControlContext> {
    const response = await (this.options.fetchApi ?? fetch)(
      `${
        this.options.baseUrl
      }/control-context/project?projectRef=${encodeURIComponent(projectRef)}`,
    );

    if (!response.ok) {
      throw new Error(
        `IDP backend control context request failed: ${response.status}`,
      );
    }

    return response.json();
  }
}

export class UnsupportedBackendWriteIdpApi
  extends BackendIdpApi
  implements IdpApi
{
  listProjects(): Promise<IdpProject[]> {
    return unsupported(
      'Use Catalog-backed Project reads via backend control context',
    );
  }

  getProject(): Promise<IdpProject | undefined> {
    return unsupported(
      'Use Catalog-backed Project reads via backend control context',
    );
  }

  listEnvironments(): Promise<IdpEnvironment[]> {
    return unsupported(
      'Use Catalog-backed Environment refs via backend control context',
    );
  }

  getEnvironment(): Promise<IdpEnvironment | undefined> {
    return unsupported(
      'Use Catalog-backed Environment refs via backend control context',
    );
  }

  listTemplates(): Promise<IdpTemplate[]> {
    return unsupported(
      'Use Catalog-backed Template refs via backend control context',
    );
  }

  getTemplate(): Promise<IdpTemplate | undefined> {
    return unsupported(
      'Use Catalog-backed Template refs via backend control context',
    );
  }

  listOperationLogs(): Promise<IdpOperationLog[]> {
    return unsupported(
      'Use backend control context for runtime OperationLog reads',
    );
  }

  listTemplateExecutions(): Promise<IdpTemplateExecution[]> {
    return unsupported(
      'Template execution read API is not wired to backend yet',
    );
  }

  executeTemplate(
    _input: TemplateExecutionInput,
  ): Promise<IdpTemplateExecution> {
    return unsupported(
      'Template execution is outside this backend read boundary',
    );
  }
}
