const GCAL_EVENTS_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

type CalendarEventAttendee = {
  email?: string;
  displayName?: string;
  organizer?: boolean;
  self?: boolean;
  resource?: boolean;
  optional?: boolean;
  responseStatus?: 'needsAction' | 'accepted' | 'tentative' | 'declined';
  comment?: string;
  additionalGuests?: number;
};

export async function respondToEvent({
  accessToken,
  eventId,
  responseStatus,
}: {
  accessToken: string;
  eventId: string;
  responseStatus: 'accepted' | 'tentative' | 'declined';
}) {
  const eventUrl = `${GCAL_EVENTS_BASE}/${encodeURIComponent(eventId)}`;

  const eventRes = await fetch(eventUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!eventRes.ok) {
    const text = await eventRes.text();
    console.error('[gcal.respondToEvent] failed to fetch event', {
      status: eventRes.status,
      statusText: eventRes.statusText,
      body: text,
      eventId,
    });
    throw new Error(`Failed to fetch event: ${eventRes.status} ${text}`);
  }

  const event = await eventRes.json();
  const attendees: CalendarEventAttendee[] = event.attendees ?? [];
  const selfAttendeeIndex = attendees.findIndex((attendee) => attendee?.self);

  if (selfAttendeeIndex === -1) {
    throw new Error('Could not find your attendee record for this event.');
  }

  const updatedAttendees = attendees.map((attendee, index) => (
    index === selfAttendeeIndex
      ? { ...attendee, responseStatus }
      : attendee
  ));

  const updateUrl = `${eventUrl}?sendUpdates=none`;
  const updateRes = await fetch(updateUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      attendees: updatedAttendees,
    }),
  });

  if (!updateRes.ok) {
    const text = await updateRes.text();
    console.error('[gcal.respondToEvent] failed to update response', {
      status: updateRes.status,
      statusText: updateRes.statusText,
      body: text,
      eventId,
      responseStatus,
    });
    throw new Error(`Failed to respond to event: ${updateRes.status} ${text}`);
  }

  const updatedEvent = await updateRes.json();

  return {
    success: true,
    eventId: updatedEvent.id,
    summary: updatedEvent.summary ?? event.summary ?? 'Untitled event',
    start: updatedEvent.start?.dateTime ?? updatedEvent.start?.date ?? event.start?.dateTime ?? event.start?.date ?? null,
    responseStatus,
    htmlLink: updatedEvent.htmlLink ?? event.htmlLink ?? null,
  };
}
