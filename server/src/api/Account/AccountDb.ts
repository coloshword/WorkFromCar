import Db from "../Db";

export default class AccountDb extends Db{
  async sampleFunction() {
    const res = await this.query(
      `
      SELECT * from accounts
      `
    );

    const {
      id,
      email,
      created_at
    } = res.rows[0];
    console.log(email);
  }
}