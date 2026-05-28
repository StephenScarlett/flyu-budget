const { Client } = require("pg");
const fs = require("fs");

async function run() {
  const c = new Client({
    host: "aws-0-us-east-1.pooler.supabase.com",
    port: 5432,
    database: "postgres",
    user: "postgres.nuflsswvsqduzfjjnsou",
    password: "nai@ngryUSB08",
    ssl: { rejectUnauthorized: false },
  });
  
  await c.connect();
  console.log("Connected!");
  
  // Check if links table exists
  const check = await c.query("SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='links')");
  if (check.rows[0].exists) {
    console.log("links table already exists, skipping migration");
    await c.end();
    return;
  }

  // Run migration
  const sql = fs.readFileSync("supabase/migrations/002_links_table.sql", "utf8");
  await c.query(sql);
  console.log("Migration 002_links_table.sql applied successfully!");
  
  // Verify
  const verify = await c.query("SELECT count(*) FROM links");
  console.log("Links count:", verify.rows[0].count);
  
  await c.end();
}

run().catch(e => { console.error("Error:", e.message); process.exit(1); });
