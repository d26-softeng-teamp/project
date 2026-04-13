/**
 * Preload for Prisma CLI: repo-root `.env` then `.env.local`.
 * Usage from apps/api: node --import ./load-env-pre.js …
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

if (process.env.PRISMA_USE_REMOTE_DATABASE === "1" || process.env.NODE_ENV === "production") {
  // Remote: prisma.config.ts loads .env.database.remote and sets DATABASE_URL.
  // Production: host injects env.
} else {
  const apiDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(apiDir, "../..");

  dotenv.config({ path: path.join(repoRoot, ".env") });
  dotenv.config({ path: path.join(repoRoot, ".env.local"), override: true });
}
