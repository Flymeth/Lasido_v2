import MariaDB, { PoolConnection } from "mariadb";

let db: PoolConnection;
export async function getPool() {
    if(db) return db
    db = await MariaDB.createPool({
		host: process.env.DB_HOST,
		port: parseInt(process.env.DB_PORT || "3306"),
        user: process.env.DB_U,
        password: process.env.DB_P,
		database: process.env.DB_NAME
    }).getConnection()
    return db
}
