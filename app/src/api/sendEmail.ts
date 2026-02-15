import { encode as btoa } from "base-64"; // yarn add base-64

function toBase64Url(b64: string) {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function buildRawEmail({
  to,
  subject,
  body,
  from, // optional; usually omit and let Gmail use the account
}: {
  to: string;
  subject: string;
  body: string;
  from?: string;
}) {
  // Basic headers + body. Use \r\n per RFC.
  const lines = [
    from ? `From: ${from}` : null,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    body,
  ].filter(Boolean);

  return lines.join("\r\n");
}

export async function sendEmail({
  to,
  subject,
  body,
  accessToken
}: {
  to: string;
  subject: string;
  body: string;
  accessToken: string;
}) {

  const raw = buildRawEmail({ to, subject, body });

  // Gmail expects base64url of the raw message
  const rawB64Url = toBase64Url(btoa(unescape(encodeURIComponent(raw))));

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawB64Url }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gmail send failed: ${res.status} ${errText}`);
  }

  return await res.json(); // contains id, threadId, etc.
}
