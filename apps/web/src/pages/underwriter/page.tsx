type ResourceLink = {
  title: string;
  description: string;
  url: string;
  category: "Core Systems" | "Rating & Risk Tools" | "Reference Materials" | "State & Compliance";
  type: "System" | "Tool" | "Guide" | "Reference";
};

const underwriterLinks: ResourceLink[] = [
  {
    title: "Desktop Management Tool",
    description: "Access and manage workstation tools used in daily underwriting tasks.",
    url: "#",
    category: "Core Systems",
    type: "System",
  },
  {
    title: "Underwriting Workstation",
    description: "Primary workspace for reviewing accounts and underwriting activity.",
    url: "#",
    category: "Core Systems",
    type: "System",
  },
  {
    title: "IPS (Image & Processing System)",
    description: "View and process policy-related images and supporting documents.",
    url: "#",
    category: "Core Systems",
    type: "System",
  },
  {
    title: "Property View",
    description: "Review property-specific information and supporting risk details.",
    url: "#",
    category: "Core Systems",
    type: "System",
  },
  {
    title: "Forms Knowledge Base",
    description: "Find required forms, documentation, and internal references.",
    url: "#",
    category: "Core Systems",
    type: "Reference",
  },
  {
    title: "Account Lookup Portal",
    description: "Search account details and view key underwriting information quickly.",
    url: "#",
    category: "Core Systems",
    type: "Tool",
  },
  {
    title: "Submission Tracker",
    description: "Monitor new submissions and follow progress through review stages.",
    url: "#",
    category: "Core Systems",
    type: "Tool",
  },
  {
    title: "Renewal Dashboard",
    description: "Track upcoming renewals and prioritize policy review activity.",
    url: "#",
    category: "Core Systems",
    type: "Tool",
  },

  {
    title: "RiskMeter Online",
    description: "Analyze property and location-based risk indicators for underwriting.",
    url: "#",
    category: "Rating & Risk Tools",
    type: "Tool",
  },
  {
    title: "Experience & Schedule Rating Plans",
    description: "Reference rating plan rules used in policy pricing decisions.",
    url: "#",
    category: "Rating & Risk Tools",
    type: "Guide",
  },
  {
    title: "CPP Rater Resource Site",
    description: "Support materials for commercial package policy rating workflows.",
    url: "#",
    category: "Rating & Risk Tools",
    type: "Tool",
  },
  {
    title: "Error Lookup Tool",
    description: "Find explanations and fixes for common system and rating errors.",
    url: "#",
    category: "Rating & Risk Tools",
    type: "Tool",
  },
  {
    title: "Workaround Tool",
    description: "Locate approved workarounds for known process and system issues.",
    url: "#",
    category: "Rating & Risk Tools",
    type: "Tool",
  },
  {
    title: "Loss History Review",
    description: "Review prior claims and losses when evaluating account risk.",
    url: "#",
    category: "Rating & Risk Tools",
    type: "Reference",
  },
  {
    title: "Exposure Analysis Worksheet",
    description: "Summarize risk exposures for consistent underwriting review.",
    url: "#",
    category: "Rating & Risk Tools",
    type: "Guide",
  },
  {
    title: "Pricing Support Calculator",
    description: "Assist with quick premium and pricing-related calculations.",
    url: "#",
    category: "Rating & Risk Tools",
    type: "Tool",
  },

  {
    title: "ISOnet Website",
    description: "Access industry standards, classification references, and policy guidance.",
    url: "#",
    category: "Reference Materials",
    type: "Reference",
  },
  {
    title: "PMS URG",
    description: "Reference underwriting guidance for internal policy management workflows.",
    url: "#",
    category: "Reference Materials",
    type: "Guide",
  },
  {
    title: "Underwriting Manual",
    description: "Central guide for underwriting rules, process standards, and expectations.",
    url: "#",
    category: "Reference Materials",
    type: "Guide",
  },
  {
    title: "Coverage Comparison Guide",
    description: "Compare coverage options and clarify policy differences.",
    url: "#",
    category: "Reference Materials",
    type: "Guide",
  },
  {
    title: "Risk Appetite Matrix",
    description: "Quick reference for acceptable, restricted, and ineligible risks.",
    url: "#",
    category: "Reference Materials",
    type: "Reference",
  },
  {
    title: "Broker Communication Templates",
    description: "Use standard templates for consistent external communication.",
    url: "#",
    category: "Reference Materials",
    type: "Guide",
  },
  {
    title: "Policy Review Checklist",
    description: "Checklist to confirm complete and accurate underwriting review.",
    url: "#",
    category: "Reference Materials",
    type: "Guide",
  },
  {
    title: "Training Notes Repository",
    description: "Collection of internal notes and training resources for underwriters.",
    url: "#",
    category: "Reference Materials",
    type: "Reference",
  },

  {
    title: "States on Hold",
    description: "Review states with temporary restrictions or underwriting limitations.",
    url: "#",
    category: "State & Compliance",
    type: "Reference",
  },
  {
    title: "Coastal Guidelines",
    description: "Underwriting guidance for coastal properties and related exposures.",
    url: "#",
    category: "State & Compliance",
    type: "Guide",
  },
  {
    title: "Kentucky Tax and Tax Exemption Job Aid",
    description: "Reference Kentucky tax and exemption rules for applicable accounts.",
    url: "#",
    category: "State & Compliance",
    type: "Guide",
  },
  {
    title: "State Exception Matrix",
    description: "Track special underwriting rules and exceptions by state.",
    url: "#",
    category: "State & Compliance",
    type: "Reference",
  },
  {
    title: "Compliance Bulletin Archive",
    description: "Review recent compliance updates that affect underwriting decisions.",
    url: "#",
    category: "State & Compliance",
    type: "Reference",
  },
  {
    title: "Regulatory Notice Tracker",
    description: "Monitor regulatory changes and notices relevant to underwriting teams.",
    url: "#",
    category: "State & Compliance",
    type: "Tool",
  },
];

const categoryDescriptions: Record<ResourceLink["category"], string> = {
  "Core Systems": "Primary platforms and daily-use systems for underwriting work.",
  "Rating & Risk Tools": "Tools and references used to evaluate pricing and exposure.",
  "Reference Materials": "Guides, manuals, and internal resources for consistent decisions.",
  "State & Compliance": "State-specific restrictions, regulatory notes, and compliance guidance.",
};

function UnderwriterPage() {
  const groupedLinks = underwriterLinks.reduce(
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
          <h1 className="mb-2 text-3xl font-bold text-foreground">Underwriter Resources</h1>
          <p className="mb-10 text-muted-foreground">
            Tools and references for Commercial Underwriters
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
            <h2 className="mb-5 text-xl font-bold text-foreground">About the Underwriter</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/40 p-4">
                <div className="text-sm font-semibold text-foreground">Traits</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Analytical, Precise, Deadline-driven
                </div>
              </div>

              <div className="rounded-lg bg-muted/40 p-4">
                <div className="text-sm font-semibold text-foreground">Access</div>
                <div className="mt-1 text-sm text-muted-foreground">Daily</div>
              </div>

              <div className="rounded-lg bg-muted/40 p-4">
                <div className="text-sm font-semibold text-foreground">Criticality</div>
                <div className="mt-1 text-sm text-muted-foreground">Very High</div>
              </div>

              <div className="rounded-lg bg-muted/40 p-4">
                <div className="text-sm font-semibold text-foreground">Goal</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {'"Make informed underwriting decisions quickly and accurately"'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnderwriterPage;
