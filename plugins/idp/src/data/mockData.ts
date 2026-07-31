import {
  IdpDeployment,
  IdpEnvironment,
  IdpOperationLog,
  IdpProject,
  IdpTemplate,
  IdpTemplateExecution,
} from '../types';

export const projects: IdpProject[] = [
  {
    id: 'examples',
    name: 'Examples',
    description:
      'Safe local Catalog System used to verify backend control context reads.',
    owner: 'group:default/guests',
    repositories: [],
    relatedCatalogEntityRefs: ['system:default/examples'],
    environmentIds: [],
    templateIds: ['node-api'],
    status: 'active',
    createdAt: '2026-07-31T00:00:00Z',
    updatedAt: '2026-07-31T00:00:00Z',
  },
  {
    id: 'ec-platform',
    name: 'EC Platform',
    description:
      'Customer storefront, checkout, and order management platform.',
    owner: 'group:default/platform-team',
    repositories: [
      'https://github.com/acme/ec-web',
      'https://github.com/acme/ec-api',
    ],
    relatedCatalogEntityRefs: [
      'component:default/ec-web',
      'component:default/ec-api',
      'resource:default/ec-db',
    ],
    environmentIds: ['ec-dev', 'ec-stg', 'ec-prod'],
    templateIds: ['react-frontend', 'node-api', 'postgres-db', 'ecs-service'],
    status: 'active',
    createdAt: '2026-01-08T09:00:00Z',
    updatedAt: '2026-06-10T11:30:00Z',
  },
  {
    id: 'payment-api',
    name: 'Payment API',
    description: 'Payment orchestration APIs for internal products.',
    owner: 'group:default/payments',
    repositories: ['https://github.com/acme/payment-api'],
    relatedCatalogEntityRefs: [
      'component:default/payment-api',
      'api:default/payment-public-api',
    ],
    environmentIds: ['payment-dev', 'payment-prod'],
    templateIds: ['node-api', 'ecs-service'],
    status: 'active',
    createdAt: '2026-02-12T09:00:00Z',
    updatedAt: '2026-06-12T15:00:00Z',
  },
  {
    id: 'internal-admin',
    name: 'Internal Admin',
    description: 'Back-office tools and administrative workflows.',
    owner: 'group:default/corporate-it',
    repositories: ['https://github.com/acme/internal-admin'],
    relatedCatalogEntityRefs: ['component:default/internal-admin'],
    environmentIds: ['admin-sandbox'],
    templateIds: ['react-frontend', 'github-bootstrap'],
    status: 'provisioning',
    createdAt: '2026-04-01T09:00:00Z',
    updatedAt: '2026-06-11T08:20:00Z',
  },
  {
    id: 'mobile-backend',
    name: 'Mobile Backend',
    description: 'BFF services for mobile apps.',
    owner: 'group:default/mobile',
    repositories: ['https://github.com/acme/mobile-bff'],
    relatedCatalogEntityRefs: ['component:default/mobile-bff'],
    environmentIds: ['mobile-stg'],
    templateIds: ['node-api', 'full-stack-web'],
    status: 'active',
    createdAt: '2026-03-15T09:00:00Z',
    updatedAt: '2026-06-09T18:40:00Z',
  },
  {
    id: 'data-pipeline',
    name: 'Data Pipeline',
    description: 'Batch and streaming analytics pipelines.',
    owner: 'group:default/data',
    repositories: ['https://github.com/acme/data-pipeline'],
    relatedCatalogEntityRefs: [
      'component:default/data-pipeline',
      'resource:default/data-lake',
    ],
    environmentIds: ['data-prod'],
    templateIds: ['catalog-registration'],
    status: 'error',
    createdAt: '2026-01-22T09:00:00Z',
    updatedAt: '2026-06-13T02:14:00Z',
  },
];

