import koa from "koa";
import http from 'http';
import dotenv from "dotenv";
dotenv.config();
import Router from '@koa/router';
import routes from "./Routes";
import * as z from "zod";

const server = new koa();
const router = new Router();
router.use('/api', routes);

server.use(router.routes());

(async () => {
  const httpServer = http.createServer(server.callback());
  const port = 3000; //TODO: make env var 
  httpServer.listen(port, () => {
    console.log(`Server is running ✨ ${port}`);
  });
})();
