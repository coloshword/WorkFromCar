export async function createEvent({
  accessToken,
  summary,
  description,
  startIso,
  endIso,
  timeZone = 'America/New_York',
  location,
  attendees,
}: {
  accessToken: string;
  summary: string;
  description: string | null;
  startIso: string;
  endIso: string;
  timeZone: string;
  location: string | null;
  attendees: string[] | null;
}) {
  const hasAttendees = (attendees?.length ?? 0) > 0;
  const requestBody = {
    summary,
    description,
    location,
    start: {
      dateTime: startIso,
      timeZone,
    },
    end: {
      dateTime: endIso,
      timeZone,
    },
    attendees: hasAttendees ? attendees!.map((email) => ({ email })) : undefined,
  };


  let res: Response;
  try {
    const url = hasAttendees
      ? 'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all'
      : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    res = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );
  } catch (error: any) {
    console.error('[gcal.createEvent] network error', {
      message: error?.message,
      requestBody,
    });
    throw error;
  }


  if (!res.ok) {
    const text = await res.text();
    console.error('[gcal.createEvent] error response', {
      status: res.status,
      statusText: res.statusText,
      body: text,
      requestBody,
    });
    throw new Error(`Failed to create event: ${res.status} ${text}`);
  }

  const data = await res.json();

  return {
    success: true,
    eventId: data.id,
    summary: data.summary,
    start: data.start.dateTime,
    end: data.end.dateTime,
    htmlLink: data.htmlLink,
  };
}
