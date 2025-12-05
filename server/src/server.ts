import koa from "koa";
import http from 'http';
import Router from '@koa/router';
import * as z from "zod";
import dotenv from "dotenv";
dotenv.config();

import { auth, getUserInfo } from './Auth/utils';

const server = new koa();
const router = new Router();

const authRedirectSchema = z.object({
  code: z.string(),
});

router.get('/test_endpoint', async (ctx) => {
  ctx.status = 200;
  ctx.body = "Hello world";
});

router.get('/google', async(ctx) => {
  ctx.status = 200;
  const url = auth()
  ctx.redirect(url);
});

router.get('/google/auth/redirect', async (ctx) => {
  const { code } = authRedirectSchema.parse(ctx.query);
  console.log(await getUserInfo(code));
  ctx.body = "Hello world";
});

server.use(router.routes());

(async () => {
  const httpServer = http.createServer(server.callback());
  const port = 3000; //TODO: make env var 
  httpServer.listen(port, () => {
    console.log(`Server is running ✨ ${port}`);
  });
})();
