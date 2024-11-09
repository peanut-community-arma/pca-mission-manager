import Database from "better-sqlite3";

const sql = new Database("pca-mm.sqlite3");

sql.defaultSafeIntegers(true);

export default sql;
