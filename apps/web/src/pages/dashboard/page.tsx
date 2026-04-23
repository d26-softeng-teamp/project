import { FileText, Loader2, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { trpc } from "@/lib/trpc.ts";

const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.5rem",
  color: "var(--color-foreground)",
  fontSize: "0.75rem",
  padding: "0.5rem 0.625rem",
} as const;

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

function UserDashboardPage() {
  const navigate = useNavigate();
  const profile = trpc.user.myProfile.useQuery();
  const myContent = trpc.content.list.useQuery(
    { owner_id: profile.data?.id },
    { enabled: Boolean(profile.data?.id) },
  );

  if (profile.isLoading || myContent.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
        <span className="ml-2 text-muted-foreground">Loading your dashboard...</span>
      </div>
    );
  }

  const content = myContent.data ?? [];
  const finalized = content.filter((c) => c.document_status === "Finalized");
  const inProgress = content.filter((c) => c.document_status === "in-progress");
  const drafts = content.filter((c) => c.document_status === "Created");

  const stats = [
    { label: "My Total", value: content.length },
    { label: "Drafts", value: drafts.length },
    { label: "In Progress", value: inProgress.length },
    { label: "Finalized", value: finalized.length },
  ];

  const statusBreakdown = [
    { name: "Created", statusValue: "Created", value: drafts.length },
    { name: "In Progress", statusValue: "in-progress", value: inProgress.length },
    { name: "Finalized", statusValue: "Finalized", value: finalized.length },
    {
      name: "Archived",
      statusValue: "Archived",
      value: content.filter((c) => c.document_status === "Archived").length,
    },
  ];

  const pieColors = ["#C9A84C", "#1B2A4A", "#497728", "#9CA3AF"];

  function goToMyContentWithStatus(statusValue: string) {
    navigate(`/hero/content?mine=1&status=${encodeURIComponent(statusValue)}`);
  }

  const recent = [...content]
    .sort((a, b) => {
      const aTime = a.last_modified ? new Date(a.last_modified).getTime() : 0;
      const bTime = b.last_modified ? new Date(b.last_modified).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-muted">
      <div className="py-12">
        <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
              <UserCircle className="h-8 w-8 text-hanover-green" />
              Welcome back{profile.data?.name ? `, ${profile.data.name}` : ""}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Your personal overview of documents and activity.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded border-t-4 border-t-hanover-green bg-card p-6 shadow-sm"
              >
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">My Content By Status</h2>
              {content.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  You haven't created any content yet.
                </p>
              ) : (
                <>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusBreakdown}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          onClick={(data) => {
                            const statusValue = (data as { statusValue?: string })?.statusValue;
                            if (statusValue) goToMyContentWithStatus(statusValue);
                          }}
                        >
                          {statusBreakdown.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={pieColors[index % pieColors.length]}
                              style={{ cursor: entry.value > 0 ? "pointer" : "default" }}
                            />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs">
                    {statusBreakdown.map((entry, index) => (
                      <button
                        key={entry.name}
                        type="button"
                        onClick={() => goToMyContentWithStatus(entry.statusValue)}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: pieColors[index % pieColors.length] }}
                        />
                        <span>
                          {entry.name}: {entry.value}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="rounded bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
              <div className="grid gap-3">
                <Link
                  to="/hero/content/new"
                  className="flex items-center gap-3 rounded border border-border p-4 hover:border-hanover-green hover:bg-muted"
                >
                  <FileText className="h-5 w-5 text-hanover-green" />
                  <div>
                    <div className="font-medium text-foreground">Create New Content</div>
                    <div className="text-xs text-muted-foreground">
                      Start a new document from scratch.
                    </div>
                  </div>
                </Link>
                <Link
                  to="/hero/content"
                  className="flex items-center gap-3 rounded border border-border p-4 hover:border-hanover-green hover:bg-muted"
                >
                  <FileText className="h-5 w-5 text-hanover-green" />
                  <div>
                    <div className="font-medium text-foreground">Browse All Content</div>
                    <div className="text-xs text-muted-foreground">
                      See the full content library.
                    </div>
                  </div>
                </Link>
                <Link
                  to="/account"
                  className="flex items-center gap-3 rounded border border-border p-4 hover:border-hanover-green hover:bg-muted"
                >
                  <UserCircle className="h-5 w-5 text-hanover-green" />
                  <div>
                    <div className="font-medium text-foreground">My Account</div>
                    <div className="text-xs text-muted-foreground">
                      Update your profile settings.
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-foreground">My Recent Content</h2>
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nothing to show yet.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-2 py-3 text-left font-semibold text-foreground">File</th>
                    <th className="px-2 py-3 text-left font-semibold text-foreground">Tags</th>
                    <th className="px-2 py-3 text-left font-semibold text-foreground">Status</th>
                    <th className="px-2 py-3 text-left font-semibold text-foreground">
                      Last Modified
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((item) => (
                    <tr key={item.fileID} className="border-b border-border">
                      <td className="px-2 py-3">
                        <Link
                          to={`/hero/content/${item.fileID}/edit`}
                          className="text-hanover-green hover:underline"
                        >
                          {item.filename ?? item.fileID}
                        </Link>
                      </td>
                      <td className="px-2 py-3">
                        {item.content_tags && item.content_tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.content_tags.map((ct) => (
                              <span
                                key={ct.tag.id}
                                className="inline-flex items-center rounded-full bg-hanover-green/10 px-2 py-0.5 text-xs font-medium text-hanover-green ring-1 ring-hanover-green/30"
                              >
                                {ct.tag.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-semibold ${getStatusBadge(
                            item.document_status,
                          )}`}
                        >
                          {item.document_status ?? "—"}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">
                        {item.last_modified
                          ? new Date(item.last_modified).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboardPage;
