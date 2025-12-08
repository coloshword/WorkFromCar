import Router from '@koa/router';
import { 
    testRoute,
    googleAuthRedirect,
    googleAuthLogin
 } from './AuthRoutes';

const router = new Router();

router.get('/hello', testRoute);
router.get('/google', googleAuthRedirect);
router.get('/google/redirect', googleAuthLogin)

export default router.routes();