// Canonical content page lives in apps/web/src/pages/content/page.tsx.
// Keep this file in sync with any card-level UI changes made there.
import { Loader2, Lock, Search } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const ROLE_TABS = [
  { key: "all", label: "All Users" },
  { key: "underwriter", label: "Underwriter" },
  { key: "business-analyst", label: "Business Analyst" },
  { key: "actuarial-analyst", label: "Actuarial Analyst" },
  { key: "exl-operations", label: "EXL Operations" },
];

function getStatusBadge(status: string | null) {
  switch (status) {
    case "Finalized":
      return "bg-hanover-green text-white";
    case "Created":
      return "bg-[#C9A84C] text-white";
    case "in-progress":
      return "bg-blue-500 text-white";
    case "Archived":
      return "bg-gray-400 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function matchesOwnerRole(owner: { role: string } | null | undefined, role: string): boolean {
  if (role === "all") return true;
  const r = owner?.role ?? "";
  if (role === "underwriter") return r === "underwriter";
  if (role === "business-analyst") return r === "business-analyst";
  if (role === "actuarial-analyst") return r === "actuarial-analyst";
  if (role === "exl-operations") return r === "exl-operations";
  return false;
}

function AdminContentPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const contents = trpc.content.list.useQuery({
    search,
    document_status: statusFilter || undefined,
    content_type: (typeFilter as "Reference" | "Workflow") || undefined,
  });

  const allItems = contents.data ?? [];
  const filtered = allItems.filter((item) => matchesOwnerRole(item.owner, roleFilter));

  return (
    <div id="admin-content-library" className="scroll-mt-4 border-t border-border/60 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRoleFilter(tab.key)}
                className={`rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                  roleFilter === tab.key
                    ? "bg-hanover-deepblue text-white"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {!contents.isLoading && (
                  <span className="ml-2 text-xs opacity-70">
                    {allItems.filter((item) => matchesOwnerRole(item.owner, tab.key)).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by filename or URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green sm:min-w-40"
            >
              <option value="">All Statuses</option>
              <option value="Created">Created</option>
              <option value="in-progress">In Progress</option>
              <option value="Finalized">Finalized</option>
              <option value="Archived">Archived</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green sm:min-w-40"
            >
              <option value="">All Types</option>
              <option value="Reference">Reference</option>
              <option value="Workflow">Workflow</option>
            </select>
          </div>
        </div>

        {contents.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
            <span className="ml-2 text-muted-foreground">Loading content...</span>
          </div>
        ) : contents.isError ? (
          <div className="mx-auto max-w-lg px-4 py-16 text-center">
            <p className="font-medium text-red-600">Could not load content.</p>
            <p className="mt-2 break-words text-sm text-muted-foreground">
              {contents.error instanceof Error ? contents.error.message : String(contents.error)}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No content found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <div
                key={item.fileID}
                className="group rounded border border-border bg-card p-5 shadow-sm transition-all hover:border-hanover-green hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-hanover-green">
                    {item.filename ?? "Untitled"}
                  </h3>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${getStatusBadge(item.document_status)}`}
                  >
                    {item.document_status ?? "—"}
                  </span>
                </div>
                <p className="mb-1 text-xs text-muted-foreground">
                  {item.content_type ?? "—"} · {item.job_position ?? "—"}
                </p>
                {item.content_tags && item.content_tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {item.content_tags.map((ct) => (
                      <span
                        key={ct.tag.id}
                        className="inline-flex items-center rounded-full bg-hanover-green/10 px-2 py-0.5 text-xs font-medium text-hanover-green ring-1 ring-hanover-green/30"
                      >
                        {ct.tag.name}
                      </span>
                    ))}
                  </div>
                )}
                {item.is_checked_out && (
                  <div className="mb-2 flex items-center gap-1.5 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800">
                    <Lock className="h-3 w-3" />
                    Checked out
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.owner?.name ?? "Unassigned"}</span>
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
  );
}

export default AdminContentPage;