export const environments: IdpEnvironment[] = [
  {
    id: 'ec-dev',
    projectId: 'ec-platform',
    name: 'ec-dev',
    type: 'dev',
    awsAccountId: '111111111111',
    region: 'ap-northeast-1',
    deploymentStatus: 'running',
    appStatus: 'running',
    infraStatus: 'running',
    alertStatus: 'normal',
    endpointUrl: 'https://dev.ec.example.com',
    lastDeployedAt: '2026-06-10T10:12:00Z',
    repository: 'https://github.com/acme/ec-api',
    relatedCatalogEntityRefs: ['component:default/ec-api'],
    createdAt: '2026-01-08T10:00:00Z',
    updatedAt: '2026-06-10T10:12:00Z',
  },
  {
    id: 'ec-stg',
    projectId: 'ec-platform',
    name: 'ec-stg',
    type: 'stg',
    awsAccountId: '222222222222',
    region: 'ap-northeast-1',
    deploymentStatus: 'deploying',
    appStatus: 'deploying',
    infraStatus: 'running',
    alertStatus: 'warning',
    endpointUrl: 'https://stg.ec.example.com',
    lastDeployedAt: '2026-06-13T09:00:00Z',
    repository: 'https://github.com/acme/ec-web',
    relatedCatalogEntityRefs: ['component:default/ec-web'],
    createdAt: '2026-01-09T10:00:00Z',
    updatedAt: '2026-06-13T09:30:00Z',
  },
  {
    id: 'ec-prod',
    projectId: 'ec-platform',
    name: 'ec-prod',
    type: 'prod',
    awsAccountId: '333333333333',
    region: 'ap-northeast-1',
    deploymentStatus: 'running',
    appStatus: 'running',
    infraStatus: 'running',
    alertStatus: 'normal',
    endpointUrl: 'https://ec.example.com',
    lastDeployedAt: '2026-06-08T12:00:00Z',
    repository: 'https://github.com/acme/ec-web',
    relatedCatalogEntityRefs: [
      'component:default/ec-web',
      'resource:default/ec-db',
    ],
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-06-08T12:00:00Z',
  },
  {
    id: 'payment-dev',
    projectId: 'payment-api',
    name: 'payment-dev',
    type: 'dev',
    awsAccountId: '444444444444',
    region: 'us-east-1',
    deploymentStatus: 'running',
    appStatus: 'running',
    infraStatus: 'running',
    alertStatus: 'normal',
    endpointUrl: 'https://dev.pay.example.com',
    lastDeployedAt: '2026-06-12T14:00:00Z',
    repository: 'https://github.com/acme/payment-api',
    relatedCatalogEntityRefs: ['component:default/payment-api'],
    createdAt: '2026-02-12T10:00:00Z',
    updatedAt: '2026-06-12T14:00:00Z',
  },
  {
    id: 'payment-prod',
    projectId: 'payment-api',
    name: 'payment-prod',
    type: 'prod',
    awsAccountId: '555555555555',
    region: 'us-east-1',
    deploymentStatus: 'running',
    appStatus: 'running',
    infraStatus: 'running',
    alertStatus: 'normal',
    endpointUrl: 'https://pay.example.com',
    lastDeployedAt: '2026-06-12T15:00:00Z',
    repository: 'https://github.com/acme/payment-api',
    relatedCatalogEntityRefs: [
      'component:default/payment-api',
      'api:default/payment-public-api',
    ],
    createdAt: '2026-02-13T10:00:00Z',
    updatedAt: '2026-06-12T15:00:00Z',
  },
  {
    id: 'admin-sandbox',
    projectId: 'internal-admin',
    name: 'admin-sandbox',
    type: 'sandbox',
    deploymentStatus: 'deploying',
    appStatus: 'unknown',
    infraStatus: 'deploying',
    alertStatus: 'unknown',
    repository: 'https://github.com/acme/internal-admin',
    relatedCatalogEntityRefs: [],
    createdAt: '2026-04-01T11:00:00Z',
    updatedAt: '2026-06-11T08:20:00Z',
  },
  {
    id: 'mobile-stg',
    projectId: 'mobile-backend',
    name: 'mobile-stg',
    type: 'stg',
    awsAccountId: '666666666666',
    region: 'us-west-2',
    deploymentStatus: 'running',
    appStatus: 'running',
    infraStatus: 'running',
    alertStatus: 'warning',
    endpointUrl: 'https://stg.mobile.example.com',
    lastDeployedAt: '2026-06-09T18:40:00Z',
    repository: 'https://github.com/acme/mobile-bff',
    relatedCatalogEntityRefs: ['component:default/mobile-bff'],
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-06-09T18:40:00Z',
  },
  {
    id: 'data-prod',
    projectId: 'data-pipeline',
    name: 'data-prod',
    type: 'prod',
    awsAccountId: '777777777777',
    region: 'ap-northeast-1',
    deploymentStatus: 'failed',
    appStatus: 'failed',
    infraStatus: 'running',
    alertStatus: 'critical',
    lastDeployedAt: '2026-06-13T02:14:00Z',
    repository: 'https://github.com/acme/data-pipeline',
    relatedCatalogEntityRefs: [
      'component:default/data-pipeline',
      'resource:default/data-lake',
    ],
    createdAt: '2026-01-22T10:00:00Z',
    updatedAt: '2026-06-13T02:14:00Z',
  },
];

const getTargetLanguage = (name: string) => {
  if (name.includes('Node') || name.includes('React')) {
    return 'TypeScript';
  }
  return undefined;
};

