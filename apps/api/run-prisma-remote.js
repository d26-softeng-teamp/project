/**
 * Mark Prisma CLI runs that should use repo-root `.env.database.remote` (production Postgres).
 * Loaded before Prisma reads prisma.config.ts — see `PRISMA_USE_REMOTE_DATABASE` there.
 */
process.env.PRISMA_USE_REMOTE_DATABASE = "1";
