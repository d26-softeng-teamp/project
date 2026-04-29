import { Activity, LayoutGrid, Loader2, Tag } from "lucide-react";
import { useState } from "react";
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
import type { RouterOutputs } from "@/lib/trpc.ts";
import { trpc } from "@/lib/trpc.ts";
import { MetricsView } from "@/pages/admin/metrics/page.tsx";
import TagsPage from "@/pages/tags/TagsPage";
import { formatStatus } from "@/utils/status";
import { renderTag } from "@/utils/tag";

type DashboardTab = "overview" | "metrics" | "tags";

type EmployeeRow = RouterOutputs["employee"]["list"][number];
type ContentRow = RouterOutputs["content"]["list"][number];

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

function DashboardLoaded({
  employees,
  allContent,
}: {
  employees: EmployeeRow[];
  allContent: ContentRow[];
}) {
  const navigate = useNavigate();
  const finalized = allContent.filter((c) => c.document_status === "Finalized");
  const inProgress = allContent.filter((c) => c.document_status === "in-progress");
  const drafts = allContent.filter((c) => c.document_status === "Created");

  const stats = [
    { label: "Total Employees", value: employees.length, href: "/employees" },
    { label: "Total Content", value: allContent.length, href: "/hero/content" },
    { label: "Finalized", value: finalized.length, href: "/hero/content?status=Finalized" },
    { label: "In Progress", value: inProgress.length, href: "/hero/content?status=in-progress" },
  ];

  const contentByStatus = [
    {
      name: "Created",
      statusValue: "Created",
      value: drafts.length,
    },
    { name: "In Progress", statusValue: "in-progress", value: inProgress.length },
    { name: "Finalized", statusValue: "Finalized", value: finalized.length },
    {
      name: "Archived",
      statusValue: "Archived",
      value: allContent.filter((c) => c.document_status === "Archived").length,
    },
  ];

  const roleCounts = new Map<string, number>();
  for (const item of allContent) {
    const role = item.job_position?.trim() || "unassigned";
    roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
  }

  const contentByRole = Array.from(roleCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const tagCounts = new Map<number, { name: string; color?: string; count: number }>();
  for (const item of allContent) {
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

  const pieColors = ["#C9A84C", "#1B2A4A", "#497728", "#9CA3AF"];
  const rolePieColors = ["#1B2A4A", "#497728", "#C9A84C", "#9CA3AF", "#7C5BA8", "#3F8CB5"];

  function goToContentWithStatus(statusValue: string | null) {
    navigate(
      statusValue ? `/hero/content?status=${encodeURIComponent(statusValue)}` : "/hero/content",
    );
  }

  function renderStatusLegend() {
    return (
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        {contentByStatus.map((entry, index) => (
          <button
            key={entry.name}
            type="button"
            onClick={() => goToContentWithStatus(entry.statusValue)}
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

  function renderContentByStatusPie() {
    return (
      <>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Content By Status</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={contentByStatus}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                onClick={(data) => {
                  const statusValue = (data as { statusValue?: string })?.statusValue;
                  if (statusValue) goToContentWithStatus(statusValue);
                }}
              >
                {contentByStatus.map((entry, index) => (
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

  function renderContentByStatusBar() {
    return (
      <>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Content By Status</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contentByStatus} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
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
                  if (statusValue) goToContentWithStatus(statusValue);
                }}
              >
                {contentByStatus.map((entry, index) => (
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

  function renderTopRolesBar() {
    return (
      <>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Top Roles By Content</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contentByRole} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
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
              <Bar dataKey="value" fill="#1B2A4A" radius={[4, 4, 0, 0]} barSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>
    );
  }

  function renderTopRolesPie() {
    return (
      <>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Top Roles By Content</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={contentByRole}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
              >
                {contentByRole.map((entry, index) => (
                  <Cell key={entry.name} fill={rolePieColors[index % rolePieColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          {contentByRole.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2 text-muted-foreground">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: rolePieColors[index % rolePieColors.length] }}
              />
              <span>
                {entry.name}: {entry.value}
              </span>
            </div>
          ))}
        </div>
      </>
    );
  }

  function renderEmployees() {
    return (
      <>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Employees</h2>
        {employees.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No employees yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-3 text-left font-semibold text-foreground">Code</th>
                  <th className="px-2 py-3 text-left font-semibold text-foreground">Name</th>
                  <th className="px-2 py-3 text-left font-semibold text-foreground">Job</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice(0, 6).map((emp) => (
                  <tr key={emp.id} className="border-b border-border">
                    <td className="px-2 py-3 font-mono text-xs text-muted-foreground">
                      {emp.employee_code ?? "—"}
                    </td>
                    <td className="px-2 py-3">
                      <Link
                        to={`/employees/${emp.id}`}
                        className="text-hanover-green hover:underline"
                      >
                        {emp.name}
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">{emp.job_desc ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  }

  function renderTopTags() {
    return (
      <>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Top Tags</h2>
        {topTags.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No tags yet.</p>
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

  function renderContentTable(rows: ContentRow[], title: string) {
    return (
      <>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No content yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-3 text-left font-semibold text-foreground">File</th>
                  <th className="px-2 py-3 text-left font-semibold text-foreground">Owner</th>
                  <th className="px-2 py-3 text-left font-semibold text-foreground">Tags</th>
                  <th className="px-2 py-3 text-left font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 6).map((item) => (
                  <tr key={item.fileID} className="border-b border-border">
                    <td className="px-2 py-3">
                      <Link
                        to={`/hero/content/${item.fileID}/edit`}
                        className="text-hanover-green hover:underline"
                      >
                        {item.filename ?? item.fileID}
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {item.owner?.name ?? "Unassigned"}
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
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${getStatusBadge(item.document_status)}`}
                      >
                        {formatStatus(item.document_status)}
                      </span>
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
    <>
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => navigate(stat.href)}
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
          storageKey="admindash.statusViz"
          options={[
            { key: "pie", label: "Pie", render: renderContentByStatusPie },
            { key: "bar", label: "Bar", render: renderContentByStatusBar },
          ]}
        />
        <SwappablePanel
          storageKey="admindash.rolesViz"
          options={[
            { key: "bar", label: "Bar", render: renderTopRolesBar },
            { key: "pie", label: "Pie", render: renderTopRolesPie },
          ]}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SwappablePanel
          storageKey="admindash.left"
          options={[
            { key: "employees", label: "Employees", render: renderEmployees },
            { key: "tags", label: "Top Tags", render: renderTopTags },
          ]}
        />
        <SwappablePanel
          storageKey="admindash.right"
          options={[
            {
              key: "recent",
              label: "Recent",
              render: () => renderContentTable(allContent, "Recent Content"),
            },
            {
              key: "drafts",
              label: "Drafts",
              render: () => renderContentTable(drafts, "Drafts"),
            },
            {
              key: "finalized",
              label: "Finalized",
              render: () => renderContentTable(finalized, "Finalized"),
            },
          ]}
        />
      </div>
    </>
  );
}

function DashboardPage() {
  const [tab, setTab] = useState<DashboardTab>("overview");

  const access = trpc.user.myAccess.useQuery();
  const isAdmin = access.data?.role === "admin";

  const employees = trpc.employee.list.useQuery({}, { enabled: tab === "overview" });
  const allContent = trpc.content.list.useQuery({}, { enabled: tab === "overview" });

  const isLoading = tab === "overview" && (employees.isLoading || allContent.isLoading);
  const loadError = tab === "overview" ? (employees.error ?? allContent.error) : null;

  const activeTab: DashboardTab =
    (tab === "metrics" || tab === "tags") && !isAdmin ? "overview" : tab;

  const tabs: { key: DashboardTab; label: string; icon: typeof LayoutGrid }[] = [
    { key: "overview", label: "Overview", icon: LayoutGrid },
    ...(isAdmin ? [{ key: "metrics" as const, label: "Metrics", icon: Activity }] : []),
    ...(isAdmin ? [{ key: "tags" as const, label: "Tags", icon: Tag }] : []),
  ];

  return (
    <div className="min-h-screen bg-muted">
      <div className="py-12">
        <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
              <LayoutGrid className="h-8 w-8 text-hanover-green" />
              Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              {activeTab === "metrics"
                ? "System and document activity metrics"
                : activeTab === "tags"
                  ? "Manage content tags"
                  : "Overview of employees, content, and activity trends"}
            </p>
          </div>

          {tabs.length > 1 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {tabs.map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-2 rounded px-4 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-hanover-deepblue text-white"
                        : "border border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === "metrics" ? (
            <MetricsView />
          ) : activeTab === "tags" ? (
            <TagsPage />
          ) : isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
              <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
            </div>
          ) : loadError ? (
            <div className="mx-auto max-w-lg py-16 text-center">
              <p className="font-medium text-red-600">Could not load dashboard data.</p>
              <p className="mt-2 wrap-break-word text-sm text-muted-foreground">
                {loadError instanceof Error ? loadError.message : String(loadError)}
              </p>
            </div>
          ) : (
            <DashboardLoaded employees={employees.data ?? []} allContent={allContent.data ?? []} />
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
