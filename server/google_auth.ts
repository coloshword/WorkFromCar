import { google } from 'googleapis';


const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_AUTH_CLIENT_ID,
	process.env.CLIENT_SECRET,
	process.env.REDIRECT_URL
);

export function auth() {
	const scopes = [
		'https://www.googleapis.com/auth/calendar'
	];

	const url = oauth2Client.generateAuthUrl({
		access_type: 'online',
		scope: scopes
	})

	return url;
}

export async function getUserInfo(authorizationCode: string) {
	const {tokens} = await oauth2Client.getToken(authorizationCode);
	oauth2Client.setCredentials(tokens);
}