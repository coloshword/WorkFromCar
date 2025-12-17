import { Pool as PgPool, QueryResult, type QueryResultRow } from "pg";
import { InfraConfig } from "./infra"; 

export type Constructor<T> = {
  [P in keyof T]: new (...args: any[]) => T[P];
};

const pgConfig = {
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  ssl: false, 
}

export default abstract class Db<T = InfraConfig> {
  private connection: any;
  private registry: any;
  
  public constructor(connection: any, registry: any) {
    this.connection = connection;
    this.registry = registry;
  }

  protected get core(): string {
    return new Proxy(this.registry.coreDb, {
      get: (obj, key) => {
        if (key in obj) {
          return new obj[key](this.connection, this.registry);
        }
      }
    })
  }

  protected query = async (q: any, params: any = []) => {
    return await this.connection.query(q, params);
  }
}

export class Pool<T> {
  private coreDb: Constructor<T>;
  private dbPool: PgPool;

  constructor(
    c: Constructor<T>, 
  ) {
    this.coreDb = c;
    this.dbPool = new PgPool(pgConfig);
  }

  async end() {
    await this.dbPool.end();
  }

  async query<R extends QueryResultRow>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<R>> {
    return this.dbPool.query<R>(text, params);
  }

  get db(): T {
    return new Proxy(this.coreDb as any, {
      get: (obj, key) => {
        const Model = obj[key];
        if (!Model) return undefined;

        const instance = new Model(this);

        return new Proxy(instance, {
          get: (target, fn) => {
            if (typeof target[fn] !== "function") return undefined;
            return (...args: any[]) => target[fn](...args);
          },
        });
      },
    }) as T;
  }
}