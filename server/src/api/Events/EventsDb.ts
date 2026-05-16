import Db from "../Db";

export type EventType =
  | "login"
  | "plan_call"
  | "execute_permission"
  | "summarize"
  | "error";

export default class EventsDb extends Db {
  async logEvent(
    eventType: EventType,
    accountId: number | null,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.query(
        `
          INSERT INTO events (account_id, event_type, metadata)
          VALUES ($1, $2, $3);
        `,
        [accountId, eventType, metadata ?? null]
      );
    } catch (err) {
      console.error("[events] failed to log event", eventType, err);
    }
  }
}
