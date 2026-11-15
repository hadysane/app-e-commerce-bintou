// Uploads the starting product photos (supabase/seed/images/<slug>.jpg) to the
// product-images bucket. Safe to re-run: existing files are overwritten.
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env or .env.local.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";

const env = loadEnv("development", process.cwd(), "");
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis dans .env ou .env.local.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const dir = path.join(process.cwd(), "supabase/seed/images");
let failed = 0;

for (const file of (await readdir(dir)).filter((f) => f.endsWith(".jpg"))) {
  const { error } = await supabase.storage
    .from("product-images")
    .upload(file, await readFile(path.join(dir, file)), { contentType: "image/jpeg", upsert: true });
  if (error) {
    failed++;
    console.error(`✗ ${file} : ${error.message}`);
  } else {
    console.log(`✓ ${file}`);
  }
}

process.exit(failed ? 1 : 0);
