import pg from "pg";

export type Constructor<T> = {
  [P in keyof T]: new (...args: any[]) => T[P];
};

const pgConfig = {
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl: false, 
}

export class Pool<T> {
  private coreDb: Constructor<T>;
  private db: pg.Pool;

  constructor(
    c: Constructor<T>, 
  ) {
    this.coreDb = c;
    this.db = new pg.Pool(pgConfig);
  }

}