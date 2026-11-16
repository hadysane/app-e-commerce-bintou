// Uploads the starting product photos (supabase/seed/images/<slug>.jpg) to the
// product-images bucket. Safe to re-run: existing files are overwritten.
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env or .env.local.
// Calls the Storage REST API directly: supabase-js needs Node 22+ outside the app.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnv } from "vite";

const env = loadEnv("development", process.cwd(), "");
const url = env.SUPABASE_URL?.replace(/\/+$/, "");
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis dans .env ou .env.local.");
  process.exit(1);
}

// New sb_secret_ keys go in the apikey header only; legacy JWT keys also need Authorization.
const auth = key.startsWith("sb_") ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
const dir = path.join(process.cwd(), "supabase/seed/images");
let failed = 0;

for (const file of (await readdir(dir)).filter((f) => f.endsWith(".jpg"))) {
  const res = await fetch(`${url}/storage/v1/object/product-images/${encodeURIComponent(file)}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "image/jpeg", "x-upsert": "true" },
    body: await readFile(path.join(dir, file)),
  });
  if (res.ok) {
    console.log(`✓ ${file}`);
  } else {
    failed++;
    console.error(`✗ ${file} : ${res.status} ${await res.text()}`);
  }
}

process.exit(failed ? 1 : 0);
