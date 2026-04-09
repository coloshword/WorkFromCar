import { GCAL_EVENTS_BASE } from './gcalGetEvents';

export async function deleteEvent({
  accessToken,
  eventId,
}: {
  accessToken: string;
  eventId: string;
}) {
  const eventUrl = `${GCAL_EVENTS_BASE}/${encodeURIComponent(eventId)}`;
  const url = `${eventUrl}?sendUpdates=all`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch (error: any) {
    console.error('[gcal.deleteEvent] network error', {
      message: error?.message,
      eventId,
    });
    throw error;
  }

  if (!res.ok) {
    const text = await res.text();
    console.error('[gcal.deleteEvent] error response', {
      status: res.status,
      statusText: res.statusText,
      body: text,
      eventId,
    });
    throw new Error(`Failed to delete event: ${res.status} ${text}`);
  }

  return {
    success: true,
    eventId,
  };
}
