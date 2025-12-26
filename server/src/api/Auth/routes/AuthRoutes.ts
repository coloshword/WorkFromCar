import * as z from "zod";
import { Context } from 'koa';
import { 
  getUserInfo,
  getJWTToken
 } from "../utils";
import infra from "../..";

const authRedirectSchema = z.object({
  idToken: z.string(),
});

export const testRoute = async (ctx: Context) => {
  ctx.status = 200;
  ctx.body = "test route"
}

export const googleAuthLogin = async (ctx: Context): Promise<void> => {
  const { idToken } = authRedirectSchema.parse(ctx.request.body);
  const userInfo = await getUserInfo(idToken);
  const account = await infra.db.account.upsertUserWithGoogle(userInfo.email, userInfo.sub);
  if (!account) ctx.throw(500, "Failed to create account");
  const jwt = getJWTToken(account);
  ctx.status = 200;
  ctx.body = {
    token: jwt,
    email: account.email,
  };
  console.log("route fully returns");
}