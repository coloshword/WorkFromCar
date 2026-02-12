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

const googleAuthGmailSchema = z.object({
  code: z.string(),
})

export const testRoute = async (ctx: Context) => {
  ctx.status = 200;
  ctx.body = "test route"
};

export const authOnlyRoute = async (ctx: Context) => {
  ctx.status = 200;
  const { accountId, email } = ctx.state.auth;
  ctx.body = `Hello ${email}, accountId: ${accountId}`;
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
}

export const googleLoginAndGmail = async (ctx: Context): Promise<void> => {
  const { code } = googleAuthGmailSchema.parse(ctx.request.body);

}