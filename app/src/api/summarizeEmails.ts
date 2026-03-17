const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export interface EmailSummary {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
}

export async function summarizeEmails(
  token: string,
  query: string | null,
  maxResults: number | null,
): Promise<EmailSummary[]> {
  const q = query ?? 'is:unread';
  if (maxResults && maxResults > 10) {
    throw new Error('Max results must be less than or equal to 10');
  }
  const limit = maxResults ?? 10;

  const listUrl = new URL(`${GMAIL_BASE}/messages`);
  listUrl.searchParams.set('maxResults', String(limit));
  if (q) listUrl.searchParams.set('q', q);

  const listRes = await fetch(listUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!listRes.ok) throw new Error(`Gmail list failed: ${listRes.status}`);

  const listData = await listRes.json();
  const messages: { id: string }[] = listData.messages ?? [];

  const emails = await Promise.all(
    messages.map(async ({ id }) => {
      const msgRes = await fetch(
        `${GMAIL_BASE}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!msgRes.ok) throw new Error(`Gmail get failed: ${msgRes.status}`);
      const msg = await msgRes.json();

      const headers: { name: string; value: string }[] =
        msg.payload?.headers ?? [];
      const get = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
          ?.value ?? '';

      return {
        id,
        from: get('From'),
        subject: get('Subject'),
        snippet: msg.snippet ?? '',
        date: get('Date'),
      };
    }),
  );

  return emails;
}
