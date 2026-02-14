import { google } from 'googleapis';
import * as z from "zod";
import jwt from "jsonwebtoken";
import { AuthAccount, GoogleAuthPayload } from './types';
import { OAuth2Client } from "google-auth-library";

const googleAuthClientId = process.env.GOOGLE_AUTH_CLIENT_ID;
const client = new OAuth2Client(process.env.GOOGLE_AUTH_CLIENT_ID_APP);

const googleAuthPayloadSchema = z.object({
  sub: z.string().min(1),
  email: z.string().min(1)
})

// getUserInfo with google idToken
export async function getUserInfo(idToken: string): Promise<GoogleAuthPayload> {
  if (!googleAuthClientId) throw new Error("Env variable GOOGLE_AUTH_CLIENT_ID_APP is not defined");
  const ticket = await client.verifyIdToken({
    idToken,
    audience: googleAuthClientId,
  });
  const googleAuthPayload: GoogleAuthPayload = googleAuthPayloadSchema.parse(ticket.getPayload());
  return googleAuthPayload;
}

export function getJWTToken(account: AuthAccount): string {
  if(!account.accountId || !account.email) throw new Error("Missing accountId or email");
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error("JWT secret does not exist in .env")
  const token = jwt.sign(
    {
      accountId: account.accountId,
      email: account.email
    },
    jwtSecret
  ) 
  return token;
}
