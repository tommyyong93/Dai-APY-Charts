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
})();
