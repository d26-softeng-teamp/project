import { FileText, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const STATUS_STYLES: Record<string, string> = {
  Finalized: "bg-hanover-green text-white",
  "in-progress": "bg-blue-500 text-white",
  Created: "bg-[#C9A84C] text-white",
  Archived: "bg-gray-400 text-white",
};

const ROLE_TABS = [
  { key: "all", label: "All Users" },
  { key: "underwriter", label: "Underwriter" },
  { key: "business-analyst", label: "Business Analyst" },
];

function matchesRole(jobPosition: string | null, role: string): boolean {
  if (role === "all") return true;
  const pos = jobPosition?.toLowerCase() ?? "";
  if (role === "underwriter") return pos.includes("underwriter");
  if (role === "business-analyst") return pos.includes("business") || pos.includes("analyst");
  return false;
}

function AdminContentPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");

  const contents = trpc.content.list.useQuery({
    search,
    document_status: statusFilter || undefined,
  });

  const allItems = contents.data ?? [];
  const filtered = allItems.filter((item) => matchesRole(item.job_position, roleFilter));

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
              <FileText className="h-8 w-8 text-hanover-green" />
              All Content
            </h1>
            <p className="mt-1 text-muted-foreground">Viewing content across all user types</p>
          </div>

          {/* Role filter tabs */}
          <div className="mb-6 flex items-center gap-2">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRoleFilter(tab.key)}
                className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                  roleFilter === tab.key
                    ? "bg-hanover-deepblue text-white"
                    : "border border-border bg-white text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {!contents.isLoading && (
                  <span className="ml-2 text-xs opacity-70">
                    {allItems.filter((item) => matchesRole(item.job_position, tab.key)).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search + status filter */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by filename or URL..."
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

          {/* Content */}
          {contents.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
              <span className="ml-2 text-muted-foreground">Loading content...</span>
            </div>
          ) : contents.isError ? (
            <div className="py-16 text-center text-red-600">
              Failed to load content. Is the API running?
            </div>
          ) : filtered.length === 0 ? (
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
                    <h3 className="text-base font-semibold leading-snug text-foreground">
                      {item.filename ?? "Untitled"}
                    </h3>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[item.document_status ?? ""] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {item.document_status ?? "—"}
                    </span>
                  </div>

                  {/* Type + position */}
                  <p className="mb-3 text-xs text-muted-foreground">
                    {item.content_type ?? "—"} · {item.job_position ?? "—"}
                  </p>

                  {/* Footer — owner + date */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {item.employee?.employee_name ?? item.content_owner ?? "Unassigned"}
                    </span>
                    <span>
                      {item.last_modified ? new Date(item.last_modified).toLocaleDateString() : "—"}
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
