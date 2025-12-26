import Router from '@koa/router';
import { 
    testRoute,
    googleAuthLogin
 } from './AuthRoutes';
import {
  mobileAuth
} from '../../middleware';

const router = new Router();

router.post('/google', googleAuthLogin)
router.get('/hello', mobileAuth, testRoute);

export default router;