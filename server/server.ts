import koa from "koa";
import http from 'http';
import Router from '@koa/router';
import { auth, getUserInfo } from './google_auth';
import dotenv from "dotenv";
import { oauth2 } from "googleapis/build/src/apis/oauth2";

dotenv.config()
const server = new koa();
const router = new Router();

router.get('/test_endpoint', async (ctx) => {
  ctx.status = 200;
  ctx.body = "Hello world";
});

router.get('/google', async(ctx) => {
  ctx.status = 200;
  const url = auth()
  ctx.redirect(url);
});

router.get('/google/auth/redirect', async(ctx) => {
  console.log(ctx.params.code);
  if (ctx.params.code) {
    console.log(getUserInfo(ctx.params.code));
  }
});

server.use(router.routes());

(async () => {
  const httpServer = http.createServer(server.callback());
  const port = 3000; //TODO: make env var 
  httpServer.listen(port, () => {
    console.log(`Server is running ✨ ${port}`);
  });
})();
