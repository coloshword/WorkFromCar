import AccountDb from "./Account/AccountDb";
import { Pool } from "./Db";

export interface InfraConfig {
  account: AccountDb;
}

export default class Infra extends Pool<InfraConfig> {
  constructor() {
    super({
      account: AccountDb
    });
  }
}