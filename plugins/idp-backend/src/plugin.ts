import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';

import { ControlContextService } from './controlContextService';
import { createRouter } from './router';
import { InMemoryRuntimeAuditStore } from './runtimeStore';

export const idpPlugin = createBackendPlugin({
  pluginId: 'idp',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogServiceRef,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
      },
      async init({ catalog, httpAuth, httpRouter }) {
        const runtimeStore = new InMemoryRuntimeAuditStore();
        const controlContext = new ControlContextService(catalog, runtimeStore);

        httpRouter.use(
          await createRouter({
            httpAuth,
            controlContext,
          }),
        );
      },
    });
  },
});
