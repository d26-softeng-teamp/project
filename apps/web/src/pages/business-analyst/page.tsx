type ResourceLink = {
  title: string;
  description: string;
  url: string;
  category:
    | "Core Systems"
    | "Analysis & Reporting"
    | "Documentation & Process"
    | "Project & Collaboration";
  type: "System" | "Tool" | "Guide" | "Reference";
};

const businessAnalystLinks: ResourceLink[] = [
  {
    title: "States on Hold",
    description: "Track states with temporary restrictions or workflow exceptions.",
    url: "#",
    category: "Core Systems",
    type: "Reference",
  },
  {
    title: "Forms Knowledge Base",
    description: "Access standardized forms, templates, and operational documentation.",
    url: "#",
    category: "Core Systems",
    type: "Reference",
  },
  {
    title: "IPS (Image & Processing System)",
    description: "Review document processing activity and image-based records.",
    url: "#",
    category: "Core Systems",
    type: "System",
  },
  {
    title: "Underwriting Workstation",
    description: "View underwriting workflows and understand downstream business impacts.",
    url: "#",
    category: "Core Systems",
    type: "System",
  },
  {
    title: "CPP Rater Resource Site",
    description: "Reference rating resources used across underwriting and operations.",
    url: "#",
    category: "Core Systems",
    type: "Tool",
  },
  {
    title: "PMS URG",
    description: "Internal guide for policy management and related workflow standards.",
    url: "#",
    category: "Core Systems",
    type: "Guide",
  },
  {
    title: "Error Lookup Tool",
    description: "Identify common issues, root causes, and known resolutions.",
    url: "#",
    category: "Core Systems",
    type: "Tool",
  },
  {
    title: "Workaround Tool",
    description: "Find approved workarounds for platform and process limitations.",
    url: "#",
    category: "Core Systems",
    type: "Tool",
  },

  {
    title: "Monthly KPI Dashboard",
    description: "Monitor operational performance metrics and business trends.",
    url: "#",
    category: "Analysis & Reporting",
    type: "Tool",
  },
  {
    title: "Trend Analysis Workbook",
    description: "Analyze recurring patterns across workflows, issues, and requests.",
    url: "#",
    category: "Analysis & Reporting",
    type: "Reference",
  },
  {
    title: "Root Cause Analysis Template",
    description: "Structure issue investigation and document contributing factors.",
    url: "#",
    category: "Analysis & Reporting",
    type: "Guide",
  },
  {
    title: "Operational Reporting Hub",
    description: "Central place for performance, compliance, and workflow reports.",
    url: "#",
    category: "Analysis & Reporting",
    type: "System",
  },
  {
    title: "Data Dictionary",
    description: "Reference field definitions, naming standards, and data usage.",
    url: "#",
    category: "Analysis & Reporting",
    type: "Reference",
  },
  {
    title: "Business Rules Repository",
    description: "Review documented logic that supports operational workflows.",
    url: "#",
    category: "Analysis & Reporting",
    type: "Reference",
  },
  {
    title: "Experience & Schedule Rating Plans",
    description: "Use rating plan references to support analysis and process reviews.",
    url: "#",
    category: "Analysis & Reporting",
    type: "Guide",
  },
  {
    title: "Issue Trend Tracker",
    description: "Track issue volume over time and identify recurring problem areas.",
    url: "#",
    category: "Analysis & Reporting",
    type: "Tool",
  },

  {
    title: "Business Requirements Template",
    description: "Standardize requirement gathering for projects and process changes.",
    url: "#",
    category: "Documentation & Process",
    type: "Guide",
  },
  {
    title: "Process Mapping Guide",
    description: "Document and analyze current-state and future-state workflows.",
    url: "#",
    category: "Documentation & Process",
    type: "Guide",
  },
  {
    title: "Report Request Intake Form",
    description: "Collect and organize reporting needs from internal stakeholders.",
    url: "#",
    category: "Documentation & Process",
    type: "Reference",
  },
  {
    title: "Policy Change Request Form",
    description: "Capture requests for updates to process, system, or documentation.",
    url: "#",
    category: "Documentation & Process",
    type: "Reference",
  },
  {
    title: "Claims Workflow Overview",
    description: "Understand claim-related processes and related handoff points.",
    url: "#",
    category: "Documentation & Process",
    type: "Guide",
  },
  {
    title: "User Acceptance Testing Checklist",
    description: "Validate business requirements before release and rollout.",
    url: "#",
    category: "Documentation & Process",
    type: "Guide",
  },
  {
    title: "Change Management Tracker",
    description: "Monitor requested updates and their implementation status.",
    url: "#",
    category: "Documentation & Process",
    type: "Tool",
  },
  {
    title: "Meeting Notes Repository",
    description: "Access prior notes, decisions, and action items from team meetings.",
    url: "#",
    category: "Documentation & Process",
    type: "Reference",
  },

  {
    title: "Sprint Planning Notes",
    description: "Review planned work, priorities, and team coordination items.",
    url: "#",
    category: "Project & Collaboration",
    type: "Reference",
  },
  {
    title: "Stakeholder Communication Tracker",
    description: "Keep communication with business partners and teams organized.",
    url: "#",
    category: "Project & Collaboration",
    type: "Tool",
  },
  {
    title: "Cross-Team Contact Directory",
    description: "Quickly find the right contacts across departments and teams.",
    url: "#",
    category: "Project & Collaboration",
    type: "Reference",
  },
  {
    title: "Release Notes Archive",
    description: "Review historical releases and understand system change history.",
    url: "#",
    category: "Project & Collaboration",
    type: "Reference",
  },
  {
    title: "Integration Dependencies List",
    description: "Track system dependencies that affect delivery and coordination.",
    url: "#",
    category: "Project & Collaboration",
    type: "Guide",
  },
  {
    title: "Project Timeline Board",
    description: "View milestones, deadlines, and upcoming implementation work.",
    url: "#",
    category: "Project & Collaboration",
    type: "Tool",
  },
];

