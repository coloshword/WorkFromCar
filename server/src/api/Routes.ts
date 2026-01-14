import Router from '@koa/router';
import auth from './Auth/routes/AuthRouter';
import agent from './Agent/routes/AgentRouter';

const router = new Router();

router.use("/auth", auth.routes(), auth.allowedMethods());
router.use("/agent", agent.routes(), agent.allowedMethods());

export default router.routes();