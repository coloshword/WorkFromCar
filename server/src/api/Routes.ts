import Router from '@koa/router';
import auth from './Auth/routes/AuthRouter';

const router = new Router();

router.use("/auth", auth);

export default router.routes();