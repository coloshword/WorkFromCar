import { Context, Next } from 'koa';
import * as z from "zod";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./Utils";

const BearerAuthSchema = z.object({
  authorization: z.string(),
});

const AuthSchema = z.object({
  accountId: z.number(),
  email: z.string(),
});

export async function mobileAuth(ctx: Context, next: Next) {
  let authorization: string;
  if(!JWT_SECRET) throw new Error("JWT secret must be provided");
  try {
    ({ authorization } = BearerAuthSchema.parse(ctx.header));
  } catch {
    ctx.throw(401, "You must be authorized to access this.")
  };
  const token = authorization.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const authObj = AuthSchema.parse(decoded);
    ctx.state.auth = authObj;
  } catch (err) {
    ctx.throw(401, "Invalid token");
  }
  await next();
}
