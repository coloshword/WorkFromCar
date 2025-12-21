import { google } from 'googleapis';
import * as z from "zod";
import jwt from "jsonwebtoken";
import { AuthAccount } from './types';

const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_AUTH_CLIENT_ID,
	process.env.CLIENT_SECRET,
	process.env.REDIRECT_URL
);

const googleUserInfoSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1)
})

export function auth() {
	const scopes = [
		'https://www.googleapis.com/auth/calendar',
		'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'openid'
	];

	const url = oauth2Client.generateAuthUrl({
		access_type: 'online',
		scope: scopes
	});

	return url;
};

export async function getUserInfo(authorizationCode: string) {
	const {tokens} = await oauth2Client.getToken(authorizationCode);
	oauth2Client.setCredentials(tokens);

	const oauth2 = google.oauth2({
		auth: oauth2Client,
		version: "v2",
	});

	const { data } = await oauth2.userinfo.get({});
  return googleUserInfoSchema.parse(data);
};

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
