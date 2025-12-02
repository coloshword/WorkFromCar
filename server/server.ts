import koa from "koa";
import http from 'http';
import Router from '@koa/router';

const server = new koa();
const router = new Router();

router.get('/hello_world', async (ctx) => {
  ctx.status = 200;
  ctx.body = "Hello world";
});

server.use(router.routes());

(async () => {
  const httpServer = http.createServer(server.callback());
  const port = 3000; //TODO: make env var 
  httpServer.listen(port, () => {
    console.log(`Server is running ✨`);
  })
})();