const getTargetFramework = (name: string) => {
  if (name.includes('React')) {
    return 'React';
  }
  if (name.includes('Node')) {
    return 'Express';
  }
  if (name.includes('ECS')) {
    return 'ECS';
  }
  return undefined;
};

const getTemplateStatus = (index: number): IdpTemplate['status'] => {
  if (index === 1) {
    return 'draft';
  }
  if (index === 7) {
    return 'deprecated';
  }
  return 'available';
};

const getLogProjectId = (index: number) => {
  if (index === 7) {
    return 'data-pipeline';
  }
  if (index > 0) {
    return 'payment-api';
  }
  return 'ec-platform';
};

const params = [
  {
    name: 'serviceName',
    label: 'Service name',
    type: 'string' as const,
    required: true,
    description: 'Generated repository and catalog component name',
  },
];
export const templates: IdpTemplate[] = [
  ['ecs-service', 'AWS ECS Service Template', 'infrastructure'],
  ['postgres-db', 'PostgreSQL Database Template', 'infrastructure'],
  ['node-api', 'Node.js API Template', 'application'],
  ['react-frontend', 'React Frontend Template', 'application'],
  ['backstage-plugin', 'Backstage Plugin Template', 'application'],
  ['full-stack-web', 'Full-stack Web Service Template', 'full-stack'],
  ['github-bootstrap', 'GitHub Repository Bootstrap Template', 'configuration'],
  [
    'catalog-registration',
    'Catalog Entity Registration Template',
    'configuration',
  ],
].map(([id, name, kind], index) => ({
  id,
  name,
  kind: kind as IdpTemplate['kind'],
  description: `${name} exposed as IDP template metadata; actual Scaffolder YAML is referenced, not embedded.`,
  targetCloud:
    kind === 'infrastructure' || kind === 'full-stack' ? 'AWS' : undefined,
  targetLanguage: getTargetLanguage(name),
  targetFramework: getTargetFramework(name),
  outputs: [
    'repository',
    'catalog-info.yaml',
    'catalog asset link',
    'IDP execution record',
  ],
  version: `1.${index}.0`,
  usageCount: 15 + index * 7,
  status: getTemplateStatus(index),
  displayOrder: index + 1,
  enabled: index !== 7,
  allowedRoles: ['group:default/platform-team', 'group:default/developers'],
  scaffolderTemplateRef: `template:default/${id}`,
  repositoryUrl: `https://github.com/acme/idp-templates/tree/main/${id}`,
  parameters: params,
  createdAt: '2026-01-05T09:00:00Z',
  updatedAt: `2026-06-${String(index + 1).padStart(2, '0')}T09:00:00Z`,
}));

export const executions: IdpTemplateExecution[] = [
  {
    id: 'exec-001',
    templateId: 'node-api',
    projectId: 'payment-api',
    environmentId: 'payment-dev',
    status: 'succeeded',
    parameters: { serviceName: 'payment-api' },
    requestedBy: 'user:default/alice',
    createdAt: '2026-06-12T13:00:00Z',
    updatedAt: '2026-06-12T13:08:00Z',
  },
];
export const deployments: IdpDeployment[] = [
  {
    id: 'dep-001',
    projectId: 'payment-api',
    environmentId: 'payment-prod',
    status: 'running',
    version: '2026.06.12',
    repository: 'https://github.com/acme/payment-api',
    commitSha: 'abc1234',
    startedAt: '2026-06-12T14:30:00Z',
    finishedAt: '2026-06-12T15:00:00Z',
    triggeredBy: 'user:default/alice',
  },
];
export const operationLogs: IdpOperationLog[] = [
  ['project_created', 'EC Platform project created'],
  ['environment_created', 'payment-prod environment created'],
  ['template_executed', 'Node.js API Template executed'],
  ['repository_created', 'payment-api repository created'],
  [
    'catalog_registered',
    'component:default/payment-api registered as related asset',
  ],
  ['deployment_started', 'Payment API deployment started'],
  ['deployment_finished', 'Payment API deployment finished'],
  ['error_occurred', 'Data Pipeline deployment failed health checks'],
].map(([type, message], index) => ({
  id: `log-${index + 1}`,
  projectId: getLogProjectId(index),
  environmentId: index > 0 ? 'payment-prod' : undefined,
  templateId: index === 2 ? 'node-api' : undefined,
  executionId: index === 2 ? 'exec-001' : undefined,
  type: type as IdpOperationLog['type'],
  message,
  actor: index === 7 ? 'system' : 'user:default/alice',
  createdAt: `2026-06-1${index % 4}T0${index}:00:00Z`,
}));
