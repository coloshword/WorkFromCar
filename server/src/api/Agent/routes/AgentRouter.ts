import Router from '@koa/router';
import { 
  planRoute
} from './AgentRoutes';

const router = new Router();

router.post('/plan', planRoute);

export default router;
