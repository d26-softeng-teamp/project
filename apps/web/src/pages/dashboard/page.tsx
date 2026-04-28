import { FileText, FileUp, Loader2, PersonStanding, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SwappablePanel } from "@/components/SwappablePanel";
import { trpc } from "@/lib/trpc.ts";
import { normalizeContent } from "@/utils/normalizeContent";
import { formatStatus } from "@/utils/status";
import { renderTag } from "@/utils/tag";

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

  const content = (myContent.data ?? []).map(normalizeContent);
  const finalized = content.filter((c) => c.document_status === "Finalized");
  const inProgress = content.filter((c) => c.document_status === "in-progress");
  const drafts = content.filter((c) => c.document_status === "Created");

  const stats = [
    { label: "My Total", value: content.length, status: null },
    { label: "Drafts", value: drafts.length, status: "Created" },
    { label: "In Progress", value: inProgress.length, status: "in-progress" },
    { label: "Finalized", value: finalized.length, status: "Finalized" },
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

  function goToMyContentWithStatus(statusValue: string | null) {
    navigate(
      statusValue
        ? `/hero/content?mine=1&status=${encodeURIComponent(statusValue)}`
        : "/hero/content?mine=1",
    );
  }

  const recent = [...content]
    .sort((a, b) => {
      const aTime = a.last_modified ? new Date(a.last_modified).getTime() : 0;
      const bTime = b.last_modified ? new Date(b.last_modified).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 6);

  const recentDrafts = [...drafts]
    .sort((a, b) => {
      const aTime = a.last_modified ? new Date(a.last_modified).getTime() : 0;
      const bTime = b.last_modified ? new Date(b.last_modified).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 6);

  const recentFinalized = [...finalized]
    .sort((a, b) => {
      const aTime = a.last_modified ? new Date(a.last_modified).getTime() : 0;
      const bTime = b.last_modified ? new Date(b.last_modified).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 6);

  const tagCounts = new Map<number, { name: string; color?: string; count: number }>();
  for (const item of content) {
    for (const ct of item.content_tags ?? []) {
      const existing = tagCounts.get(ct.tag.id);
      if (existing) {
        existing.count += 1;
      } else {
        tagCounts.set(ct.tag.id, {
          name: ct.tag.name,
          color: ct.tag.color ?? undefined,
          count: 1,
        });
      }
    }
  }
  const topTags = [...tagCounts.values()].sort((a, b) => b.count - a.count).slice(0, 8);

  function renderStatusEmpty() {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        You haven't created any content yet.
      </p>
    );
  }

  function renderStatusLegend() {
    return (
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
    );
  }

  function renderStatusPie() {
    if (content.length === 0) return renderStatusEmpty();
    return (
      <>
        <h2 className="mb-4 text-lg font-semibold text-foreground">My Content By Status</h2>
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
        {renderStatusLegend()}
      </>
    );
  }

  function renderStatusBar() {
    if (content.length === 0) return renderStatusEmpty();
    return (
      <>
        <h2 className="mb-4 text-lg font-semibold text-foreground">My Content By Status</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusBreakdown} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--color-muted)" }} />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                barSize={42}
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
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {renderStatusLegend()}
      </>
    );
  }

  function renderQuickActions() {
    return (
      <>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-3">
          <Link
            to="/hero/content/new"
            className="flex items-center gap-3 rounded border border-border p-4 hover:border-hanover-green hover:bg-muted"
          >
            <FileUp className="h-5 w-5 text-hanover-green" />
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
              <div className="text-xs text-muted-foreground">See the full content library.</div>
            </div>
          </Link>
          <Link
            to="/employees"
            className="flex items-center gap-3 rounded border border-border p-4 hover:border-hanover-green hover:bg-muted"
          >
            <PersonStanding className="h-7 w-5 text-hanover-green" />
            <div>
              <div className="font-medium text-foreground">My Coworkers</div>
              <div className="text-xs text-muted-foreground">Get in touch with your team.</div>
            </div>
          </Link>
          <Link
            to="/account"
            className="flex items-center gap-3 rounded border border-border p-4 hover:border-hanover-green hover:bg-muted"
          >
            <UserCircle className="h-5 w-5 text-hanover-green" />
            <div>
              <div className="font-medium text-foreground">My Account</div>
              <div className="text-xs text-muted-foreground">Update your profile settings.</div>
            </div>
          </Link>
        </div>
      </>
    );
  }

  function renderMyTags() {
    return (
      <>
        <h2 className="mb-4 text-lg font-semibold text-foreground">My Tags</h2>
        {topTags.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            You haven't tagged any content yet.
          </p>
        ) : (
          <ul className="grid gap-2">
            {topTags.map((t) => {
              const styles = renderTag({ id: 0, name: t.name, color: t.color });
              return (
                <li
                  key={t.name}
                  className="flex items-center justify-between rounded border border-border p-3"
                >
                  <span
                    style={{ backgroundColor: styles.bg, color: styles.text }}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  >
                    {t.name}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{t.count}</span>
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  }

  function renderContentTable(rows: typeof recent, title: string) {
    return (
      <>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing to show yet.</p>
        ) : (
          <div className="overflow-x-auto">
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
                {rows.map((item) => (
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
                          {item.content_tags.map((ct) => {
                            const styles = renderTag({
                              ...ct.tag,
                              color: ct.tag.color ?? undefined,
                            });
                            return (
                              <span
                                key={ct.tag.id}
                                style={{ backgroundColor: styles.bg, color: styles.text }}
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                              >
                                {ct.tag.name}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${getStatusBadge(
                          item.document_status ?? null,
                        )}`}
                      >
                        {formatStatus(item.document_status)}
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
          </div>
        )}
      </>
    );
  }

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
              <button
                key={stat.label}
                type="button"
                onClick={() => goToMyContentWithStatus(stat.status)}
                className="group rounded border-t-4 border-t-hanover-green bg-card p-6 text-left shadow-sm transition-colors cursor-pointer hover:border-t-hanover-green/70 hover:bg-hanover-green/5 hover:shadow-md"
              >
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground group-hover:text-hanover-green">
                  {stat.label}
                  <span className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <SwappablePanel
              storageKey="userdash.statusViz"
              options={[
                { key: "pie", label: "Pie", render: renderStatusPie },
                { key: "bar", label: "Bar", render: renderStatusBar },
              ]}
            />
            <SwappablePanel
              storageKey="userdash.side"
              options={[
                { key: "actions", label: "Quick Actions", render: renderQuickActions },
                { key: "tags", label: "My Tags", render: renderMyTags },
              ]}
            />
          </div>

          <SwappablePanel
            storageKey="userdash.bottom"
            options={[
              { key: "recent", label: "Recent", render: () => renderContentTable(recent, "My Recent Content") },
              { key: "drafts", label: "Drafts", render: () => renderContentTable(recentDrafts, "My Drafts") },
              { key: "finalized", label: "Finalized", render: () => renderContentTable(recentFinalized, "My Finalized") },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export default UserDashboardPage;
