import koa from "koa";
import http from 'http';
import dotenv from "dotenv";
dotenv.config();
import Router from '@koa/router';
import routes from "./Routes";
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import { errorHandler } from './middleware';

const server = new koa();
const router = new Router();
router.use('/api', routes);

server.use(errorHandler);
server.use(cors({
  origin: (ctx) => {
    const origin = ctx.request.headers.origin;
    if (!origin) return '*';
    const allowed = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(o => o.trim());
    return allowed.includes(origin) ? origin : '';
  },
}));
server.use(bodyParser());
server.use(router.routes());

(async () => {
  const httpServer = http.createServer(server.callback());
  const port = 3000; //TODO: make env var 
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Server is running ✨ ${port}`);
  });
})();
