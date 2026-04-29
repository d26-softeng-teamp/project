import { Loader2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { HelpTooltip } from "@/components/HelpTooltip";
import { trpc } from "@/lib/trpc";

const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.5rem",
  color: "var(--color-foreground)",
  fontSize: "0.75rem",
  padding: "0.5rem 0.625rem",
} as const;

function formatAction(action: string) {
  const map: Record<string, string> = {
    upload: "uploaded",
    download: "downloaded",
    edit: "edited",
    delete: "deleted",
  };

  return map[action] ?? action;
}

export function MetricsView() {
  const metrics = trpc.metrics.getOverview.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const recentMetrics = trpc.metrics.getRecent.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const auditSummary = trpc.audit.getSummary.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const auditRecent = trpc.audit.getRecent.useQuery(undefined, {
    refetchInterval: 5000,
  });

  if (metrics.isLoading || auditSummary.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
        <span className="ml-2 text-muted-foreground">Loading metrics...</span>
      </div>
    );
  }

  if (!metrics.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-medium text-red-600">Failed to load metrics.</p>
      </div>
    );
  }

  const errorRate = metrics.data.errorRate ?? 0;

  const activitySummaryData = [
    { name: "Uploads", value: auditSummary.data?.uploads ?? 0 },
    { name: "Downloads", value: auditSummary.data?.downloads ?? 0 },
    { name: "Edits", value: auditSummary.data?.edits ?? 0 },
    { name: "Deletes", value: auditSummary.data?.deletes ?? 0 },
  ];

  const activeUserCounts = new Map<string, number>();
  for (const event of auditRecent.data ?? []) {
    const name = event.user?.name ?? "Unknown User";
    activeUserCounts.set(name, (activeUserCounts.get(name) ?? 0) + 1);
  }

  const topUsersData = Array.from(activeUserCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Requests</p>
            <HelpTooltip
              text="Total number of API requests made to the server since tracking began."
              position="left"
            />
          </div>
          <p className="text-xl font-bold text-foreground">{metrics.data.totalRequests ?? 0}</p>
        </div>

        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Errors</p>
            <HelpTooltip
              text="Total number of failed API requests. High values may indicate system issues."
              position="left"
            />
          </div>
          <p className="text-xl font-bold text-red-600">{metrics.data.errors ?? 0}</p>
        </div>

        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Active Users</p>
            <HelpTooltip
              text="Number of unique users who have made requests recently."
              position="left"
            />
          </div>
          <p className="text-xl font-bold text-hanover-green">{metrics.data.activeUsers ?? 0}</p>
        </div>

        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Error Rate</p>
            <HelpTooltip
              text="Percentage of requests that resulted in an error. Values above 5% warrant investigation."
              position="left"
            />
          </div>
          <p className="text-xl font-bold text-foreground">{(errorRate * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Document Activity</h2>
            <HelpTooltip text="Bar chart showing total uploads, downloads, edits, and deletes across all content." />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activitySummaryData}
                margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
              >
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
                <Bar dataKey="value" fill="#497728" radius={[4, 4, 0, 0]} barSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Top Active Users</h2>
            <HelpTooltip text="The 6 users with the most recent activity. Based on the audit log." />
          </div>
          <div className="h-72">
            {topUsersData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No recent activity.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topUsersData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
                >
                  <CartesianGrid horizontal={false} stroke="var(--color-border)" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--color-muted)" }} />
                  <Bar dataKey="value" fill="#1B2A4A" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
          <HelpTooltip text="The 10 most recent actions taken by users — uploads, edits, downloads, and deletes." />
        </div>

        <div className="divide-y divide-border rounded border border-border bg-card shadow-sm">
          {auditRecent.data?.slice(0, 10).map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-1 p-3 text-sm md:flex-row md:justify-between"
            >
              <div>
                <span className="font-medium text-foreground">
                  {a.user?.name ?? "Unknown User"}
                </span>{" "}
                <span className="text-muted-foreground">
                  {a.user?.employee_code ? `(${a.user.employee_code})` : ""}
                </span>{" "}
                {formatAction(a.action)}{" "}
                <span className="text-muted-foreground">{a.fileName ?? "a document"}</span>
              </div>

              <div className="text-xs text-muted-foreground md:text-right">
                {new Date(a.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">System Performance</h2>
          <HelpTooltip text="The 10 most recent API requests showing route, HTTP method, status, and response time in milliseconds." />
        </div>

        <div className="divide-y divide-border rounded border border-border bg-card shadow-sm">
          <div className="grid grid-cols-[1fr_80px_80px_100px] gap-4 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Route</span>
            <span>Method</span>
            <span className="text-right">Status</span>
            <span className="text-right">Duration</span>
          </div>
          {recentMetrics.data?.slice(0, 10).map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_80px_80px_100px] items-center gap-4 p-3 text-sm"
            >
              <span className="truncate font-mono text-foreground">{r.route}</span>
              <span className="uppercase text-muted-foreground">{r.method}</span>
              <span
                className={`text-right font-medium ${
                  r.status === "OK" ? "text-hanover-green" : "text-red-600"
                }`}
              >
                {r.status}
              </span>
              <span className="text-right text-muted-foreground">{r.durationMs}ms</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
