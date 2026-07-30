import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import express from 'express';
import Router from 'express-promise-router';
import { z } from 'zod/v3';

import { ControlContextService } from './controlContextService';

export async function createRouter(options: {
  httpAuth: HttpAuthService;
  controlContext: ControlContextService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const projectContextQuery = z.object({
    projectRef: z.string().min(1),
  });

  router.get('/control-context/project', async (req, res) => {
    const parsed = projectContextQuery.safeParse(req.query);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const credentials = await options.httpAuth.credentials(req, {
      allow: ['user', 'service'],
    });
    const context = await options.controlContext.getProjectControlContext({
      projectRef: parsed.data.projectRef,
      credentials,
    });

    res.json(context);
  });

  return router;
}
