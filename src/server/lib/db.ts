import { Client } from 'pg';

export const client = new Client({
  user: 'pguser',
  password: 'password',
  port: 5432,
  host: 'postgres',
  database: 'app'
});

// This is an okay place to do migrations
(async () => {
  await client.connect();
  await client.query(`CREATE TABLE IF NOT EXISTS "dai_rates"(
    "block_number" INT PRIMARY KEY,
    "timestamp" INT,
    "compound_rate" FLOAT(53),
    "aave_rate" FLOAT(53)
  );`);
})();
