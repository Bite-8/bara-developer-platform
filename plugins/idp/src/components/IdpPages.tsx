import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import {
  Link,
  Route,
  Routes,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { Content, Header, Page } from '@backstage/core-components';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { CatalogApi, catalogApiRef } from '@backstage/plugin-catalog-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
  makeStyles,
} from '@material-ui/core';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import AppsIcon from '@material-ui/icons/Apps';
import CloudDoneIcon from '@material-ui/icons/CloudDone';
import CloudQueueIcon from '@material-ui/icons/CloudQueue';
import HistoryIcon from '@material-ui/icons/History';
import LayersIcon from '@material-ui/icons/Layers';
import RocketLaunchIcon from '@material-ui/icons/FlightTakeoff';
import { BackendIdpApi } from '../api/backendIdpApi';
import { IdpApi } from '../api/idpApi';
import { idpApi } from '../api/localIdpApi';
import {
  IdpControlOperationLog,
  IdpDryRunActionRun,
  IdpEnvironment,
  IdpOperationLog,
  IdpProjectControlContext,
  IdpProject,
  IdpTemplate,
  IdpTemplateExecution,
  IdpTemplatePlanPreview,
} from '../types';

const useStyles = makeStyles(theme => ({
  shell: {
    minHeight: '100vh',
    margin: theme.spacing(-3),
    padding: theme.spacing(4),
    background:
      'radial-gradient(circle at top left, #f8efe0 0, #f6f0e6 32%, #efe5d6 100%)',
    color: '#3f3428',
    '& a': { color: '#7c4f2f', fontWeight: 700, textDecoration: 'none' },
  },
  hero: {
    borderRadius: 28,
    padding: theme.spacing(4),
    marginBottom: theme.spacing(4),
    background: 'linear-gradient(135deg, #4a3326 0%, #7b5638 100%)',
    color: '#fff9f0',
    boxShadow: '0 24px 60px rgba(74, 51, 38, 0.24)',
  },
  heroActions: { display: 'flex', gap: theme.spacing(1.5), flexWrap: 'wrap' },
  card: {
    height: '100%',
    borderRadius: 24,
    border: '1px solid rgba(111, 82, 57, 0.14)',
    background: 'rgba(255, 250, 242, 0.86)',
    boxShadow: '0 18px 40px rgba(86, 62, 38, 0.10)',
  },
  warmCard: {
    height: '100%',
    borderRadius: 24,
    border: '1px solid rgba(123, 86, 56, 0.22)',
    background: '#fff8ed',
    boxShadow: '0 18px 40px rgba(86, 62, 38, 0.12)',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#7c4f2f',
    background: '#f0ddc7',
  },
  metaGrid: { display: 'flex', flexWrap: 'wrap', gap: theme.spacing(1) },
  muted: { color: '#76695d' },
  cardList: { display: 'grid', gap: theme.spacing(2) },
  miniCard: {
    borderRadius: 18,
    padding: theme.spacing(2),
    background: '#fbf1e3',
    border: '1px solid rgba(123, 86, 56, 0.16)',
  },
  timelineItem: {
    display: 'grid',
    gridTemplateColumns: '36px 1fr',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
  },
  chip: { background: '#ead6bd', color: '#563e2a', fontWeight: 700 },
  chipGood: { background: '#dce8d6', color: '#315231', fontWeight: 700 },
  chipWarn: { background: '#f1dfb6', color: '#6b4b10', fontWeight: 700 },
  chipBad: { background: '#ead0c8', color: '#7c2f23', fontWeight: 700 },
  contextGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: theme.spacing(2),
  },
}));

const useIdpData = () => {
  const [projects, setProjects] = useState<IdpProject[]>([]);
  const [environments, setEnvironments] = useState<IdpEnvironment[]>([]);
  const [templates, setTemplates] = useState<IdpTemplate[]>([]);
  const [operationLogs, setOperationLogs] = useState<IdpOperationLog[]>([]);
  const [executions, setExecutions] = useState<IdpTemplateExecution[]>([]);

  const refresh = async () => {
    const [
      nextProjects,
      nextEnvironments,
      nextTemplates,
      nextLogs,
      nextExecutions,
    ] = await Promise.all([
      idpApi.listProjects(),
      idpApi.listEnvironments(),
      idpApi.listTemplates(),
      idpApi.listOperationLogs(),
      idpApi.listTemplateExecutions(),
    ]);
    setProjects(nextProjects);
    setEnvironments(nextEnvironments);
    setTemplates(nextTemplates);
    setOperationLogs(nextLogs);
    setExecutions(nextExecutions);
  };

  useEffect(() => {
    refresh();
  }, []);

  return {
    projects,
    environments,
    templates,
    operationLogs,
    executions,
    refresh,
  };
};

type IdpDataProps = ReturnType<typeof useIdpData>;
type CatalogProjectsApi = Pick<CatalogApi, 'getEntities'>;
type CatalogProjectListState =
  | { status: 'loading'; projects: Entity[]; error?: undefined }
  | { status: 'success'; projects: Entity[]; error?: undefined }
  | { status: 'error'; projects: Entity[]; error: Error };

type StatusChipProps = { status?: string };
export const StatusChip = ({ status = 'unknown' }: StatusChipProps) => {
  const classes = useStyles();
  const good = ['active', 'running', 'available', 'normal', 'succeeded'];
  const warn = ['deploying', 'provisioning', 'draft', 'warning', 'unknown'];
  const bad = ['error', 'failed', 'critical', 'deprecated'];
  let className = classes.chip;
  if (good.includes(status)) {
    className = classes.chipGood;
  } else if (warn.includes(status)) {
    className = classes.chipWarn;
  } else if (bad.includes(status)) {
    className = classes.chipBad;
  }
  return <Chip size="small" className={className} label={status} />;
};

export const RepositoryLink = ({ url }: { url: string }) => (
  <a href={url}>{url.replace('https://github.com/', '')}</a>
);

export const CatalogAssetLinks = ({ refs }: { refs: string[] }) => {
  const classes = useStyles();
  return refs.length ? (
    <Box className={classes.metaGrid}>
      {refs.map(ref => (
        <Chip key={ref} size="small" className={classes.chip} label={ref} />
      ))}
    </Box>
  ) : (
    <Typography className={classes.muted}>
      Catalog refs are optional links; this IDP data is owned by the plugin mock
      API.
    </Typography>
  );
};

