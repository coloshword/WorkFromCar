import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
	process.env.GOOGLE_AUTH_CLIENT_ID,
	process.env.CLIENT_SECRET,
	process.env.REDIRECT_URL
);

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

	const { data: userInfo } = await oauth2.userinfo.get({});
	return userInfo;
};