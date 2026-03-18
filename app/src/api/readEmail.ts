import { GMAIL_BASE } from "./summarizeEmails";

export interface EmailFull {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  body: string;
}

export const MAX_EMAIL_BODY_LENGTH = 750;

function stripLinks(text: string): string {
  return text.replace(/https?:\/\/([^/\s]+)[^\s]*/g, (_, domain) => `[link: ${domain}]`);
}

function findPlainTextBody(payload: any): string | null {
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return payload.body.data;
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const found = findPlainTextBody(part);
      if (found) return found;
    }
  }
  return null;
}

export async function readEmail({
  token,
  emailId,
}: {
  token: string;
  emailId: string;
}): Promise<EmailFull> {
  console.log('reading email', emailId);
  // hit the api 
  const getEmailUrl = new URL(`${GMAIL_BASE}/messages/${emailId}?format=full`);
  const getEmailRes = await fetch(getEmailUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!getEmailRes.ok) throw new Error(`Gmail get email failed: ${getEmailRes.status}`);

  const getEmailData = await getEmailRes.json();

  const headers: { name: string; value: string }[] = getEmailData.payload?.headers ?? [];
  const get = (name: string) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';

  const bodyData = findPlainTextBody(getEmailData.payload);
  let body = '';
  if (bodyData) {
    const rawBody = decodeURIComponent(
      atob(bodyData.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    body = stripLinks(rawBody).trim().slice(0, MAX_EMAIL_BODY_LENGTH);
  }

  return {
    id: emailId,
    threadId: getEmailData.threadId ?? '',
    from: get('From'),
    subject: get('Subject'),
    date: get('Date'),
    body,
  }
}

// (async () => {
//   const accessToken = 'ya29.a0ATkoCc4WbACs72XRacWiO_7eGhAIes-_pXkGDjsswyjISnscSbbybkjvdg3V6DEV_pY7eel73O-g51e1QuIL_LpsYTrfFnru_gUoj9KMbbrZ53oYaUrGSPIzFm_fffAzTHEUPe8Uj61mdlezYYYkGnQIo2AMUwt3J11bSG2z039So0CuOrh7O64AQ-4vhnN3QJ8V_QoaCgYKAd8SARYSFQHGX2MiBDWxyHzv4fm941whZgXlbw0206'
//   const messageId = '19cf83feb5f7c6bd';

//   const email = await readEmail({
//     token: accessToken,
//     emailId: messageId,
//   });
//   console.log(email);
// })();
