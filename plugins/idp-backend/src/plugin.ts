import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';

import { ControlContextService } from './controlContextService';
import { createRouter } from './router';
import { createRuntimeAuditStore } from './runtimeStore';

export const idpPlugin = createBackendPlugin({
  pluginId: 'idp',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogServiceRef,
        database: coreServices.database,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
      },
      async init({ catalog, database, httpAuth, httpRouter }) {
        const runtimeStore = await createRuntimeAuditStore(database);
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
