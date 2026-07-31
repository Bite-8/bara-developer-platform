import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import { Content, Header, Page } from '@backstage/core-components';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
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
import GitHubIcon from '@material-ui/icons/GitHub';
import HistoryIcon from '@material-ui/icons/History';
import LayersIcon from '@material-ui/icons/Layers';
import RocketLaunchIcon from '@material-ui/icons/FlightTakeoff';
import { BackendIdpApi } from '../api/backendIdpApi';
import { IdpApi } from '../api/idpApi';
import { idpApi } from '../api/localIdpApi';
import {
  IdpControlOperationLog,
  IdpEnvironment,
  IdpOperationLog,
  IdpProjectControlContext,
  IdpProject,
  IdpTemplate,
  IdpTemplateExecution,
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
const latest = <T extends { updatedAt?: string; createdAt: string }>(
  items: T[],
) =>
  [...items].sort((a, b) =>
    (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt),
  );

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

type ControlContextApi = Pick<IdpApi, 'getProjectControlContext'>;

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

export const ProjectControlContextSection = ({
  projectRef,
  controlContextApi,
}: {
  projectRef: string;
  controlContextApi: ControlContextApi;
}) => {
  const classes = useStyles();
  const [context, setContext] = useState<IdpProjectControlContext>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = useState('');

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
  }, [controlContextApi, projectRef]);

  return (
    <SectionCard title="Backend control context">
      {status === 'loading' && (
        <Typography className={classes.muted}>
          Loading backend control context...
        </Typography>
      )}
      {status === 'error' && (
        <Box>
          <StatusChip status="error" />
          <Typography style={{ marginTop: 12 }}>
            Backend control context could not be loaded.
          </Typography>
          <Typography className={classes.muted}>{errorMessage}</Typography>
        </Box>
      )}
      {status === 'success' && context && (
        <Box className={classes.cardList}>
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
                {context.desiredState.idpBackendStoresAuthoritativeDesiredState
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
              These values summarize whether future actions are expected to need
              approval. They are not permission enforcement or completed
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
        </Box>
      )}
    </SectionCard>
  );
};

export const IdpDashboardPage = ({
  projects,
  environments,
  templates,
  operationLogs,
}: IdpDataProps) => {
  const classes = useStyles();
  const availableTemplates = templates.filter(t => t.status === 'available');
  const repos = projects.reduce(
    (count, project) => count + project.repositories.length,
    0,
  );
  return (
    <IdpChrome>
      <Header
        title="Bara IDP"
        subtitle="Project, environment, and template operations in one calm workspace"
      />
      <Content>
        <Hero
          title="IDP Dashboard"
          subtitle="Catalog への入口だけではなく、プロジェクト・環境・作成テンプレート・GitHub 連携の状態を見ながら作成操作へ進める画面です。"
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
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Projects"
              value={projects.length}
              subtitle="IDP owned operating units"
              icon={<AppsIcon />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Environments"
              value={environments.length}
              subtitle="dev / stg / prod state"
              icon={<CloudDoneIcon />}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <SummaryCard
              title="Templates"
              value={availableTemplates.length}
              subtitle="available creation flows"
              icon={<LayersIcon />}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <SectionCard
              title="Project portfolio"
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
            <SectionCard title="GitHub integration">
              <Box className={classes.iconBubble}>
                <GitHubIcon />
              </Box>
              <Typography variant="h5" style={{ marginTop: 16 }}>
                Connected
              </Typography>
              <Typography className={classes.muted}>
                {repos} repositories tracked from mock data. Last sync:
                2026-06-13 09:30 UTC.
              </Typography>
              <Box mt={2} className={classes.metaGrid}>
                <StatusChip status="repository read" />
                <StatusChip status="webhooks ready" />
              </Box>
            </SectionCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <SectionCard
              title="Environment highlights"
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
              title="Creation templates"
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
            <SectionCard title="Recent operations">
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
          <Grid item xs={12}>
            <ProjectControlContextSection
              projectRef={projectControlRef(p)}
              controlContextApi={controlContextApi}
            />
          </Grid>
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
  operationLogs,
}: IdpDataProps) => {
  const { environmentId } = useParams();
  const e = environments.find(x => x.id === environmentId);
  if (!e) return <EmptyState title="Environment not found" />;
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

export const TemplateRunPage = ({
  projects,
  environments,
  templates,
  refresh,
}: IdpDataProps) => {
  const { templateId } = useParams();
  const t = templates.find(x => x.id === templateId);
  const [step, setStep] = useState<'input' | 'confirm' | 'result'>('input');
  const [projectId, setProjectId] = useState('');
  const [environmentId, setEnvironmentId] = useState('');
  const [requestedBy, setRequestedBy] = useState(
    'user:default/local-developer',
  );
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [execution, setExecution] = useState<IdpTemplateExecution>();
  const filteredEnvironments = useMemo(
    () =>
      projectId
        ? environments.filter(
            environment => environment.projectId === projectId,
          )
        : environments,
    [environments, projectId],
  );
  if (!t) return <EmptyState title="Template not found" />;
  const execute = async () => {
    const nextExecution = await idpApi.executeTemplate({
      templateId: t.id,
      projectId: projectId || undefined,
      environmentId: environmentId || undefined,
      parameters,
      requestedBy,
    });
    setExecution(nextExecution);
    await refresh();
    setStep('result');
  };
  return (
    <IdpChrome>
      <Header title={`Run ${t.name}`} subtitle="Mock template execution flow" />
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
                    <TextField
                      fullWidth
                      required
                      label="Requested by"
                      value={requestedBy}
                      onChange={event => setRequestedBy(event.target.value)}
                    />
                  </Grid>
                  {t.parameters.map(parameter => (
                    <Grid item xs={12} md={6} key={parameter.name}>
                      <TextField
                        fullWidth
                        required={parameter.required}
                        label={parameter.label}
                        helperText={parameter.description}
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
                      disabled={!projectId || !requestedBy}
                      onClick={() => setStep('confirm')}
                    >
                      Confirm inputs
                    </Button>
                  </Grid>
                </Grid>
              )}
              {step === 'confirm' && (
                <Box>
                  <Typography>Template: {t.name}</Typography>
                  <Typography>
                    Project: {projectName(projects, projectId)}
                  </Typography>
                  <Typography>
                    Environment: {environmentId || 'not selected'}
                  </Typography>
                  <Typography>Requested by: {requestedBy}</Typography>
                  <pre>{JSON.stringify(parameters, null, 2)}</pre>
                  <Button onClick={() => setStep('input')}>Back</Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CloudQueueIcon />}
                    onClick={execute}
                  >
                    Create TemplateExecution
                  </Button>
                </Box>
              )}
              {step === 'result' && execution && (
                <Box>
                  <Typography>Execution ID: {execution.id}</Typography>
                  <Typography>
                    Status: <StatusChip status={execution.status} />
                  </Typography>
                  <Typography>Created: {execution.createdAt}</Typography>
                  <pre>{JSON.stringify(execution.parameters, null, 2)}</pre>
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
