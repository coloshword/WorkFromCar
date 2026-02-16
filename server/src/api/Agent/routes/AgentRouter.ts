import Router from '@koa/router';
import { 
  planRoute,
  executePermissionRoute
} from './AgentRoutes';
import { mobileAuth } from '../../middleware';

const router = new Router();

router.post('/plan', mobileAuth, planRoute);
router.post('/executePermission', mobileAuth, executePermissionRoute);

export default router;
