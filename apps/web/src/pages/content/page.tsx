import { FileText, Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/lib/trpc.ts";

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

function ContentListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const contents = trpc.content.list.useQuery({
    search,
    document_status: status || undefined,
  });

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
                <FileText className="h-8 w-8 text-hanover-green" />
                Content
              </h1>
              <p className="mt-1 text-muted-foreground">
                Documents, guides, and knowledge base articles
              </p>
            </div>
            <Link
              to="/content/new"
              className="flex items-center gap-2 rounded bg-hanover-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hanover-green/90"
            >
              <Plus className="h-4 w-4" />
              New Content
            </Link>
          </div>

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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded border border-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green"
            >
              <option value="">All Statuses</option>
              <option value="Created">Created</option>
              <option value="in-progress">In Progress</option>
              <option value="Finalized">Finalized</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {contents.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
              <span className="ml-2 text-muted-foreground">Loading content...</span>
            </div>
          ) : contents.isError ? (
            <div className="py-16 text-center text-red-600">
              Failed to load content. Is the API running?
            </div>
          ) : contents.data?.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No content found.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contents.data?.map((item) => (
                <Link
                  key={item.fileID}
                  to={`/content/${item.fileID}/edit`}
                  className="group rounded border border-border bg-white p-5 shadow-sm transition-all hover:border-hanover-green hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="text-base font-semibold text-foreground group-hover:text-hanover-green">
                      {item.filename ?? "Untitled"}
                    </h3>
                    <span
                      className={`ml-2 shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${getStatusBadge(item.document_status)}`}
                    >
                      {item.document_status ?? "—"}
                    </span>
                  </div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {item.content_type ?? "—"} · {item.job_position ?? "—"}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.employee?.employee_name ?? "Unassigned"}</span>
                    <span>
                      {item.last_modified ? new Date(item.last_modified).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContentListPage;
