import Db from "../Db";
import { AuthAccount } from "../Auth/types"

export default class AccountDb extends Db{
  async upsertUserWithGoogle(
    email: string,
    googleSub: string
  ): Promise<AuthAccount> {
      if (!email || !googleSub) {
        throw new Error("Missing params");
      }
      const account = await this.queryOne<AuthAccount>(
      `
        INSERT INTO accounts (email, google_sub)
        VALUES ($1, $2)
        ON CONFLICT (email)
        DO UPDATE
          SET email = EXCLUDED.email
        RETURNING id AS accountId, email;
      `, [email, googleSub]
    );
    return account;
  }
}