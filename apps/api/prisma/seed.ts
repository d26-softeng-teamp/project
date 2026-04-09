import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Seeding database...");

  await prisma.contentManagement.deleteMany();

  const userRow = await prisma.userProfile.findFirst({
    where: { email: "user@hanover.test" },
  });
  const adminRow = await prisma.userProfile.findFirst({
    where: { email: "admin@hanover.test" },
  });

  if (!userRow || !adminRow) {
    console.warn(
      "Skip content seed: run `supabase db reset` first so auth + public.users exist (user@hanover.test, admin@hanover.test).",
    );
    return;
  }

  await Promise.all([
    prisma.contentManagement.create({
      data: {
        fileID: "FILE-TS-GUIDE-001",
        filename: "Getting Started with TypeScript",
        url: "/docs/typescript-guide",
        owner_id: userRow.id,
        job_position: "Senior Developer",
        last_modified: new Date("2026-03-15"),
        content_type: "Reference",
        document_status: "Finalized",
      },
    }),
    prisma.contentManagement.create({
      data: {
        fileID: "FILE-MKT-Q1-002",
        filename: "Q1 Marketing Strategy",
        url: "/docs/q1-marketing",
        owner_id: adminRow.id,
        job_position: "Content Strategist",
        last_modified: new Date("2026-02-20"),
        content_type: "Workflow",
        document_status: "Finalized",
      },
    }),
    prisma.contentManagement.create({
      data: {
        fileID: "FILE-ARCH-MICRO-003",
        filename: "Microservices Architecture Guide",
        url: "/docs/microservices",
        owner_id: userRow.id,
        job_position: "Tech Lead",
        last_modified: new Date("2026-01-10"),
        content_type: "Reference",
        document_status: "Finalized",
      },
    }),
    prisma.contentManagement.create({
      data: {
        fileID: "FILE-DS-V2-004",
        filename: "Design System v2 Proposal",
        url: "/docs/design-system-v2",
        owner_id: adminRow.id,
        job_position: "UI/UX Designer",
        last_modified: new Date("2026-03-28"),
        content_type: "Reference",
        document_status: "Created",
      },
    }),
    prisma.contentManagement.create({
      data: {
        fileID: "FILE-ROADMAP-2026-005",
        filename: "Product Roadmap 2026",
        url: "/docs/roadmap-2026",
        owner_id: userRow.id,
        job_position: "Product Manager",
        last_modified: new Date("2026-03-01"),
        content_type: "Workflow",
        document_status: "in-progress",
      },
    }),
  ]);

  console.log("Seeded 5 content items (owners: demo Auth users).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
