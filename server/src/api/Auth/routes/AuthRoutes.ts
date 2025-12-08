import * as z from "zod";
import { Context } from 'koa';
import { 
    auth,
    getUserInfo
 } from "./utils";

const authRedirectSchema = z.object({
  code: z.string(),
});

export const testRoute = async (ctx: Context) => {
    ctx.status = 200;
    ctx.body = "Hello world"
}

export const googleAuthRedirect = async (cxt: Context) => {
    cxt.status = 200;
    const url = auth();
    cxt.redirect(url);
}

export const googleAuthLogin = async (ctx: Context) => {
    const { code } = authRedirectSchema.parse(ctx.query);
    console.log(await getUserInfo(code));
    ctx.body = "Hello world";
}