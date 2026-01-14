import { Context } from 'koa';
import * as z from "zod";
import { LMState } from "Types/Agent";

const planRouteSchema = z.object({
  payload: z.any(),
});

export const planRoute = async (ctx: Context) => {
  const { payload } = planRouteSchema.parse(ctx.request.body);
  ctx.status = 200;
};
