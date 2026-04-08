import { FileText, Plus, Search } from "lucide-react";
import { useState } from "react";

type JobPosition = "underwriter" | "business-analyst";
type DocumentStatus = "Created" | "in-progress" | "Finalized" | "Archived";
type ContentType = "Reference" | "Workflow";

interface ContentItem {
  fileID: string;
  filename: string;
  url: string;
  owner: string;
  job_position: JobPosition;
  content_type: ContentType;
  document_status: DocumentStatus;
  last_modified: string;
}

const MOCK_CONTENT: ContentItem[] = [
  {
    fileID: "1",
    filename: "Commercial Auto Underwriting Guidelines",
    url: "/docs/commercial-auto-guidelines",
    owner: "emp1",
    job_position: "underwriter",
    content_type: "Reference",
    document_status: "Finalized",
    last_modified: "2026-03-10",
  },
  {
    fileID: "2",
    filename: "Property Risk Assessment Workflow",
    url: "/docs/property-risk-workflow",
    owner: "emp1",
    job_position: "underwriter",
    content_type: "Workflow",
    document_status: "in-progress",
    last_modified: "2026-03-28",
  },
  {
    fileID: "3",
    filename: "Liability Coverage Reference Sheet",
    url: "/docs/liability-reference",
    owner: "emp1",
    job_position: "underwriter",
    content_type: "Reference",
    document_status: "Finalized",
    last_modified: "2026-02-14",
  },
  {
    fileID: "4",
    filename: "Q1 Business Performance Report",
    url: "/docs/q1-performance",
    owner: "emp2",
    job_position: "business-analyst",
    content_type: "Reference",
    document_status: "Finalized",
    last_modified: "2026-03-20",
  },
  {
    fileID: "5",
    filename: "Claims Analysis Workflow",
    url: "/docs/claims-analysis",
    owner: "emp2",
    job_position: "business-analyst",
    content_type: "Workflow",
    document_status: "Created",
    last_modified: "2026-04-01",
  },
  {
    fileID: "6",
    filename: "Market Trend Analysis 2026",
    url: "/docs/market-trends-2026",
    owner: "emp2",
    job_position: "business-analyst",
    content_type: "Reference",
    document_status: "in-progress",
    last_modified: "2026-04-05",
  },
];

const STATUS_STYLES: Record<DocumentStatus, string> = {
  Finalized: "bg-hanover-green text-white",
  "in-progress": "bg-blue-500 text-white",
  Created: "bg-[#C9A84C] text-white",
  Archived: "bg-gray-400 text-white",
};

const POSITION_LABELS: Record<JobPosition, string> = {
  underwriter: "Underwriter",
  "business-analyst": "Business Analyst",
};

const POSITION_BADGE: Record<JobPosition, string> = {
  underwriter: "bg-hanover-green/10 text-hanover-green",
  "business-analyst": "bg-[#C9A84C]/20 text-[#8a6f28]",
};

function AdminContentPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | JobPosition>("all");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = MOCK_CONTENT.filter((item) => {
    const matchesSearch =
      item.filename.toLowerCase().includes(search.toLowerCase()) ||
      item.url.toLowerCase().includes(search.toLowerCase()) ||
      item.owner.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "all" || item.job_position === roleFilter;

    const matchesStatus = !statusFilter || item.document_status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
                <FileText className="h-8 w-8 text-hanover-green" />
                All Content
              </h1>
              <p className="mt-1 text-muted-foreground">
                Viewing content across all user types
              </p>
            </div>
            <button
              disabled
              className="flex items-center gap-2 rounded bg-hanover-green px-4 py-2.5 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
              title="Coming soon"
            >
              <Plus className="h-4 w-4" />
              New Content
            </button>
          </div>

          {/* Role filter tabs */}
          <div className="mb-6 flex items-center gap-2">
            {(["all", "underwriter", "business-analyst"] as const).map((role) => {
              const label =
                role === "all" ? "All Users" : POSITION_LABELS[role as JobPosition];
              const isActive = roleFilter === role;
              return (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-hanover-deepblue text-white"
                      : "bg-white border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  <span className="ml-2 text-xs opacity-70">
                    {role === "all"
                      ? MOCK_CONTENT.length
                      : MOCK_CONTENT.filter((c) => c.job_position === role).length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + status filter */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by filename, URL, or owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-border bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green"
            >
              <option value="">All Statuses</option>
              <option value="Created">Created</option>
              <option value="in-progress">In Progress</option>
              <option value="Finalized">Finalized</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Content grid */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No content found.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <div
                  key={item.fileID}
                  className="rounded border border-border bg-white p-5 shadow-sm"
                >
                  {/* Title + status */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-foreground leading-snug">
                      {item.filename}
                    </h3>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[item.document_status]}`}
                    >
                      {item.document_status}
                    </span>
                  </div>

                  {/* Type */}
                  <p className="mb-3 text-xs text-muted-foreground">
                    {item.content_type}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${POSITION_BADGE[item.job_position]}`}
                    >
                      {POSITION_LABELS[item.job_position]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.last_modified).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminContentPage;
