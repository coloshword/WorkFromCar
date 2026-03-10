import Router from '@koa/router';
import { 
  planRoute,
  executePermissionRoute,
  summarizeRoute
} from './AgentRoutes';
import { mobileAuth } from '../../middleware';

const router = new Router();

router.post('/plan', mobileAuth, planRoute);
router.post('/executePermission', mobileAuth, executePermissionRoute);
router.post('/summarize', mobileAuth, summarizeRoute);

export default router;
