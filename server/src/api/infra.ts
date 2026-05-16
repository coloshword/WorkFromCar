import AccountDb from "./Account/AccountDb";
import EventsDb from "./Events/EventsDb";
import { Pool } from "./Db";

export interface InfraConfig {
  account: AccountDb;
  events: EventsDb;
}

export default class Infra extends Pool<InfraConfig> {
  constructor() {
    super({
      account: AccountDb,
      events: EventsDb
    });
  }
}
