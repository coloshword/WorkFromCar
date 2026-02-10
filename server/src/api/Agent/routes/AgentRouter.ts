import Router from '@koa/router';
import { 
  planRoute,
  executeRoute
} from './AgentRoutes';
import { mobileAuth } from '../../middleware';

const router = new Router();

router.post('/plan', mobileAuth, planRoute);
router.post('/execute', mobileAuth, executeRoute);

export default router;
