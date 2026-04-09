import "dotenv/config";
import path from "node:path";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, "schema.prisma"),

  datasource: {
    url: process.env.DATABASE_URL!,
  },

  migrations: {
    seed: "tsx apps/api/prisma/seed.ts",
  },

  generator: {
    client: { provider: "prisma-client-js" },
  },
});