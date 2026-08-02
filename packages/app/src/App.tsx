import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { baraHomeModule } from './modules/home';
import { navModule } from './modules/nav';
import { idpPlugin } from '@internal/plugin-idp';

export default createApp({
  features: [catalogPlugin, idpPlugin, baraHomeModule, navModule],
});
