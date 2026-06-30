declare module "connect-sqlite3" {
  import type session from "express-session";

  interface ConnectSqlite3Options {
    db?: string;
    dir?: string;
    table?: string;
    concurrentDB?: boolean;
  }

  type Sqlite3StoreClass = new (options?: ConnectSqlite3Options) => session.Store;

  function connectSqlite3(sess: typeof session): Sqlite3StoreClass;

  export = connectSqlite3;
}
