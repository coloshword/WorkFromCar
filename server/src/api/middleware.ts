import { Context, Next } from 'koa';
import * as z from "zod";
import jwt from "jsonwebtoken";

const BearerAuthSchema = z.object({
  authorization: z.string(),
})
export async function mobileAuth(ctx: Context, next: Next) {
  let authorization: string;
  try {
    ({ authorization } = BearerAuthSchema.parse(ctx.header));
  } catch {
    ctx.throw(401, "You must be authorized to access this.")
  }
}