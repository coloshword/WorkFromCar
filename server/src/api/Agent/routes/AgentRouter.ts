import Router from '@koa/router';
import { 
  planRoute
} from './AgentRoutes';
import { mobileAuth } from '../../middleware';

const router = new Router();

router.post('/plan', mobileAuth, planRoute);

export default router;
