import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(repoRoot, ".env") });
dotenv.config({ path: path.join(repoRoot, ".env.local"), override: true });

if (process.env.PRISMA_USE_REMOTE_DATABASE === "1") {
  const remotePath = path.join(repoRoot, ".env.database.remote");
  const result = dotenv.config({ path: remotePath, override: true });
  if (result.error) {
    throw new Error(
      `PRISMA_USE_REMOTE_DATABASE: could not load ${remotePath}. Create it from .env.database.remote.example.`,
    );
  }
}

const pooledUrl = process.env.DATABASE_URL?.trim();
const sessionUrl = process.env.DIRECT_URL?.trim();
const isRemoteCli = process.env.PRISMA_USE_REMOTE_DATABASE === "1";

// Remote `db push` / migrate: Prisma's engine must use session pooler (:5432). If we pass transaction
// pooler (:6543) as datasource.url, the CLI still uses it for most work → 10+ minute "hangs" and errors.
// Prefer DIRECT_URL for both url + migrate when running pnpm db:push:remote.
let databaseUrl: string | undefined = (() => {
  if (isRemoteCli && sessionUrl) return sessionUrl;
  if (pooledUrl) return pooledUrl;
  if (sessionUrl) return sessionUrl;
  return undefined;
})();

if (!databaseUrl) {
  // `prisma generate` and bundled API builds do not open a DB connection; Prisma still loads this config.
  // CI / Railway builds often have no repo `.env` — use a well-formed placeholder for config parsing only.
  if (process.env.CI === "true" || process.env.RAILWAY_ENVIRONMENT) {
    databaseUrl = "postgresql://postgres:postgres@127.0.0.1:5432/postgres";
  } else {
    throw new Error(
      "DATABASE_URL is not set. Local: repo-root .env / .env.local. Remote push: .env.database.remote (pnpm db:push:remote). See .env.example.",
    );
  }
}

const directUrl = sessionUrl || pooledUrl || databaseUrl;

// So spawned `prisma db seed` / PrismaPg see the same URL the CLI engine uses (session pooler on remote).
if (isRemoteCli) {
  process.env.DATABASE_URL = databaseUrl;
  if (sessionUrl) process.env.DIRECT_URL = sessionUrl;
}

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "prisma/schema.prisma"),
  datasource: {
    url: databaseUrl,
    directUrl,
  },
  migrate: {
    url: directUrl,
  },
  migrations: {
    seed: `tsx ${path.join(__dirname, "prisma/seed.ts")}`,
  },
});
