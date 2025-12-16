import Db from "../Db";

export default class AccountDb extends Db{
  async sampleFunction() {
    console.log(this.core);
  }
}