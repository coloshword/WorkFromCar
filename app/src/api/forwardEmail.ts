import { GMAIL_BASE } from "./summarizeEmails";

export async function forwardEmail({
  messageId,
  to,
  accessToken,
}: {
  messageId: string;
  to: string;
  accessToken: string;
}) {
  const msgRes = await fetch(
    `${GMAIL_BASE}/messages/${messageId}?format=raw`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!msgRes.ok) throw new Error(`Gmail get failed: ${msgRes.status}`);
  const msg = await msgRes.json();

  const rawB64Url: string = msg.raw;
  const rawStdB64 = rawB64Url.replace(/-/g, '+').replace(/_/g, '/');
  const rawEmail = atob(rawStdB64);

  const headerBodySplit = rawEmail.indexOf('\r\n\r\n');
  if (headerBodySplit === -1) throw new Error('Malformed email: no header/body separator');

  const headerSection = rawEmail.slice(0, headerBodySplit);
  const bodySection = rawEmail.slice(headerBodySplit);

  const headerLines = headerSection.split('\r\n');
  const newHeaders: string[] = [];
  let subjectFound = false;

  for (let i = 0; i < headerLines.length; i++) {
    const line = headerLines[i];
    const isIndented = /^\s/.test(line);

    if (isIndented) {
      // Continuation of previous header -- keep it only if previous header was kept
      if (newHeaders.length > 0) {
        newHeaders.push(line);
      }
      continue;
    }

    const lowerLine = line.toLowerCase();

    if (lowerLine.startsWith('from:')) {
      // Skip From: -- Gmail sets it from the authenticated account
      // Also skip any continuation lines
      while (i + 1 < headerLines.length && /^\s/.test(headerLines[i + 1])) {
        i++;
      }
      continue;
    }

    if (lowerLine.startsWith('to:') || lowerLine.startsWith('cc:') || lowerLine.startsWith('bcc:')) {
      // Skip original recipients
      while (i + 1 < headerLines.length && /^\s/.test(headerLines[i + 1])) {
        i++;
      }
      continue;
    }

    if (lowerLine.startsWith('subject:')) {
      const originalSubject = line.slice('Subject:'.length).trim();
      const fwdSubject = originalSubject.startsWith('Fwd:')
        ? originalSubject
        : `Fwd: ${originalSubject}`;
      newHeaders.push(`Subject: ${fwdSubject}`);
      subjectFound = true;
      continue;
    }

    newHeaders.push(line);
  }

  newHeaders.unshift(`To: ${to}`);
  if (!subjectFound) {
    newHeaders.push('Subject: Fwd: (no subject)');
  }

  const newRawEmail = newHeaders.join('\r\n') + bodySection;
  const newB64 = btoa(newRawEmail);
  const newB64Url = newB64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

  const res = await fetch(`${GMAIL_BASE}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: newB64Url }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gmail forward failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return {
    success: true,
    messageId: data.id,
    threadId: data.threadId,
    forwardedTo: to,
  };
}