export const SectionCard = ({
  title,
  action,
  children,
}: PropsWithChildren<{ title: string; action?: JSX.Element }>) => {
  const classes = useStyles();
  return (
    <Card className={classes.card}>
      <CardContent>
        <Box className={classes.titleRow}>
          <Typography variant="h5">{title}</Typography>
          {action}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
};

export const SummaryCard = ({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: JSX.Element;
}) => {
  const classes = useStyles();
  return (
    <Card className={classes.warmCard}>
      <CardContent>
        <Box className={classes.titleRow}>
          <Box className={classes.iconBubble}>{icon}</Box>
          <StatusChip status="live" />
        </Box>
        <Typography variant="h3">{value}</Typography>
        <Typography variant="h6">{title}</Typography>
        <Typography className={classes.muted}>{subtitle}</Typography>
      </CardContent>
    </Card>
  );
};

const projectName = (projects: IdpProject[], id: string) =>
  projects.find(p => p.id === id)?.name ?? id;
const templateName = (templates: IdpTemplate[], id: string) =>
  templates.find(t => t.id === id)?.name ?? id;
const projectControlRef = (project: IdpProject) =>
  project.relatedCatalogEntityRefs.find(ref => ref.startsWith('system:')) ??
  `system:default/${project.id}`;
const templateControlRef = (template: IdpTemplate) =>
  template.scaffolderTemplateRef ?? `template:default/${template.id}`;
const environmentControlRef = (environment: IdpEnvironment) =>
  environment.relatedCatalogEntityRefs[0] ??
  `resource:default/${environment.id}`;
const latest = <T extends { updatedAt?: string; createdAt: string }>(
  items: T[],
) =>
  [...items].sort((a, b) =>
    (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt),
  );
const catalogProjectRef = (entity: Entity) => stringifyEntityRef(entity);
const catalogProjectTitle = (entity: Entity) =>
  entity.metadata.title ?? entity.metadata.name;
const catalogProjectOwner = (entity: Entity) =>
  typeof entity.spec?.owner === 'string' ? entity.spec.owner : 'owner pending';
const catalogProjectDescription = (entity: Entity) =>
  entity.metadata.description ??
  'Catalog Project context is available for this entity.';
const catalogProjectIdpRoute = (entity: Entity) =>
  `/idp/catalog-project/${encodeURIComponent(
    entity.metadata.namespace ?? 'default',
  )}/${encodeURIComponent(entity.metadata.name)}`;
const catalogProjectControlRoute = (
  entity: Entity,
  fixtureProjects: IdpProject[],
) => {
  const ref = catalogProjectRef(entity);
  const matchingFixture = fixtureProjects.find(
    project => projectControlRef(project) === ref,
  );

  return matchingFixture
    ? `/idp/projects/${matchingFixture.id}`
    : catalogProjectIdpRoute(entity);
};
const catalogEntityRouteFromRef = (projectRef: string) => {
  const match = projectRef.match(/^([^:]+):([^/]+)\/(.+)$/);
  if (!match) {
    return '/catalog';
  }
  const [, kind, namespace, name] = match;
  return `/catalog/${namespace}/${kind.toLocaleLowerCase()}/${name}`;
};

const useCatalogProjects = (
  catalogApi: CatalogProjectsApi,
): [CatalogProjectListState, () => void] => {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<CatalogProjectListState>({
    status: 'loading',
    projects: [],
  });

  useEffect(() => {
    let cancelled = false;

    setState({ status: 'loading', projects: [] });
    catalogApi
      .getEntities({
        filter: { kind: 'System' },
      })
      .then(response => {
        if (cancelled) {
          return;
        }
        setState({
          status: 'success',
          projects: [...response.items].sort((a, b) =>
            catalogProjectTitle(a).localeCompare(catalogProjectTitle(b)),
          ),
        });
      })
      .catch(error => {
        if (cancelled) {
          return;
        }
        setState({
          status: 'error',
          projects: [],
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [catalogApi, reloadKey]);

  return [state, () => setReloadKey(key => key + 1)];
};

const IdpChrome = ({ children }: PropsWithChildren<{}>) => {
  const classes = useStyles();
  return <Box className={classes.shell}>{children}</Box>;
};

const Hero = ({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle: string }>) => {
  const classes = useStyles();
  return (
    <Box className={classes.hero}>
      <Typography variant="h3">{title}</Typography>
      <Typography variant="h6" style={{ maxWidth: 840, margin: '12px 0 24px' }}>
        {subtitle}
      </Typography>
      <Box className={classes.heroActions}>{children}</Box>
    </Box>
  );
};

const ProjectCard = ({
  project,
  environments,
  templates,
}: {
  project: IdpProject;
  environments: IdpEnvironment[];
  templates: IdpTemplate[];
}) => {
  const classes = useStyles();
  const projectEnvironments = environments.filter(e =>
    project.environmentIds.includes(e.id),
  );
  return (
    <Card className={classes.card}>
      <CardContent>
        <Box className={classes.titleRow}>
          <Typography variant="h5">
            <Link to={`/idp/projects/${project.id}`}>{project.name}</Link>
          </Typography>
          <StatusChip status={project.status} />
        </Box>
        <Typography className={classes.muted}>{project.description}</Typography>
        <Box mt={2} className={classes.metaGrid}>
          <Chip size="small" className={classes.chip} label={project.owner} />
          <Chip
            size="small"
            className={classes.chip}
            label={`${projectEnvironments.length} environments`}
          />
          <Chip
            size="small"
            className={classes.chip}
            label={`${project.templateIds.length} templates`}
          />
        </Box>
        <Box mt={2} className={classes.metaGrid}>
          {projectEnvironments.map(e => (
            <StatusChip
              key={e.id}
              status={`${e.type}: ${e.deploymentStatus}`}
            />
          ))}
        </Box>
        <Divider style={{ margin: '18px 0' }} />
        <Typography variant="body2">
          Creation paths:{' '}
          {project.templateIds
            .slice(0, 3)
            .map(id => templateName(templates, id))
            .join(' / ')}
        </Typography>
      </CardContent>
    </Card>
  );
};

const EnvironmentCard = ({
  environment,
  projects,
}: {
  environment: IdpEnvironment;
  projects: IdpProject[];
}) => {
  const classes = useStyles();
  return (
    <Card className={classes.card}>
      <CardContent>
        <Box className={classes.titleRow}>
          <Typography variant="h5">
            <Link to={`/idp/environments/${environment.id}`}>
              {environment.name}
            </Link>
          </Typography>
          <StatusChip status={environment.type} />
        </Box>
        <Typography className={classes.muted}>
          {projectName(projects, environment.projectId)} /{' '}
          {environment.region ?? 'region pending'}
        </Typography>
        <Box mt={2} className={classes.metaGrid}>
          <StatusChip status={environment.deploymentStatus} />
          <StatusChip status={`infra: ${environment.infraStatus}`} />
          <StatusChip status={`app: ${environment.appStatus}`} />
          <StatusChip status={`alerts: ${environment.alertStatus}`} />
        </Box>
        <Box mt={2}>
          <Typography variant="body2">
            Updated {environment.updatedAt}
          </Typography>
          <Typography variant="body2">
            Last deploy {environment.lastDeployedAt ?? 'pending'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const TemplateCard = ({ template }: { template: IdpTemplate }) => {
  const classes = useStyles();
  return (
    <Card className={classes.card}>
      <CardContent>
        <Box className={classes.titleRow}>
          <Typography variant="h5">
            <Link to={`/idp/templates/${template.id}`}>{template.name}</Link>
          </Typography>
          <StatusChip
            status={template.status === 'draft' ? 'preparing' : template.status}
          />
        </Box>
        <Typography className={classes.muted}>
          {template.description}
        </Typography>
        <Box mt={2} className={classes.metaGrid}>
          <Chip size="small" className={classes.chip} label={template.kind} />
          {template.targetCloud && (
            <Chip
              size="small"
              className={classes.chip}
              label={template.targetCloud}
            />
          )}
          {template.targetLanguage && (
            <Chip
              size="small"
              className={classes.chip}
              label={template.targetLanguage}
            />
          )}
          <Chip
            size="small"
            className={classes.chip}
            label={`v${template.version}`}
          />
        </Box>
        <Box mt={2}>
          <Button
            component={Link}
            to={`/idp/templates/${template.id}/run`}
            variant="outlined"
            disabled={!template.enabled}
          >
            Use this IDP template
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export const OperationLogList = ({
  operationLogs,
  projectId,
  environmentId,
}: {
  operationLogs: IdpOperationLog[];
  projectId?: string;
  environmentId?: string;
}) => {
  const classes = useStyles();
  return (
    <Box>
      {operationLogs
        .filter(
          l =>
            (!projectId || l.projectId === projectId) &&
            (!environmentId || l.environmentId === environmentId),
        )
        .slice(0, 6)
        .map(log => (
          <Box key={log.id} className={classes.timelineItem}>
            <Box className={classes.iconBubble}>
              <HistoryIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1">{log.message}</Typography>
              <Typography className={classes.muted}>
                {log.type} by {log.actor} · {log.createdAt}
              </Typography>
            </Box>
          </Box>
        ))}
    </Box>
  );
};

export const EmptyState = ({ title }: { title: string }) => (
  <IdpChrome>
    <SectionCard title={title}>
      <Typography>Mock data is not available yet.</Typography>
    </SectionCard>
  </IdpChrome>
);

type ControlContextApi = Pick<
  IdpApi,
  | 'getProjectControlContext'
  | 'createTemplatePlanPreview'
  | 'createDryRunActionRun'
>;

const useBackendControlContextApi = (): ControlContextApi => {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  return useMemo(
    () => ({
      getProjectControlContext: async (projectRef: string) => {
        const baseUrl = await discoveryApi.getBaseUrl('idp');
        return new BackendIdpApi({
          baseUrl,
          fetchApi: fetchApi.fetch,
        }).getProjectControlContext(projectRef);
      },
      createTemplatePlanPreview: async input => {
        const baseUrl = await discoveryApi.getBaseUrl('idp');
        return new BackendIdpApi({
          baseUrl,
          fetchApi: fetchApi.fetch,
        }).createTemplatePlanPreview(input);
      },
      createDryRunActionRun: async input => {
        const baseUrl = await discoveryApi.getBaseUrl('idp');
        return new BackendIdpApi({
          baseUrl,
          fetchApi: fetchApi.fetch,
        }).createDryRunActionRun(input);
      },
    }),
    [discoveryApi, fetchApi],
  );
};

type ActionDecisionKey = Exclude<
  keyof IdpProjectControlContext['allowedActions'],
  'reasons'
>;

const actionLabels: Record<ActionDecisionKey, string> = {
  observe: 'Observe',
  plan: 'Plan',
  dryRun: 'Dry-run',
  proposeChange: 'Propose change',
  executeNonProduction: 'Execute non-production',
  executeProduction: 'Execute production',
};

const actionDecisionKeys = Object.keys(actionLabels) as ActionDecisionKey[];

const ControlLogList = ({ logs }: { logs: IdpControlOperationLog[] }) => {
  const classes = useStyles();

  if (!logs.length) {
    return (
      <Typography className={classes.muted}>
        No recent runtime operation logs are recorded for this Project yet.
      </Typography>
    );
  }

  return (
    <Box>
      {logs.slice(0, 4).map(log => (
        <Box key={log.id} className={classes.timelineItem}>
          <Box className={classes.iconBubble}>
            <HistoryIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="subtitle1">{log.message}</Typography>
            <Typography className={classes.muted}>
              {log.eventType} by {log.actor.entityRef} · {log.status} ·{' '}
              {log.createdAt}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const RefChips = ({ refs, empty }: { refs: string[]; empty: string }) => {
  const classes = useStyles();

  return refs.length ? (
    <Box className={classes.metaGrid}>
      {refs.map(ref => (
        <Chip key={ref} size="small" className={classes.chip} label={ref} />
      ))}
    </Box>
  ) : (
    <Typography className={classes.muted}>{empty}</Typography>
  );
};

const findPlanPreviewTemplate = (
  project: IdpProject,
  templates: IdpTemplate[],
  context?: IdpProjectControlContext,
) => {
  const enabledTemplates = templates.filter(
    template => template.enabled && template.status === 'available',
  );
  const contextTemplate = context?.templateRefs
    .map(ref =>
      enabledTemplates.find(template => templateControlRef(template) === ref),
    )
    .find(Boolean);

  return (
    contextTemplate ??
    project.templateIds
      .map(id => enabledTemplates.find(template => template.id === id))
      .find(Boolean)
  );
};

const relatedProjectEnvironments = (
  project: IdpProject,
  environments: IdpEnvironment[],
) =>
  environments.filter(
    environment =>
      environment.projectId === project.id ||
      project.environmentIds.includes(environment.id),
  );

const findPlanPreviewEnvironment = (
  project: IdpProject,
  environments: IdpEnvironment[],
  context?: IdpProjectControlContext,
) => {
  const projectEnvironments = relatedProjectEnvironments(project, environments);
  const contextEnvironment = context?.environmentRefs
    .map(ref =>
      projectEnvironments.find(
        environment => environmentControlRef(environment) === ref,
      ),
    )
    .find(Boolean);

  return contextEnvironment ?? projectEnvironments[0];
};

const planPreviewPath = ({
  project,
  template,
  environment,
}: {
  project: IdpProject;
  template: IdpTemplate;
  environment?: IdpEnvironment;
}) => {
  const params = new URLSearchParams({ projectId: project.id });
  if (environment) {
    params.set('environmentId', environment.id);
  }
  return `/idp/templates/${template.id}/run?${params.toString()}`;
};

const RecommendedNextActionPanel = ({
  project,
  environments,
  templates,
  status,
  context,
}: {
  project: IdpProject;
  environments: IdpEnvironment[];
  templates: IdpTemplate[];
  status: 'loading' | 'success' | 'error';
  context?: IdpProjectControlContext;
}) => {
  const classes = useStyles();
  const template = findPlanPreviewTemplate(project, templates, context);
  const environment = findPlanPreviewEnvironment(
    project,
    environments,
    context,
  );
  const latestLog = context?.recentOperationLogs[0];
  const riskSummary =
    context?.latestPlan?.riskSummary ??
    context?.latestActionRun?.riskSummary ??
    latestLog?.riskSummary;
  const actionRun = context?.latestActionRun;
  const cta = template ? (
    <Button
      component={Link}
      to={planPreviewPath({ project, template, environment })}
      variant="contained"
      color="primary"
      startIcon={<RocketLaunchIcon />}
    >
      Create plan preview
    </Button>
  ) : (
    <Button
      component={Link}
      to="/idp/templates"
      variant="contained"
      color="primary"
      startIcon={<RocketLaunchIcon />}
    >
      Open Templates
    </Button>
  );

  if (status === 'loading') {
    return (
      <SectionCard title="Recommended next action" action={cta}>
        <Typography className={classes.muted}>
          Loading backend context before recommending the next safe step. The
          manual Template run path remains available.
        </Typography>
      </SectionCard>
    );
  }

  if (status === 'error' || !context) {
    return (
      <SectionCard title="Recommended next action" action={cta}>
        <Typography>
          Backend context is unavailable, so use the Template run path to create
          a side-effect-free Plan preview for this Project.
        </Typography>
        <Typography className={classes.muted}>
          Project context is preserved where a local Template match is
          available; no policy or approval enforcement is inferred here.
        </Typography>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Recommended next action" action={cta}>
      <Box className={classes.cardList}>
        <Box>
          <Typography variant="h6">
            {context.latestPlan
              ? 'Review the latest Plan, then create a fresh preview if the desired change has moved.'
              : 'Create a side-effect-free Plan preview for this Project.'}
          </Typography>
          <Typography className={classes.muted}>
            This recommendation summarizes existing backend context only. It
            does not enforce policy, approve changes, or start execution.
          </Typography>
        </Box>
        <Box className={classes.contextGrid}>
          <Box className={classes.miniCard}>
            <Typography variant="subtitle2" className={classes.muted}>
              Latest plan
            </Typography>
            {context.latestPlan ? (
              <>
                <Typography variant="h6">
                  {context.latestPlan.planRef}
                </Typography>
                <Typography>
                  {context.latestPlan.expectedChangeSummary}
                </Typography>
                <Box mt={1} className={classes.metaGrid}>
                  <StatusChip status={context.latestPlan.status} />
                  <Chip
                    size="small"
                    className={classes.chip}
                    label={`Required approval: ${context.latestPlan.requiredApproval}`}
                  />
                  <Chip
                    size="small"
                    className={classes.chip}
                    label={`Risk: ${riskSummary?.level ?? 'unknown'}`}
                  />
                </Box>
              </>
            ) : (
              <Typography className={classes.muted}>
                No latest Plan is recorded yet. Start with a Plan preview before
                any side-effecting action.
              </Typography>
            )}
          </Box>
          <Box className={classes.miniCard}>
            <Typography variant="subtitle2" className={classes.muted}>
              Latest runtime log
            </Typography>
            {latestLog ? (
              <>
                <Typography variant="h6">
                  {latestLog.operationLogRef}
                </Typography>
                <Typography>{latestLog.message}</Typography>
                <Typography className={classes.muted}>
                  {latestLog.status} · {latestLog.eventType}
                </Typography>
              </>
            ) : (
              <Typography className={classes.muted}>
                No runtime log has been recorded for this Project yet.
              </Typography>
            )}
          </Box>
          <Box className={classes.miniCard}>
            <Typography variant="subtitle2" className={classes.muted}>
              Approval and action context
            </Typography>
            <Typography>
              Plan: {context.allowedActions.plan} · Dry-run:{' '}
              {context.allowedActions.dryRun}
            </Typography>
            <Typography>
              Propose change: {context.allowedActions.proposeChange}
            </Typography>
            {actionRun ? (
              <Typography className={classes.muted}>
                Latest action run: {actionRun.actionRunRef} · {actionRun.mode} ·{' '}
                {actionRun.status}
              </Typography>
            ) : (
              <Typography className={classes.muted}>
                No action run has been recorded yet.
              </Typography>
            )}
          </Box>
        </Box>
        <Typography className={classes.muted}>
          Preview target: {template ? template.name : 'choose a Template'} for{' '}
          {project.name}
          {environment ? ` / ${environment.name}` : ''}.
        </Typography>
      </Box>
    </SectionCard>
  );
};

export const ProjectControlContextSection = ({
  project,
  environments,
  templates,
  projectRef,
  controlContextApi,
}: {
  project: IdpProject;
  environments: IdpEnvironment[];
  templates: IdpTemplate[];
  projectRef: string;
  controlContextApi: ControlContextApi;
}) => {
  const [context, setContext] = useState<IdpProjectControlContext>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setErrorMessage('');
    setContext(undefined);

    controlContextApi
      .getProjectControlContext(projectRef)
      .then(nextContext => {
        if (active) {
          setContext(nextContext);
          setStatus('success');
        }
      })
      .catch(error => {
        if (active) {
          setStatus('error');
          setErrorMessage(
            error instanceof Error ? error.message : 'Unknown IDP API error',
          );
        }
      });

    return () => {
      active = false;
    };
  }, [controlContextApi, projectRef, reloadKey]);

  return (
    <>
      <Grid item xs={12}>
        <RecommendedNextActionPanel
          project={project}
          environments={environments}
          templates={templates}
          status={status}
          context={context}
        />
      </Grid>
      <Grid item xs={12}>
        <BackendControlContextPanel
          projectRef={projectRef}
          status={status}
          context={context}
          errorMessage={errorMessage}
          catalogRoute={catalogEntityRouteFromRef(projectRef)}
          onRetry={() => setReloadKey(key => key + 1)}
        />
      </Grid>
    </>
  );
};

function BackendControlContextPanel({
  projectRef,
  status,
  context,
  errorMessage,
  catalogRoute,
  onRetry,
}: {
  projectRef: string;
  status: 'loading' | 'success' | 'error';
  context?: IdpProjectControlContext;
  errorMessage: string;
  catalogRoute: string;
  onRetry: () => void;
}) {
  const classes = useStyles();
  const latestLog = context?.recentOperationLogs[0];

  return (
    <SectionCard title="Backend control context">
      <Box className={classes.cardList}>
        <Box>
          <Typography>
            Source: IDP backend control-context API for canonical Catalog
            Project ref.
          </Typography>
          <Typography className={classes.muted}>
            Requested Project ref: {projectRef}. This read-only view reports
            Catalog/backend context only and does not merge local fixture
            Project state.
          </Typography>
        </Box>
        {status === 'loading' && (
          <Typography className={classes.muted}>
            Loading backend control context...
          </Typography>
        )}
        {status === 'error' && (
          <Box className={classes.miniCard}>
            <StatusChip status="error" />
            <Typography style={{ marginTop: 12 }}>
              Backend control context could not be loaded.
            </Typography>
            <Typography className={classes.muted}>{errorMessage}</Typography>
            <Typography className={classes.muted}>
              Retry the backend read, or open the canonical Catalog entity to
              inspect the source entity. Local fixture cards are not treated as
              authoritative recovery data.
            </Typography>
            <Box mt={2} className={classes.metaGrid}>
              <Button variant="outlined" onClick={onRetry}>
                Retry backend read
              </Button>
              <Button component={Link} to={catalogRoute} variant="outlined">
                Open Catalog entity
              </Button>
            </Box>
          </Box>
        )}
        {status === 'success' && context && (
          <>
            <Box className={classes.contextGrid}>
              <Box className={classes.miniCard}>
                <Typography variant="subtitle2" className={classes.muted}>
                  Project ref
                </Typography>
                <Typography variant="h6">{context.projectRef}</Typography>
                <Typography className={classes.muted}>
                  Owner:{' '}
                  {context.project.ownerRefs.length
                    ? context.project.ownerRefs.join(', ')
                    : 'Catalog owner not resolved'}
                </Typography>
              </Box>
              <Box className={classes.miniCard}>
                <Typography variant="subtitle2" className={classes.muted}>
                  Desired state source
                </Typography>
                <Typography variant="h6">
                  {context.desiredState.authoritativeSource}
                </Typography>
                <Typography className={classes.muted}>
                  IDP backend desired-state store:{' '}
                  {context.desiredState
                    .idpBackendStoresAuthoritativeDesiredState
                    ? 'enabled'
                    : 'disabled'}
                </Typography>
              </Box>
              <Box className={classes.miniCard}>
                <Typography variant="subtitle2" className={classes.muted}>
                  Latest plan
                </Typography>
                {context.latestPlan ? (
                  <>
                    <Typography variant="h6">
                      {context.latestPlan.planRef}
                    </Typography>
                    <Typography className={classes.muted}>
                      {context.latestPlan.status} ·{' '}
                      {context.latestPlan.expectedChangeSummary}
                    </Typography>
                  </>
                ) : (
                  <Typography className={classes.muted}>
                    No latest plan is recorded for this Project yet.
                  </Typography>
                )}
              </Box>
              <Box className={classes.miniCard}>
                <Typography variant="subtitle2" className={classes.muted}>
                  Latest action run
                </Typography>
                {context.latestActionRun ? (
                  <>
                    <Typography variant="h6">
                      {context.latestActionRun.actionRunRef}
                    </Typography>
                    <Typography className={classes.muted}>
                      {context.latestActionRun.mode} ·{' '}
                      {context.latestActionRun.status}
                    </Typography>
                  </>
                ) : (
                  <Typography className={classes.muted}>
                    No latest action run is recorded for this Project yet.
                  </Typography>
                )}
              </Box>
              <Box className={classes.miniCard}>
                <Typography variant="subtitle2" className={classes.muted}>
                  Latest runtime log
                </Typography>
                {latestLog ? (
                  <>
                    <Typography variant="h6">
                      {latestLog.operationLogRef}
                    </Typography>
                    <Typography className={classes.muted}>
                      {latestLog.status} · {latestLog.eventType}
                    </Typography>
                  </>
                ) : (
                  <Typography className={classes.muted}>
                    No runtime log has been recorded for this Project yet.
                  </Typography>
                )}
              </Box>
            </Box>

            <Box>
              <Typography variant="h6">Related Environment refs</Typography>
              <RefChips
                refs={context.environmentRefs}
                empty="No related Environment refs are returned by backend control context."
              />
            </Box>
            <Box>
              <Typography variant="h6">Related Template refs</Typography>
              <RefChips
                refs={context.templateRefs}
                empty="No related Template refs are returned by backend control context."
              />
            </Box>
            <Box>
              <Typography variant="h6">Approval summary</Typography>
              <Typography className={classes.muted}>
                These values summarize whether future actions are expected to
                need approval. They are not permission enforcement or completed
                approval records.
              </Typography>
              <Box mt={1} className={classes.metaGrid}>
                {actionDecisionKeys.map(action => (
                  <Chip
                    key={action}
                    size="small"
                    className={classes.chip}
                    label={`${actionLabels[action]}: ${context.allowedActions[action]}`}
                  />
                ))}
              </Box>
              {context.allowedActions.reasons.map(reason => (
                <Typography key={reason} className={classes.muted}>
                  {reason}
                </Typography>
              ))}
            </Box>
            <Box>
              <Typography variant="h6">Recent runtime logs</Typography>
              <ControlLogList logs={context.recentOperationLogs} />
            </Box>
          </>
        )}
      </Box>
    </SectionCard>
  );
}

const CatalogProjectEntry = ({
  entity,
  projects,
}: {
  entity: Entity;
  projects: IdpProject[];
}) => {
  const classes = useStyles();
  const ref = catalogProjectRef(entity);
  const route = catalogProjectControlRoute(entity, projects);
  const opensLocalControlContext = route.startsWith('/idp/projects/');
  const routeLabel = opensLocalControlContext
    ? 'Fixture-matched control context'
    : 'Catalog control context';

  return (
    <Box className={classes.miniCard}>
      <Box className={classes.titleRow}>
        <Typography variant="h6">{catalogProjectTitle(entity)}</Typography>
        <Chip size="small" className={classes.chip} label={routeLabel} />
      </Box>
      <Typography className={classes.muted}>
        {catalogProjectDescription(entity)}
      </Typography>
      <Box mt={1.5} className={classes.metaGrid}>
        <Chip size="small" className={classes.chip} label={ref} />
        <Chip
          size="small"
          className={classes.chip}
          label={catalogProjectOwner(entity)}
        />
      </Box>
      <Box mt={2}>
        <Button component={Link} to={route} variant="outlined">
          Open Project control context
        </Button>
      </Box>
    </Box>
  );
};

export const CatalogProjectContextListContent = ({
  projects,
  catalogApi,
}: {
  projects: IdpProject[];
  catalogApi: CatalogProjectsApi;
}) => {
  const classes = useStyles();
  const [state, retry] = useCatalogProjects(catalogApi);

  return (
    <SectionCard title="Catalog-backed Project context">
      <Box className={classes.cardList}>
        <Box>
          <Typography>
            Source: Backstage Catalog `System` entities visible to the current
            identity.
          </Typography>
          <Typography className={classes.muted}>
            This read-only list is separate from the safe local fixture
            portfolio below. Fixture cards are examples only and are not
            promoted to authoritative Catalog, Git, or runtime status.
          </Typography>
        </Box>
        {state.status === 'loading' && (
          <Box className={classes.miniCard}>
            <Typography variant="h6">Loading Catalog Projects...</Typography>
            <Typography className={classes.muted}>
              Reading Catalog entries with the existing Backstage frontend API.
            </Typography>
          </Box>
        )}
        {state.status === 'error' && (
          <Box className={classes.miniCard}>
            <Typography variant="h6">
              Catalog Project context could not be loaded.
            </Typography>
            <Typography className={classes.muted}>
              {state.error.message}
            </Typography>
            <Typography className={classes.muted}>
              Keep using the fixture overview for exploration only, or retry the
              Catalog read when the service is available.
            </Typography>
            <Box mt={2}>
              <Button variant="outlined" onClick={retry}>
                Retry Catalog read
              </Button>
            </Box>
          </Box>
        )}
        {state.status === 'success' && state.projects.length === 0 && (
          <Box className={classes.miniCard}>
            <Typography variant="h6">
              No Catalog Project entries are visible.
            </Typography>
            <Typography className={classes.muted}>
              The fixture overview remains a safe local example, not a
              substitute for Catalog/Git desired state. Use the Catalog to add
              or request access to Project `System` entities.
            </Typography>
            <Box mt={2}>
              <Button component={Link} to="/catalog" variant="outlined">
                Open Catalog
              </Button>
            </Box>
          </Box>
        )}
        {state.status === 'success' &&
          state.projects.map(entity => (
            <CatalogProjectEntry
              key={catalogProjectRef(entity)}
              entity={entity}
              projects={projects}
            />
          ))}
      </Box>
    </SectionCard>
  );
};

export const CatalogProjectContextList = ({
  projects,
}: {
  projects: IdpProject[];
}) => {
  const catalogApi = useApi(catalogApiRef);

  return (
    <CatalogProjectContextListContent
      projects={projects}
      catalogApi={catalogApi}
    />
  );
};

export const IdpDashboardPage = ({
  projects,
  environments,
  templates,
  operationLogs,
  catalogApi,
}: IdpDataProps & { catalogApi?: CatalogProjectsApi }) => {
  const classes = useStyles();
  const availableTemplates = templates.filter(t => t.status === 'available');
  return (
    <IdpChrome>
      <Header
        title="Bara IDP"
        subtitle="Project, environment, and template operations in one calm workspace"
      />
      <Content>
        <Hero
          title="IDP Dashboard"
          subtitle="安全な fixture overview から始め、Catalog / Git desired state と runtime context を確認して次の action へ進む画面です。"
        >
          <Button
            component={Link}
            to="/idp/projects"
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
          >
            Create / browse project
          </Button>
          <Button
            component={Link}
            to="/idp/templates"
            variant="outlined"
            style={{ color: '#fff9f0', borderColor: '#fff9f0' }}
          >
            Choose template
          </Button>
        </Hero>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {catalogApi ? (
              <CatalogProjectContextListContent
                projects={projects}
                catalogApi={catalogApi}
              />
            ) : (
              <CatalogProjectContextList projects={projects} />
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Projects"
              value={projects.length}
              subtitle="safe local fixture portfolio"
              icon={<AppsIcon />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Environments"
              value={environments.length}
              subtitle="safe local fixture states"
              icon={<CloudDoneIcon />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Templates"
              value={availableTemplates.length}
              subtitle="safe local fixture templates"
              icon={<LayersIcon />}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <SectionCard
              title="Fixture portfolio"
              action={
                <Button component={Link} to="/idp/projects">
                  View all
                </Button>
              }
            >
              <Box className={classes.cardList}>
                {latest(projects)
                  .slice(0, 3)
                  .map(p => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      environments={environments}
                      templates={templates}
                    />
                  ))}
              </Box>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <SectionCard
              title="Data boundary"
              action={
                <Button component={Link} to="/idp/projects/examples">
                  Open Project context
                </Button>
              }
            >
              <Box className={classes.iconBubble}>
                <HistoryIcon />
              </Box>
              <Typography variant="h5" style={{ marginTop: 16 }}>
                Explore safely, then read current context
              </Typography>
              <Typography className={classes.muted}>
                Portfolio, environment, template, and recent-operation cards on
                this entry are safe local fixtures for exploring Bara. They are
                not live Catalog, GitHub, or runtime status.
              </Typography>
              <Box mt={2} className={classes.metaGrid}>
                <Chip
                  size="small"
                  className={classes.chip}
                  label="Fixture overview"
                />
                <Chip
                  size="small"
                  className={classes.chip}
                  label="No live integration claim"
                />
              </Box>
              <Typography className={classes.muted} style={{ marginTop: 16 }}>
                Open a Project control context to read Catalog / Git desired
                state and IDP runtime records before taking the next action.
              </Typography>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <SectionCard
              title="Fixture environment highlights"
              action={
                <Button component={Link} to="/idp/environments">
                  View all
                </Button>
              }
            >
              <Box className={classes.cardList}>
                {latest(environments)
                  .slice(0, 3)
                  .map(e => (
                    <EnvironmentCard
                      key={e.id}
                      environment={e}
                      projects={projects}
                    />
                  ))}
              </Box>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <SectionCard
              title="Fixture creation templates"
              action={
                <Button component={Link} to="/idp/templates">
                  Open
                </Button>
              }
            >
              <Box className={classes.cardList}>
                {templates.slice(0, 3).map(t => (
                  <TemplateCard key={t.id} template={t} />
                ))}
              </Box>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <SectionCard title="Fixture recent operations">
              <OperationLogList operationLogs={operationLogs} />
            </SectionCard>
          </Grid>
        </Grid>
      </Content>
    </IdpChrome>
  );
};

export const ProjectListPage = ({
  projects,
  environments,
  templates,
}: IdpDataProps) => (
  <IdpChrome>
    <Header
      title="IDP Projects"
      subtitle="Project list and detail entry points"
    />
    <Content>
      <Hero
        title="Projects"
        subtitle="プロジェクトは IDP 上の操作対象です。作成ボタンから将来のプロビジョニング導線へ接続します。"
      >
        <Button
          component={Link}
          to="/idp/templates"
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
        >
          Create project from template
        </Button>
      </Hero>
      <Grid container spacing={3}>
        {projects.map(project => (
          <Grid item xs={12} md={6} key={project.id}>
            <ProjectCard
              project={project}
              environments={environments}
              templates={templates}
            />
          </Grid>
        ))}
      </Grid>
    </Content>
  </IdpChrome>
);

export const ProjectDetailContent = ({
  projects,
  environments,
  templates,
  operationLogs,
  controlContextApi,
}: IdpDataProps & { controlContextApi: ControlContextApi }) => {
  const classes = useStyles();
  const { projectId } = useParams();
  const p = projects.find(x => x.id === projectId);
  if (!p) return <EmptyState title="Project not found" />;
  const linkedEnvironments = environments.filter(e =>
    p.environmentIds.includes(e.id),
  );
  return (
    <IdpChrome>
      <Header
        title={p.name}
        subtitle="Project detail, linked environments, repositories, and creation paths"
      />
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <ProjectCard
              project={p}
              environments={environments}
              templates={templates}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <SectionCard title="Create">
              <Button
                component={Link}
                to="/idp/templates"
                variant="contained"
                startIcon={<RocketLaunchIcon />}
              >
                Create app or infra
              </Button>
              <Box mt={2}>
                <Typography className={classes.muted}>
                  Available for this project:{' '}
                  {p.templateIds
                    .map(id => templateName(templates, id))
                    .join(', ')}
                </Typography>
              </Box>
            </SectionCard>
          </Grid>
          <ProjectControlContextSection
            project={p}
            environments={environments}
            templates={templates}
            projectRef={projectControlRef(p)}
            controlContextApi={controlContextApi}
          />
          <Grid item xs={12}>
            <SectionCard title="Linked environments">
              <Grid container spacing={2}>
                {linkedEnvironments.map(e => (
                  <Grid item xs={12} md={4} key={e.id}>
                    <EnvironmentCard environment={e} projects={projects} />
                  </Grid>
                ))}
              </Grid>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionCard title="Repositories">
              {p.repositories.map(r => (
                <Box key={r} mb={1}>
                  <RepositoryLink url={r} />
                </Box>
              ))}
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionCard title="Related Catalog assets">
              <CatalogAssetLinks refs={p.relatedCatalogEntityRefs} />
            </SectionCard>
          </Grid>
          <Grid item xs={12}>
            <SectionCard title="Recent operations">
              <OperationLogList
                operationLogs={operationLogs}
                projectId={p.id}
              />
            </SectionCard>
          </Grid>
        </Grid>
      </Content>
    </IdpChrome>
  );
};

export const ProjectDetailPage = (props: IdpDataProps) => {
  const controlContextApi = useBackendControlContextApi();

  return (
    <ProjectDetailContent {...props} controlContextApi={controlContextApi} />
  );
};

export const CatalogProjectDetailContent = ({
  controlContextApi,
}: {
  controlContextApi: ControlContextApi;
}) => {
  const classes = useStyles();
  const { namespace = 'default', name = '' } = useParams();
  const projectRef = `system:${namespace}/${name}`;
  const catalogRoute = `/catalog/${namespace}/system/${name}`;
  const [context, setContext] = useState<IdpProjectControlContext>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setErrorMessage('');
    setContext(undefined);

    controlContextApi
      .getProjectControlContext(projectRef)
      .then(nextContext => {
        if (active) {
          setContext(nextContext);
          setStatus('success');
        }
      })
      .catch(error => {
        if (active) {
          setStatus('error');
          setErrorMessage(
            error instanceof Error ? error.message : 'Unknown IDP API error',
          );
        }
      });

    return () => {
      active = false;
    };
  }, [controlContextApi, projectRef, reloadKey]);

  return (
    <IdpChrome>
      <Header
        title={context?.project.title ?? projectRef}
        subtitle="Read-only Catalog Project control context from the IDP backend"
      />
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SectionCard
              title="Catalog Project"
              action={
                <Button component={Link} to={catalogRoute} variant="outlined">
                  Open Catalog entity
                </Button>
              }
            >
              <Box className={classes.cardList}>
                <Box>
                  <Typography variant="h6">{projectRef}</Typography>
                  <Typography className={classes.muted}>
                    Source: canonical Backstage Catalog `System` entity and IDP
                    backend control-context API. This route does not create or
                    merge a local fixture Project.
                  </Typography>
                </Box>
                <Box className={classes.metaGrid}>
                  <Chip size="small" className={classes.chip} label="system" />
                  <Chip
                    size="small"
                    className={classes.chip}
                    label={namespace}
                  />
                  <Chip size="small" className={classes.chip} label={name} />
                </Box>
              </Box>
            </SectionCard>
          </Grid>
          <Grid item xs={12}>
            <BackendControlContextPanel
              projectRef={projectRef}
              status={status}
              context={context}
              errorMessage={errorMessage}
              catalogRoute={catalogRoute}
              onRetry={() => setReloadKey(key => key + 1)}
            />
          </Grid>
        </Grid>
      </Content>
    </IdpChrome>
  );
};

export const CatalogProjectDetailPage = () => {
  const controlContextApi = useBackendControlContextApi();

  return <CatalogProjectDetailContent controlContextApi={controlContextApi} />;
};

export const EnvironmentListPage = ({
  projects,
  environments,
}: IdpDataProps) => (
  <IdpChrome>
    <Header
      title="IDP Environments"
      subtitle="dev / stg / prod states without DB connection yet"
    />
    <Content>
      <Hero
        title="Environments"
        subtitle="環境ごとに状態、リージョン、最終更新、デプロイ状態をカードで確認できます。"
      >
        <Button component={Link} to="/idp/projects" variant="contained">
          Pick a project
        </Button>
      </Hero>
      <Grid container spacing={3}>
        {environments.map(environment => (
          <Grid item xs={12} md={4} key={environment.id}>
            <EnvironmentCard environment={environment} projects={projects} />
          </Grid>
        ))}
      </Grid>
    </Content>
  </IdpChrome>
);

export const EnvironmentDetailPage = ({
  projects,
  environments,
  templates,
  operationLogs,
}: IdpDataProps) => {
  const classes = useStyles();
  const { environmentId } = useParams();
  const e = environments.find(x => x.id === environmentId);
  if (!e) return <EmptyState title="Environment not found" />;
  const project = projects.find(p => p.id === e.projectId);
  const planPreviewTemplate = project
    ? findPlanPreviewTemplate(project, templates)
    : undefined;
  const planPreviewAction =
    project && planPreviewTemplate ? (
      <Button
        component={Link}
        to={planPreviewPath({
          project,
          template: planPreviewTemplate,
          environment: e,
        })}
        variant="contained"
        color="primary"
        startIcon={<RocketLaunchIcon />}
      >
        Create plan preview
      </Button>
    ) : (
      <Button
        component={Link}
        to="/idp/templates"
        variant="contained"
        color="primary"
        startIcon={<RocketLaunchIcon />}
      >
        Open Templates
      </Button>
    );
  return (
    <IdpChrome>
      <Header title={e.name} subtitle="Operational environment detail" />
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Deployment"
              value={e.deploymentStatus}
              subtitle={e.lastDeployedAt ?? 'not deployed'}
              icon={<CloudQueueIcon />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Region"
              value={e.region ?? 'TBD'}
              subtitle={e.awsAccountId ?? 'account pending'}
              icon={<CloudDoneIcon />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Alert"
              value={e.alertStatus}
              subtitle={e.endpointUrl ?? 'endpoint pending'}
              icon={<HistoryIcon />}
            />
          </Grid>
          <Grid item xs={12}>
            <SectionCard title="Plan preview" action={planPreviewAction}>
              <Typography>
                Start a side-effect-free Plan preview from this Environment
                context.
              </Typography>
              <Typography className={classes.muted}>
                {project && planPreviewTemplate
                  ? `Preview target: ${planPreviewTemplate.name} for ${project.name} / ${e.name}.`
                  : 'Choose from available Templates before creating a Plan preview.'}
              </Typography>
              <Box mt={1} className={classes.metaGrid}>
                <Chip
                  size="small"
                  className={classes.chip}
                  label="No execute UI"
                />
                <Chip
                  size="small"
                  className={classes.chip}
                  label="No external side effects"
                />
              </Box>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionCard title="Project">
              <Link to={`/idp/projects/${e.projectId}`}>
                {projectName(projects, e.projectId)}
              </Link>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionCard title="Repository">
              {e.repository ? (
                <RepositoryLink url={e.repository} />
              ) : (
                'Repository pending'
              )}
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionCard title="Related Catalog assets">
              <CatalogAssetLinks refs={e.relatedCatalogEntityRefs} />
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionCard title="Recent operations">
              <OperationLogList
                operationLogs={operationLogs}
                projectId={e.projectId}
                environmentId={e.id}
              />
            </SectionCard>
          </Grid>
        </Grid>
      </Content>
    </IdpChrome>
  );
};

export const TemplateListPage = ({ templates }: IdpDataProps) => {
  const infrastructure = templates.filter(t => t.kind === 'infrastructure');
  const applications = templates.filter(t => t.kind !== 'infrastructure');
  return (
    <IdpChrome>
      <Header
        title="IDP Templates"
        subtitle="Separate metadata concept from Scaffolder Template"
      />
      <Content>
        <Hero
          title="Templates"
          subtitle="Scaffolder Template そのものではなく、IDP の作成メニューとして見せるアプリ/インフラテンプレートです。"
        >
          <Button component={Link} to="/idp" variant="contained">
            Back to dashboard
          </Button>
        </Hero>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SectionCard title="Infrastructure templates">
              <Grid container spacing={2}>
                {infrastructure.map(template => (
                  <Grid item xs={12} md={6} key={template.id}>
                    <TemplateCard template={template} />
                  </Grid>
                ))}
              </Grid>
            </SectionCard>
          </Grid>
          <Grid item xs={12}>
            <SectionCard title="Application and platform templates">
              <Grid container spacing={2}>
                {applications.map(template => (
                  <Grid item xs={12} md={4} key={template.id}>
                    <TemplateCard template={template} />
                  </Grid>
                ))}
              </Grid>
            </SectionCard>
          </Grid>
        </Grid>
      </Content>
    </IdpChrome>
  );
};

export const TemplateDetailPage = ({ templates }: IdpDataProps) => {
  const classes = useStyles();
  const { templateId } = useParams();
  const t = templates.find(x => x.id === templateId);
  if (!t) return <EmptyState title="Template not found" />;
  return (
    <IdpChrome>
      <Header
        title={t.name}
        subtitle="IDP-facing template metadata; Scaffolder is only referenced"
      />
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <TemplateCard template={t} />
          </Grid>
          <Grid item xs={12} md={5}>
            <SectionCard title="Scaffolder boundary">
              <Typography>Ref: {t.scaffolderTemplateRef}</Typography>
              <Typography>Repo: {t.repositoryUrl}</Typography>
              <Typography>
                This page does not execute Scaffolder yet.
              </Typography>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionCard title="Input parameters">
              {t.parameters.map(p => (
                <Box key={p.name} mb={1}>
                  <b>{p.label}</b> ({p.type}){' '}
                  {p.required ? 'required' : 'optional'} - {p.description}
                </Box>
              ))}
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <SectionCard title="Outputs">
              <Box className={classes.metaGrid}>
                {t.outputs.map(o => (
                  <Chip key={o} label={o} />
                ))}
              </Box>
            </SectionCard>
          </Grid>
        </Grid>
      </Content>
    </IdpChrome>
  );
};

export const TemplateRunContent = ({
  projects,
  environments,
  templates,
  controlContextApi,
}: IdpDataProps & { controlContextApi: ControlContextApi }) => {
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const classes = useStyles();
  const t = templates.find(x => x.id === templateId);
  const [step, setStep] = useState<'input' | 'confirm' | 'result'>('input');
  const [projectId, setProjectId] = useState(
    () => searchParams.get('projectId') ?? '',
  );
  const [environmentId, setEnvironmentId] = useState(
    () => searchParams.get('environmentId') ?? '',
  );
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<IdpTemplatePlanPreview>();
  const [previewStatus, setPreviewStatus] = useState<
    'idle' | 'creating' | 'error'
  >('idle');
  const [previewError, setPreviewError] = useState('');
  const [dryRun, setDryRun] = useState<IdpDryRunActionRun>();
  const [dryRunStatus, setDryRunStatus] = useState<
    'idle' | 'creating' | 'error'
  >('idle');
  const [dryRunError, setDryRunError] = useState('');
  const filteredEnvironments = useMemo(() => {
    const project = projects.find(candidate => candidate.id === projectId);
    return project ? relatedProjectEnvironments(project, environments) : [];
  }, [environments, projectId, projects]);
  useEffect(() => {
    if (!projects.length || !environments.length) {
      return;
    }

    const project = projects.find(candidate => candidate.id === projectId);
    if (!project) {
      if (projectId) {
        setProjectId('');
      }
      if (environmentId) {
        setEnvironmentId('');
      }
      return;
    }

    const projectEnvironments = relatedProjectEnvironments(
      project,
      environments,
    );
    if (
      environmentId &&
      !projectEnvironments.some(environment => environment.id === environmentId)
    ) {
      setEnvironmentId('');
    }
  }, [environmentId, environments, projectId, projects]);
  if (!t) return <EmptyState title="Template not found" />;
  const selectedProject = projects.find(project => project.id === projectId);
  const selectedEnvironment = filteredEnvironments.find(
    environment => environment.id === environmentId,
  );
  const selectedProjectRef = selectedProject
    ? projectControlRef(selectedProject)
    : '';
  const selectedEnvironmentRef =
    selectedEnvironment?.relatedCatalogEntityRefs[0] ??
    (selectedEnvironment ? `resource:default/${selectedEnvironment.id}` : '');
  const templateRef = t.scaffolderTemplateRef ?? `template:default/${t.id}`;

  const createPreview = async () => {
    if (!selectedProjectRef) {
      return;
    }

    setPreviewStatus('creating');
    setPreviewError('');
    try {
      const nextPreview = await controlContextApi.createTemplatePlanPreview({
        projectRef: selectedProjectRef,
        environmentRef: selectedEnvironmentRef || undefined,
        templateRef,
        parameters,
        idempotencyKey: [
          selectedProjectRef,
          selectedEnvironmentRef || 'no-environment',
          templateRef,
          Date.now(),
        ].join(':'),
      });
      setPreview(nextPreview);
      setDryRun(undefined);
      setDryRunStatus('idle');
      setDryRunError('');
      setStep('confirm');
    } catch (error) {
      setPreviewStatus('error');
      setPreviewError(
        error instanceof Error ? error.message : 'Unknown IDP API error',
      );
      return;
    }
    setPreviewStatus('idle');
  };
  const createDryRun = async () => {
    if (!selectedProjectRef || !preview) {
      return;
    }

    setDryRunStatus('creating');
    setDryRunError('');
    try {
      const nextDryRun = await controlContextApi.createDryRunActionRun({
        projectRef: selectedProjectRef,
        planRef: preview.plan.planRef,
        idempotencyKey: [
          selectedProjectRef,
          preview.plan.planRef,
          'dry-run',
          Date.now(),
        ].join(':'),
      });
      setDryRun(nextDryRun);
    } catch (error) {
      setDryRunStatus('error');
      setDryRunError(
        error instanceof Error ? error.message : 'Unknown IDP API error',
      );
      return;
    }
    setDryRunStatus('idle');
  };
  return (
    <IdpChrome>
      <Header
        title={`Plan ${t.name}`}
        subtitle="Side-effect-free Template Plan preview"
      />
      <Content>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TemplateCard template={t} />
          </Grid>
          <Grid item xs={12} md={8}>
            <SectionCard title={`Step: ${step}`}>
              {step === 'input' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Project"
                      value={projectId}
                      onChange={event => {
                        setProjectId(event.target.value);
                        setEnvironmentId('');
                      }}
                    >
                      {projects.map(project => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      select
                      fullWidth
                      label="Environment"
                      value={environmentId}
                      onChange={event => setEnvironmentId(event.target.value)}
                    >
                      {filteredEnvironments.map(environment => (
                        <MenuItem key={environment.id} value={environment.id}>
                          {environment.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box className={classes.miniCard}>
                      <Typography variant="subtitle2" className={classes.muted}>
                        Audit actor
                      </Typography>
                      <Typography>Backstage session identity</Typography>
                    </Box>
                  </Grid>
                  {t.parameters.map(parameter => (
                    <Grid item xs={12} md={6} key={parameter.name}>
                      <TextField
                        id={`template-parameter-${parameter.name}`}
                        fullWidth
                        required={parameter.required}
                        label={parameter.label}
                        helperText={parameter.description}
                        inputProps={{
                          'aria-label': parameter.label,
                        }}
                        value={
                          parameters[parameter.name] ??
                          String(parameter.defaultValue ?? '')
                        }
                        onChange={event =>
                          setParameters(current => ({
                            ...current,
                            [parameter.name]: event.target.value,
                          }))
                        }
                      />
                    </Grid>
                  ))}
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={!projectId}
                      onClick={createPreview}
                    >
                      {previewStatus === 'creating'
                        ? 'Creating plan preview...'
                        : 'Create plan preview'}
                    </Button>
                    {previewStatus === 'error' && (
                      <Box mt={2}>
                        <StatusChip status="error" />
                        <Typography className={classes.muted}>
                          {previewError}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              )}
              {step === 'confirm' && preview && (
                <Box>
                  <Typography>Template: {t.name}</Typography>
                  <Typography>
                    Project: {projectName(projects, projectId)}
                  </Typography>
                  <Typography>Project ref: {selectedProjectRef}</Typography>
                  <Typography>Template ref: {templateRef}</Typography>
                  <Typography>
                    Environment ref: {selectedEnvironmentRef || 'not selected'}
                  </Typography>
                  <Typography>
                    Audit actor: {preview.plan.actor.entityRef}
                  </Typography>
                  <Box mt={2} className={classes.metaGrid}>
                    <StatusChip status={preview.plan.status} />
                    <Chip
                      size="small"
                      className={classes.chip}
                      label={`Policy: ${
                        preview.plan.policyDecision?.result ?? 'unknown'
                      }`}
                    />
                    <Chip
                      size="small"
                      className={classes.chip}
                      label={`Required approval: ${preview.plan.requiredApproval}`}
                    />
                    <Chip
                      size="small"
                      className={classes.chip}
                      label={`Risk: ${
                        preview.plan.riskSummary?.level ?? 'unknown'
                      }`}
                    />
                  </Box>
                  <Box mt={2}>
                    <Typography variant="h6">Expected change</Typography>
                    <Typography>
                      {preview.plan.expectedChangeSummary}
                    </Typography>
                  </Box>
                  <Box mt={2}>
                    <Typography variant="h6">Risk summary</Typography>
                    <Typography>
                      {preview.plan.riskSummary?.summary ?? 'Not evaluated'}
                    </Typography>
                    {preview.plan.riskSummary?.factors.map(factor => (
                      <Typography key={factor} className={classes.muted}>
                        {factor}
                      </Typography>
                    ))}
                  </Box>
                  <Box mt={2}>
                    <Typography variant="h6">Policy decision</Typography>
                    {preview.plan.policyDecision?.reasons.map(reason => (
                      <Typography key={reason} className={classes.muted}>
                        {reason}
                      </Typography>
                    ))}
                    <Typography className={classes.muted}>
                      Plan ref {preview.plan.planRef} is recorded in backend
                      runtime context with OperationLog{' '}
                      {preview.operationLog.operationLogRef}.
                    </Typography>
                  </Box>
                  <Box mt={2} className={classes.miniCard}>
                    <Typography variant="h6">Record-only dry-run</Typography>
                    <Typography className={classes.muted}>
                      This records an ActionRun and OperationLog for review. It
                      does not start a Scaffolder task, create a Git pull
                      request, or start external execution.
                    </Typography>
                    <Box mt={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        disabled={dryRunStatus === 'creating'}
                        onClick={createDryRun}
                      >
                        {dryRunStatus === 'creating'
                          ? 'Recording dry-run...'
                          : 'Run dry-run'}
                      </Button>
                    </Box>
                    {dryRunStatus === 'error' && (
                      <Box mt={2}>
                        <StatusChip status="error" />
                        <Typography className={classes.muted}>
                          {dryRunError}
                        </Typography>
                      </Box>
                    )}
                    {dryRun && (
                      <Box mt={2}>
                        <Typography>
                          ActionRun ref: {dryRun.actionRun.actionRunRef}
                        </Typography>
                        <Typography>
                          Result: {dryRun.actionRun.resultSummary}
                        </Typography>
                        <Typography>
                          OperationLog ref:{' '}
                          {dryRun.operationLog.operationLogRef}
                        </Typography>
                        <Typography>
                          Scaffolder task started:{' '}
                          {String(
                            dryRun.sideEffectBoundary.scaffolderTaskStarted,
                          )}
                        </Typography>
                        <Typography>
                          Git pull request created:{' '}
                          {String(
                            dryRun.sideEffectBoundary.gitPullRequestCreated,
                          )}
                        </Typography>
                        <Typography>
                          External execution started:{' '}
                          {String(
                            dryRun.sideEffectBoundary.externalExecutionStarted,
                          )}
                        </Typography>
                        <Typography className={classes.muted}>
                          {dryRun.sideEffectBoundary.message}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Box mt={2}>
                    <Typography variant="h6">Input parameters</Typography>
                    <pre>{JSON.stringify(parameters, null, 2)}</pre>
                  </Box>
                  <Button onClick={() => setStep('input')}>Back</Button>
                  <Button
                    component={Link}
                    to={`/idp/projects/${projectId}`}
                    color="primary"
                  >
                    Open Project control context
                  </Button>
                </Box>
              )}
              {step === 'result' && preview && (
                <Box>
                  <Typography>Plan ref: {preview.plan.planRef}</Typography>
                  <Button component={Link} to="/idp/templates" color="primary">
                    Back to templates
                  </Button>
                </Box>
              )}
            </SectionCard>
          </Grid>
        </Grid>
      </Content>
    </IdpChrome>
  );
};

export const TemplateRunPage = (props: IdpDataProps) => {
  const controlContextApi = useBackendControlContextApi();

  return (
    <TemplateRunContent {...props} controlContextApi={controlContextApi} />
  );
};

export const IdpRoot = () => {
  const data = useIdpData();
  return (
    <Page themeId="tool">
      <Routes>
        <Route index element={<IdpDashboardPage {...data} />} />
        <Route path="projects" element={<ProjectListPage {...data} />} />
        <Route
          path="projects/:projectId"
          element={<ProjectDetailPage {...data} />}
        />
        <Route
          path="environments"
          element={<EnvironmentListPage {...data} />}
        />
        <Route
          path="environments/:environmentId"
          element={<EnvironmentDetailPage {...data} />}
        />
        <Route path="templates" element={<TemplateListPage {...data} />} />
        <Route
          path="templates/:templateId"
          element={<TemplateDetailPage {...data} />}
        />
        <Route
          path="templates/:templateId/run"
          element={<TemplateRunPage {...data} />}
        />
      </Routes>
    </Page>
  );
};

export const IdpProjectDetailRoot = () => {
  const data = useIdpData();

  return (
    <Page themeId="tool">
      <ProjectDetailPage {...data} />
    </Page>
  );
};

export const CatalogProjectDetailRoot = () => (
  <Page themeId="tool">
    <CatalogProjectDetailPage />
  </Page>
);
