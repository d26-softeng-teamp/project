import { Activity, LayoutGrid, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
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
import type { RouterOutputs } from "@/lib/trpc.ts";
import { trpc } from "@/lib/trpc.ts";
import { MetricsView } from "@/pages/admin/metrics/page.tsx";

type DashboardTab = "overview" | "metrics";

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
  const finalized = allContent.filter((c) => c.document_status === "Finalized");
  const inProgress = allContent.filter((c) => c.document_status === "in-progress");

  const stats = [
    { label: "Total Employees", value: employees.length },
    { label: "Total Content", value: allContent.length },
    { label: "Finalized", value: finalized.length },
    { label: "In Progress", value: inProgress.length },
  ];

  const contentByStatus = [
    { name: "Created", value: allContent.filter((c) => c.document_status === "Created").length },
    { name: "In Progress", value: inProgress.length },
    { name: "Finalized", value: finalized.length },
    { name: "Archived", value: allContent.filter((c) => c.document_status === "Archived").length },
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

  const pieColors = ["#497728", "#1B2A4A", "#C9A84C", "#9CA3AF"];

  return (
    <>
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
                >
                  {contentByStatus.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {contentByStatus.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: pieColors[index % pieColors.length] }}
                />
                <span>
                  {entry.name}: {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded bg-card p-6 shadow-sm">
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
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-x-auto rounded bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Employees</h2>
          {employees.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No employees yet.</p>
          ) : (
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
          )}
        </div>

        <div className="overflow-x-auto rounded bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Content</h2>
          {allContent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No content yet.</p>
          ) : (
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
                {allContent.slice(0, 6).map((item) => (
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
                        className={`rounded px-2 py-0.5 text-xs font-semibold ${getStatusBadge(item.document_status)}`}
                      >
                        {item.document_status ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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

  const activeTab: DashboardTab = tab === "metrics" && !isAdmin ? "overview" : tab;

  const tabs: { key: DashboardTab; label: string; icon: typeof LayoutGrid }[] = [
    { key: "overview", label: "Overview", icon: LayoutGrid },
    ...(isAdmin ? [{ key: "metrics" as const, label: "Metrics", icon: Activity }] : []),
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
