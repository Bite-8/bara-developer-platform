import {
  createFrontendPlugin,
  createRouteRef,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import DashboardIcon from '@material-ui/icons/Dashboard';

export const idpRouteRef = createRouteRef();

export const idpPlugin = createFrontendPlugin({
  pluginId: 'idp',
  routes: { root: idpRouteRef },
  extensions: [
    PageBlueprint.make({
      params: {
        path: '/idp/*',
        title: 'IDP',
        icon: <DashboardIcon />,
        routeRef: idpRouteRef,
        loader: async () =>
          import('./components/IdpPages').then(m => <m.IdpRoot />),
      },
    }),
  ],
});
