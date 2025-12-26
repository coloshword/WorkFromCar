import Router from '@koa/router';
import { 
    testRoute,
    googleAuthLogin,
    authOnlyRoute
 } from './AuthRoutes';
import {
  mobileAuth
} from '../../middleware';

const router = new Router();

router.post('/google', googleAuthLogin)
router.get('/authOnly', mobileAuth, authOnlyRoute);

export default router;