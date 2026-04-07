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
  await prisma.employee.deleteMany();

  const employees = await Promise.all([
    prisma.employee.create({
      data: { employeeID: "EMP001", employee_name: "Alice Johnson", job_desc: "Senior Developer" },
    }),
    prisma.employee.create({
      data: { employeeID: "EMP002", employee_name: "Bob Martinez", job_desc: "Content Strategist" },
    }),
    prisma.employee.create({
      data: { employeeID: "EMP003", employee_name: "Carol Chen", job_desc: "Tech Lead" },
    }),
    prisma.employee.create({
      data: { employeeID: "EMP004", employee_name: "David Kim", job_desc: "UI/UX Designer" },
    }),
    prisma.employee.create({
      data: { employeeID: "EMP005", employee_name: "Eva Rodriguez", job_desc: "Product Manager" },
    }),
  ]);

  await Promise.all([
    prisma.contentManagement.create({
      data: {
        fileID: "FILE-TS-GUIDE-001",
        filename: "Getting Started with TypeScript",
        url: "/docs/typescript-guide",
        content_owner: employees[0].employeeID,
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
        content_owner: employees[1].employeeID,
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
        content_owner: employees[2].employeeID,
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
        content_owner: employees[3].employeeID,
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
        content_owner: employees[4].employeeID,
        job_position: "Product Manager",
        last_modified: new Date("2026-03-01"),
        content_type: "Workflow",
        document_status: "in-progress",
      },
    }),
  ]);

  console.log(`Seeded ${employees.length} employees and 5 content items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
