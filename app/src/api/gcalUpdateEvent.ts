import { GCAL_EVENTS_BASE } from './gcalGetEvents';

export type GcalUpdateEventParams = {
  accessToken: string;
  eventId: string;
  newSummary: string | null;
  startIso: string | null;
  endIso: string | null;
  timeZone: string | null;
  newLocation: string | null;
  newDescription: string | null;
  attendees: string[] | null;
};

export async function updateEvent({
  accessToken,
  eventId,
  newSummary,
  startIso,
  endIso,
  timeZone,
  newLocation,
  newDescription,
  attendees,
}: GcalUpdateEventParams) {
  const patch: Record<string, unknown> = {};

  if (newSummary != null) {
    patch.summary = newSummary;
  }
  if (startIso != null && endIso != null && timeZone != null) {
    patch.start = { dateTime: startIso, timeZone };
    patch.end = { dateTime: endIso, timeZone };
  }
  if (newLocation != null) {
    patch.location = newLocation;
  }
  if (newDescription != null) {
    patch.description = newDescription;
  }
  if (attendees != null) {
    patch.attendees = attendees.map((email) => ({ email }));
  }

  const notifyGuests =
    patch.start != null ||
    patch.end != null ||
    patch.summary != null ||
    patch.attendees != null;
  const sendUpdates = notifyGuests ? 'all' : 'none';

  const eventUrl = `${GCAL_EVENTS_BASE}/${encodeURIComponent(eventId)}`;
  const url = `${eventUrl}?sendUpdates=${sendUpdates}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patch),
    });
  } catch (error: any) {
    console.error('[gcal.updateEvent] network error', {
      message: error?.message,
      eventId,
      patch,
    });
    throw error;
  }

  if (!res.ok) {
    const text = await res.text();
    console.error('[gcal.updateEvent] error response', {
      status: res.status,
      statusText: res.statusText,
      body: text,
      eventId,
      patch,
    });
    throw new Error(`Failed to update event: ${res.status} ${text}`);
  }

  const data = await res.json();

  return {
    success: true,
    eventId: data.id,
    summary: data.summary ?? 'Untitled event',
    start: data.start?.dateTime ?? data.start?.date ?? null,
    end: data.end?.dateTime ?? data.end?.date ?? null,
    htmlLink: data.htmlLink ?? null,
  };
}
