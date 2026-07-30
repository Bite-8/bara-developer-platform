import {
  Entity,
  RELATION_HAS_PART,
  RELATION_PART_OF,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { NotFoundError } from '@backstage/errors';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { BackstageCredentials } from '@backstage/backend-plugin-api';

import { AllowedActionSummary, ProjectControlContext } from './contracts';
import { RuntimeAuditStore } from './runtimeStore';

const environmentAnnotation = 'bara.dev/environment-ref';
const templateAnnotation = 'bara.dev/template-ref';

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
    const [forwardRelatedEntities, reverseRelatedEntities] = await Promise.all([
      projectRelationRefs.length > 0
        ? this.catalog.getEntitiesByRefs(
            { entityRefs: projectRelationRefs },
            { credentials: options.credentials },
          )
        : Promise.resolve({ items: [] }),
      this.catalog.getEntities(
        { filter: { 'relations.partOf': projectRef } },
        { credentials: options.credentials },
      ),
    ]);

    const relatedEntities = [
      ...forwardRelatedEntities.items.filter(
        (entity): entity is Entity => entity !== undefined,
      ),
      ...reverseRelatedEntities.items.filter(entity =>
        relationTargets(entity, RELATION_PART_OF).includes(projectRef),
      ),
    ];

    const relationRefs = unique([
      ...projectRelationRefs,
      ...relatedEntities.map(entity => stringifyEntityRef(entity)),
    ]);

    const environmentRefs = unique([
      ...annotationRefs(project, environmentAnnotation),
      ...relationRefs.filter(ref =>
        relatedEntities.some(
          entity =>
            stringifyEntityRef(entity) === ref && isEnvironmentEntity(entity),
        ),
      ),
    ]);

    const templateRefs = unique([
      ...annotationRefs(project, templateAnnotation),
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
      templateRefs,
      allowedActions: this.allowedActionsForProject(project),
      recentOperationLogs,
      latestPlan,
      latestActionRun,
      desiredState: this.runtimeStore.getDesiredStateContract(),
    };
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
}
