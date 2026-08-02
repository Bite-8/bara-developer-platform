import {
  createFrontendModule,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { Navigate } from 'react-router-dom';

const baraHomePage = PageBlueprint.make({
  name: 'bara-home',
  params: {
    path: '/',
    loader: async () => <Navigate to="/idp" replace />,
  },
});

export const baraHomeModule = createFrontendModule({
  pluginId: 'app',
  extensions: [baraHomePage],
});
