declare module "connect-sqlite3" {
  import type { Store } from "express-session";
  interface ConnectSqlite3Constructor {
    (session: typeof import("express-session")): new (options?: object) => Store;
  }
  const connectSqlite3: ConnectSqlite3Constructor;
  export = connectSqlite3;
}
