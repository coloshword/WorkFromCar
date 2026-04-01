export const GCAL_EVENTS_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export interface CalendarEventSummary {
  summary: string;
  start: string | null;
  end: string | null;
  location: string | null;
  attendees: string[];
}

export async function getEvents({
  accessToken,
  timeMin,
  timeMax,
  maxResults,
}: {
  accessToken: string;
  timeMin: string;
  timeMax: string;
  maxResults: number | null;
}): Promise<CalendarEventSummary[]> {
  const limit = maxResults ?? 10;
  const eventsUrl = new URL(GCAL_EVENTS_BASE);
  eventsUrl.searchParams.set('timeMin', timeMin);
  eventsUrl.searchParams.set('timeMax', timeMax);
  eventsUrl.searchParams.set('maxResults', String(limit));
  eventsUrl.searchParams.set('singleEvents', 'true');
  eventsUrl.searchParams.set('orderBy', 'startTime');

  const res = await fetch(eventsUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[gcal.getEvents] error response', {
      status: res.status,
      statusText: res.statusText,
      body: text,
      timeMin,
      timeMax,
      maxResults: limit,
    });
    throw new Error(`Failed to get events: ${res.status} ${text}`);
  }

  const data = await res.json();
  const events = data.items ?? [];

  return events.map((event: any) => ({
    summary: event.summary ?? 'Untitled event',
    start: event.start?.dateTime ?? event.start?.date ?? null,
    end: event.end?.dateTime ?? event.end?.date ?? null,
    location: event.location ?? null,
    attendees: (event.attendees ?? []).map((attendee: any) => attendee.email).filter(Boolean),
  }));
}
