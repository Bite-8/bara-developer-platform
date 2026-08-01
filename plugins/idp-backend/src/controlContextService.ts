import {
  Entity,
  RELATION_HAS_PART,
  RELATION_PART_OF,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { AuthenticationError, NotFoundError } from '@backstage/errors';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { BackstageCredentials } from '@backstage/backend-plugin-api';

import {
  AllowedActionSummary,
  ActorRef,
  CreateTemplatePlanPreviewRequest,
  CreateTemplatePlanPreviewResponse,
  PlanSummary,
  PolicyDecision,
  ProjectControlContext,
  RiskSummary,
} from './contracts';
import { RuntimeAuditStore } from './runtimeStore';

const environmentAnnotation = 'bara.dev/environment-ref';
const templateAnnotation = 'bara.dev/template-ref';
const criticalityAnnotation = 'bara.dev/criticality';

const unique = (values: string[]) => Array.from(new Set(values)).sort();

const relationTargets = (entity: Entity, relationType: string) =>
  entity.relations
    ?.filter(relation => relation.type === relationType)
    .map(relation => relation.targetRef) ?? [];

const annotationRefs = (entity: Entity, annotation: string) =>
  entity.metadata.annotations?.[annotation]
    ?.split(',')
    .map(value => value.trim())
    .filter(Boolean) ?? [];

const isTemplateEntity = (entity: Entity) =>
  entity.kind.toLocaleLowerCase('en-US') === 'template';

const isEnvironmentEntity = (entity: Entity) =>
  entity.kind.toLocaleLowerCase('en-US') === 'resource' &&
  String((entity.spec as { type?: unknown } | undefined)?.type ?? '')
    .toLocaleLowerCase('en-US')
    .includes('environment');

const refName = (entityRef: string) => entityRef.split('/').pop() ?? entityRef;

const isProductionLikeEnvironment = (options: {
  environmentRef?: string;
  criticality?: string;
}) => {
  const criticality = (options.criticality ?? '').toLocaleLowerCase('en-US');
  if (criticality.includes('production') || criticality.includes('critical')) {
    return true;
  }

  const normalized = (options.environmentRef ?? '').toLocaleLowerCase('en-US');
  return (
    normalized.includes('prod') ||
    normalized.includes('production') ||
    normalized.includes('critical')
  );
};

const stableIdPart = (value: string) =>
  value
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const statusForPolicyDecision = (
  policyDecision: PolicyDecision,
): PlanSummary['status'] => {
  if (policyDecision.result === 'deny') {
    return 'denied';
  }

  if (policyDecision.result === 'needs-approval') {
    return 'needs-approval';
  }

  return 'planned';
};

const auditActorForCredentials = (
  credentials: BackstageCredentials,
): ActorRef => {
  const principal = credentials.principal as {
    type?: string;
    userEntityRef?: string;
    subject?: string;
  };

  if (principal.type === 'user' && principal.userEntityRef) {
    return {
      type: 'user',
      entityRef: principal.userEntityRef,
    };
  }

  if (principal.type === 'service' && principal.subject) {
    return {
      type: 'service',
      entityRef: principal.subject,
    };
  }

  throw new AuthenticationError(
    'Authenticated Backstage user or service identity is required to create an auditable Plan preview.',
  );
};

const environmentControlContext = (entity: Entity) => ({
  entityRef: stringifyEntityRef(entity),
  ownerRefs: relationTargets(entity, 'ownedBy'),
  criticality: entity.metadata.annotations?.[criticalityAnnotation],
});

export class ControlContextService {
  constructor(
    private readonly catalog: CatalogService,
    private readonly runtimeStore: RuntimeAuditStore,
  ) {}

  async getProjectControlContext(options: {
    projectRef: string;
    credentials: BackstageCredentials;
  }): Promise<ProjectControlContext> {
    const project = await this.catalog.getEntityByRef(options.projectRef, {
      credentials: options.credentials,
    });

    if (!project) {
      throw new NotFoundError(
        `No project catalog entity found for ref '${options.projectRef}'`,
      );
    }

    const projectRef = stringifyEntityRef(project);
    const projectRelationRefs = relationTargets(project, RELATION_HAS_PART);
    const annotatedEnvironmentRefs = annotationRefs(
      project,
      environmentAnnotation,
    );
    const annotatedTemplateRefs = annotationRefs(project, templateAnnotation);
    const forwardEntityRefs = unique([
      ...projectRelationRefs,
      ...annotatedEnvironmentRefs,
      ...annotatedTemplateRefs,
    ]);
    const [forwardRelatedEntities, reverseRelatedEntities] = await Promise.all([
      forwardEntityRefs.length > 0
        ? this.catalog.getEntitiesByRefs(
            { entityRefs: forwardEntityRefs },
            { credentials: options.credentials },
          )
        : Promise.resolve({ items: [] }),
      this.catalog.getEntities(
        { filter: { 'relations.partOf': projectRef } },
        { credentials: options.credentials },
      ),
    ]);

    const relatedEntities = Array.from(
      new Map(
        [
          ...forwardRelatedEntities.items.filter(
            (entity): entity is Entity => entity !== undefined,
          ),
          ...reverseRelatedEntities.items.filter(entity =>
            relationTargets(entity, RELATION_PART_OF).includes(projectRef),
          ),
        ].map(entity => [stringifyEntityRef(entity), entity]),
      ).values(),
    );

    const relationRefs = unique([
      ...projectRelationRefs,
      ...relatedEntities.map(entity => stringifyEntityRef(entity)),
    ]);

    const environmentRefs = unique([
      ...annotatedEnvironmentRefs,
      ...relationRefs.filter(ref =>
        relatedEntities.some(
          entity =>
            stringifyEntityRef(entity) === ref && isEnvironmentEntity(entity),
        ),
      ),
    ]);

    const templateRefs = unique([
      ...annotatedTemplateRefs,
      ...relationRefs.filter(ref =>
        relatedEntities.some(
          entity =>
            stringifyEntityRef(entity) === ref && isTemplateEntity(entity),
        ),
      ),
    ]);

    const [recentOperationLogs, latestPlan, latestActionRun] =
      await Promise.all([
        this.runtimeStore.listOperationLogs({
          projectRef: stringifyEntityRef(project),
          limit: 20,
        }),
        this.runtimeStore.getLatestPlan(stringifyEntityRef(project)),
        this.runtimeStore.getLatestActionRun(stringifyEntityRef(project)),
      ]);

    return {
      projectRef: stringifyEntityRef(project),
      project: {
        title: project.metadata.title,
        ownerRefs: relationTargets(project, 'ownedBy'),
        catalogEntityRef: stringifyEntityRef(project),
      },
      environmentRefs,
      environments: relatedEntities
        .filter(isEnvironmentEntity)
        .filter(entity => environmentRefs.includes(stringifyEntityRef(entity)))
        .map(environmentControlContext)
        .sort((a, b) => a.entityRef.localeCompare(b.entityRef)),
      templateRefs,
      allowedActions: this.allowedActionsForProject(project),
      recentOperationLogs,
      latestPlan,
      latestActionRun,
      desiredState: this.runtimeStore.getDesiredStateContract(),
    };
  }

  async createTemplatePlanPreview(options: {
    request: CreateTemplatePlanPreviewRequest;
    credentials: BackstageCredentials;
  }): Promise<CreateTemplatePlanPreviewResponse> {
    const project = await this.catalog.getEntityByRef(
      options.request.projectRef,
      {
        credentials: options.credentials,
      },
    );

    if (!project) {
      throw new NotFoundError(
        `No project catalog entity found for ref '${options.request.projectRef}'`,
      );
    }

    const environment = options.request.environmentRef
      ? await this.catalog.getEntityByRef(options.request.environmentRef, {
          credentials: options.credentials,
        })
      : undefined;
    const projectRef = stringifyEntityRef(project);
    const actor = auditActorForCredentials(options.credentials);
    const ownerRefs = relationTargets(project, 'ownedBy');
    const productionLike = isProductionLikeEnvironment({
      environmentRef: options.request.environmentRef,
      criticality: environment?.metadata.annotations?.[criticalityAnnotation],
    });
    const policyDecision = this.policyDecisionForTemplatePlan({
      ownerRefs,
      productionLike,
    });
    const riskSummary = this.riskSummaryForTemplatePlan({
      productionLike,
      policyDecision,
      parameterCount: Object.keys(options.request.parameters).length,
    });
    const now = new Date().toISOString();
    const idPart = stableIdPart(options.request.idempotencyKey);
    const planRef = `plan:${idPart}`;
    const environmentTargetSummary = options.request.environmentRef
      ? `in ${refName(options.request.environmentRef)}`
      : 'without an environment target';
    const expectedChangeSummary = `Preview ${refName(
      options.request.templateRef,
    )} for ${refName(
      projectRef,
    )} ${environmentTargetSummary}; no Scaffolder task, Git PR, AI generation, or execution is started.`;
    const requiredApproval = this.requiredApprovalForPolicy({
      policyDecision,
      productionLike,
    });
    const plan: PlanSummary = {
      id: idPart,
      kind: 'Plan',
      planRef,
      actor,
      targetEntityRef: projectRef,
      eventType: 'plan.created',
      createdAt: now,
      status: statusForPolicyDecision(policyDecision),
      expectedChangeSummary,
      requiredApproval,
      riskSummary,
      policyDecision,
    };
    const operationLog = {
      id: `log-${idPart}`,
      kind: 'OperationLog' as const,
      operationLogRef: `operation-log:${idPart}`,
      actor,
      targetEntityRef: projectRef,
      eventType: 'plan.created' as const,
      createdAt: now,
      status: plan.status,
      projectRef,
      environmentRef: options.request.environmentRef,
      templateRef: options.request.templateRef,
      planRef,
      message: `Plan preview ${plan.status} for ${options.request.templateRef}.`,
      riskSummary,
      policyDecision,
    };

    return this.runtimeStore.appendPlanWithOperationLog({
      plan,
      operationLog,
    });
  }

  private allowedActionsForProject(project: Entity): AllowedActionSummary {
    const ownerRefs = relationTargets(project, 'ownedBy');

    return {
      observe: 'allowed',
      plan: 'allowed',
      dryRun: 'allowed',
      proposeChange: ownerRefs.length > 0 ? 'needs-approval' : 'denied',
      executeNonProduction: ownerRefs.length > 0 ? 'needs-approval' : 'denied',
      executeProduction: 'needs-approval',
      reasons: [
        'Observe, Plan, and Dry-run are separated from side-effecting execution.',
        ownerRefs.length > 0
          ? 'Catalog ownership is available for approval routing.'
          : 'Catalog ownership is missing, so side-effecting action requires policy setup.',
        'Production or critical execution requires explicit human approval.',
      ],
    };
  }

  private policyDecisionForTemplatePlan(options: {
    ownerRefs: string[];
    productionLike: boolean;
  }): PolicyDecision {
    if (options.ownerRefs.length === 0) {
      return {
        result: 'deny',
        reasons: [
          'Catalog ownership is missing, so Bara cannot route required approval.',
        ],
      };
    }

    if (options.productionLike) {
      return {
        result: 'needs-approval',
        reasons: [
          'Production-like or critical environment targets require explicit human approval before side effects.',
          'This request creates only a side-effect-free Plan preview.',
        ],
        requiredApprovalRefs: options.ownerRefs,
      };
    }

    return {
      result: 'allow',
      reasons: [
        'Catalog ownership is available for approval routing.',
        'Plan preview has no side effects and does not start Scaffolder, Git PR, AI generation, or execution.',
      ],
    };
  }

  private riskSummaryForTemplatePlan(options: {
    productionLike: boolean;
    policyDecision: PolicyDecision;
    parameterCount: number;
  }): RiskSummary {
    if (options.policyDecision.result === 'deny') {
      return {
        level: 'high',
        summary: 'Target ownership is missing.',
        factors: [
          'ownerless-target',
          'approval-route-unavailable',
          `parameters:${options.parameterCount}`,
        ],
      };
    }

    if (options.productionLike) {
      return {
        level: 'medium',
        summary: 'Production-like target requires approval before execution.',
        factors: [
          'production-like-environment',
          'side-effect-free-preview',
          `parameters:${options.parameterCount}`,
        ],
      };
    }

    return {
      level: 'low',
      summary: 'Plan preview records expected changes without side effects.',
      factors: [
        'side-effect-free-preview',
        `parameters:${options.parameterCount}`,
      ],
    };
  }

  private requiredApprovalForPolicy(options: {
    policyDecision: PolicyDecision;
    productionLike: boolean;
  }): PlanSummary['requiredApproval'] {
    if (options.policyDecision.result === 'deny') {
      return 'manual';
    }

    if (options.productionLike) {
      return 'environment-owner';
    }

    return 'none';
  }
}