const categoryDescriptions: Record<ResourceLink["category"], string> = {
  "Core Systems": "Primary systems and shared tools used to support business operations.",
  "Analysis & Reporting":
    "Resources for reviewing trends, metrics, data definitions, and business logic.",
  "Documentation & Process": "Templates, guides, and process materials for structured execution.",
  "Project & Collaboration":
    "Planning, communication, and coordination resources for cross-team work.",
};

function BusinessAnalystPage() {
  const groupedLinks = businessAnalystLinks.reduce(
    (acc, link) => {
      if (!acc[link.category]) acc[link.category] = [];
      acc[link.category].push(link);
      return acc;
    },
    {} as Record<ResourceLink["category"], ResourceLink[]>,
  );

  return (
    <div className="min-h-screen bg-muted">
      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Business Analyst Resources</h1>
          <p className="mb-10 text-muted-foreground">
            Tools and references for Business Ops &amp; Tech Integration
          </p>

          <div className="space-y-10">
            {Object.entries(groupedLinks).map(([category, links]) => (
              <section key={category}>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-foreground">{category}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {categoryDescriptions[category as ResourceLink["category"]]}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {links.map((link) => (
                    <a
                      key={link.title}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group rounded-xl border border-border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {link.type}
                        </span>
                        <span className="text-sm text-muted-foreground transition group-hover:text-primary">
                          ↗
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-foreground">{link.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {link.description}
                      </p>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-border border-l-4 border-l-[#C9A84C] bg-card p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-foreground">About the Business Analyst</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/40 p-4">
                <div className="text-sm font-semibold text-foreground">Traits</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Analytical, Collaborative, Detail-oriented
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 p-4">
                <div className="text-sm font-semibold text-foreground">Access</div>
                <div className="mt-1 text-sm text-muted-foreground">Weekly</div>
              </div>

              <div className="rounded-lg bg-muted/40 p-4">
                <div className="text-sm font-semibold text-foreground">Criticality</div>
                <div className="mt-1 text-sm text-muted-foreground">High</div>
              </div>

              <div className="rounded-lg bg-muted/40 p-4">
                <div className="text-sm font-semibold text-foreground">Goal</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {'"Ensure accurate documentation and seamless process integration"'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessAnalystPage;
