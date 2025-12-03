import koa from "koa";
import http from 'http';
import Router from '@koa/router';
import { auth } from 'google_auth.ts';

const server = new koa();
const router = new Router();

router.get('/test_endpoint', async (ctx) => {
  ctx.status = 200;
  ctx.body = "Hello world";
});

router.get('/login_with_google', async(ctx) => {
  ctx.status = 200;
  ctx.redirect("https://google.com");
});

server.use(router.routes());

(async () => {
  const httpServer = http.createServer(server.callback());
  const port = 3000; //TODO: make env var 
  httpServer.listen(port, () => {
    console.log(`Server is running ✨ ${port}`);
  });
})();
