import MariaDB, { PoolConnection } from "mariadb";
require("dotenv").config();

let db: PoolConnection | undefined;
export async function getPool() {
    if(db) return db
    db = await MariaDB.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_U,
      password: process.env.DB_P,
      database: process.env.DB_NAME,
    }).getConnection()
    return db
}
export async function reloadDB() {
  db = undefined
}
