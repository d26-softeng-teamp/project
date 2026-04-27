import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { trpc } from "@/lib/trpc";

import { capitalizeSplit } from "../../../../../../packages/utils/src/format.ts"

type TrafficRange = "hour" | "day" | "week";

const TRAFFIC_RANGES: { key: TrafficRange; label: string; tickInterval: number }[] = [
  { key: "hour", label: "Hour", tickInterval: 9 },
  { key: "day", label: "Day", tickInterval: 3 },
  { key: "week", label: "Week", tickInterval: 0 },
];

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

  const routePercentiles = trpc.metrics.getRoutePercentiles.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const contentByRoleStatus = trpc.metrics.getContentByRoleStatus.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const [trafficRange, setTrafficRange] = useState<TrafficRange>("hour");
  const requestsOverTime = trpc.metrics.getRequestsOverTime.useQuery(
    { range: trafficRange },
    { refetchInterval: 5000 },
  );
  const trafficRangeConfig = TRAFFIC_RANGES.find((r) => r.key === trafficRange) ?? TRAFFIC_RANGES[0];

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
          <p className="text-sm text-muted-foreground">Total Requests</p>
          <p className="text-xl font-bold text-foreground">{metrics.data.totalRequests ?? 0}</p>
        </div>

        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Errors</p>
          <p className="text-xl font-bold text-red-600">{metrics.data.errors ?? 0}</p>
        </div>

        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Active Users</p>
          <p className="text-xl font-bold text-hanover-green">{metrics.data.activeUsers ?? 0}</p>
        </div>

        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Error Rate</p>
          <p className="text-xl font-bold text-foreground">{(errorRate * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-foreground">Request Traffic</h2>
            <div className="flex gap-1 rounded border border-border bg-muted p-0.5">
              {TRAFFIC_RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setTrafficRange(r.key)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    trafficRange === r.key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={requestsOverTime.data ?? []}
                margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
              >
                <defs>
                  <linearGradient id="requestTrafficFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#497728" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#497728" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  interval={trafficRangeConfig.tickInterval}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--color-muted)" }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#497728"
                  strokeWidth={2}
                  fill="url(#requestTrafficFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold text-foreground">Document Activity</h2>
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
          <h2 className="mb-3 text-xl font-semibold text-foreground">Top Active Users</h2>
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

      <div className="mb-8 grid items-stretch gap-4 lg:grid-cols-2">
        <div className="flex h-full flex-col">
          <h2 className="mb-3 text-xl font-semibold text-foreground">Recent Activity</h2>
          <div className="flex-1 divide-y divide-border overflow-y-auto rounded border border-border bg-card shadow-sm">
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

        <div className="flex h-full flex-col">
          <h2 className="mb-3 text-xl font-semibold leading-7 text-foreground">
            Content by Role × Status
            <span className="ml-3 text-xs font-normal text-muted-foreground">
              Where each team's documents sit in the lifecycle.
            </span>
          </h2>
          <div className="flex-1 overflow-auto rounded border border-border bg-card shadow-sm">
            {contentByRoleStatus.data && contentByRoleStatus.data.length > 0 ? (
              (() => {
                const STATUS_COLS: { key: string; label: string }[] = [
                  { key: "Created", label: "Created" },
                  { key: "in-progress", label: "In Progress" },
                  { key: "Finalized", label: "Finalized" },
                  { key: "Archived", label: "Archived" },
                ];
                const rows = [...contentByRoleStatus.data].sort((a, b) => b.total - a.total);
                const max = Math.max(
                  1,
                  ...rows.flatMap((r) => STATUS_COLS.map((c) => r.counts[c.key] ?? 0)),
                );

                return (
                  <table className="h-full w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Role
                        </th>
                        {STATUS_COLS.map((c) => (
                          <th
                            key={c.key}
                            className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            {c.label}
                          </th>
                        ))}
                        <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.role} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-medium text-foreground">{capitalizeSplit(row.role)}</td>
                          {STATUS_COLS.map((c) => {
                            const v = row.counts[c.key] ?? 0;
                            const intensity = v === 0 ? 0 : 0.1 + (v / max) * 0.5;
                            return (
                              <td
                                key={c.key}
                                className="px-3 py-2 text-right text-foreground"
                                style={{
                                  backgroundColor:
                                    v > 0 ? `rgba(73, 119, 40, ${intensity})` : undefined,
                                }}
                              >
                                {v}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right font-semibold text-foreground">
                            {row.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No content yet.
              </div>
            )}
          </div>
        </div>
      </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-2">

          <div>
            <h2 className="mb-3 text-xl font-semibold text-foreground">System Performance</h2>

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

          <div>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="text-xl font-semibold text-foreground">Latency Percentiles</h2>
              <p className="text-xs text-muted-foreground">
                p95 ≥ 500ms highlighted. Sorted by p95 desc.
              </p>
            </div>
            <div className="divide-y divide-border rounded border border-border bg-card shadow-sm">
              <div className="grid grid-cols-[1fr_60px_70px_70px_70px] gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Route</span>
                <span className="text-right">N</span>
                <span className="text-right">p50</span>
                <span className="text-right">p95</span>
                <span className="text-right">p99</span>
              </div>
              {routePercentiles.data && routePercentiles.data.length > 0 ? (
                  [...routePercentiles.data]
                      .sort((a, b) => b.p95 - a.p95)
                      .slice(0, 10)
                      .map((r) => {
                        const isSlow = r.p95 >= 500;
                        return (
                            <div
                                key={r.route}
                                className="grid grid-cols-[1fr_60px_70px_70px_70px] items-center gap-3 p-3 text-sm"
                            >
                              <span className="truncate font-mono text-foreground">{r.route}</span>
                              <span className="text-right text-muted-foreground">{r.count}</span>
                              <span className="text-right text-muted-foreground">{r.p50}ms</span>
                              <span
                                  className={`text-right font-medium ${
                                      isSlow ? "text-red-600" : "text-foreground"
                                  }`}
                              >
                          {r.p95}ms
                        </span>
                              <span className="text-right text-muted-foreground">{r.p99}ms</span>
                            </div>
                        );
                      })
              ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No route data yet.
                  </div>
              )}
            </div>
          </div>
        </div>
    </>
  );
}
