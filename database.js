import pg from 'pg';

// Initialize DB connection for SQL database
const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'bryluke000',
  host: 'localhost',
  database: 'zettelkasten',
  port: 5432,
};

const pool = new Pool(pgConnectionConfigs);

export default pool;