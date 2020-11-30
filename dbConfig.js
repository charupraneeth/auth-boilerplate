const { Pool } = require("pg");

require("dotenv").config();
const inProduction = process.env.NODE_ENV === "production";

const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
// console.log(connectionString);
const pool = new Pool({
  connectionString: inProduction ? process.env.DATABASE_URL : connectionString,
});

module.exports = { pool, connectionString };
