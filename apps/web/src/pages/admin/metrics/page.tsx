import { InfoPopover } from "@myapp/ui/components/info-popover";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RouterOutputs } from "@/lib/trpc";
import { trpc } from "@/lib/trpc";

const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.5rem",
  color: "var(--color-foreground)",
  fontSize: "0.75rem",
  padding: "0.5rem 0.625rem",
} as const;

type ContentRow = RouterOutputs["content"]["list"][number];
type AuditEventRow = RouterOutputs["audit"]["getRecent"][number];

type ReportGroupRow = {
  owner: string;
  role: string;
  total: number;
  current: number;
  stale: number;
  missingDates: number;
  expired: number;
  expiringSoon: number;
  reviewOverdue: number;
  reviewSoon: number;
  nextExpiration: Date | null;
  nextReview: Date | null;
};

type ActivityReportRow = {
  owner: string;
  role: string;
  uploads: number;
  views: number;
  downloads: number;
  edits: number;
  deletes: number;
  ownershipUpdates: number;
  other: number;
  total: number;
  latestAt: Date | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const REVIEW_WINDOW_DAYS = 30;
const STALE_AFTER_DAYS = 180;

function formatAction(action: string) {
  const map: Record<string, string> = {
    upload: "uploaded",
    view: "viewed",
    download: "downloaded",
    edit: "edited",
    delete: "deleted",
    "ownership-update": "updated ownership for",
  };

  return map[action] ?? action;
}

function LabelWithInfo({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <InfoPopover title={title}>{children}</InfoPopover>
    </span>
  );
}

function formatRole(role?: string | null) {
  const value = role?.trim();
  if (!value) return "Unassigned";
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isBefore(date: Date | null, threshold: Date) {
  return Boolean(date && date.getTime() < threshold.getTime());
}

function isWithinDays(date: Date | null, threshold: Date, days: number) {
  if (!date) return false;
  const diff = date.getTime() - threshold.getTime();
  return diff >= 0 && diff <= days * DAY_MS;
}

function earliestFutureDate(current: Date | null, candidate: Date | null, threshold: Date) {
  if (!candidate || candidate.getTime() < threshold.getTime()) return current;
  if (!current || candidate.getTime() < current.getTime()) return candidate;
  return current;
}

function formatDate(value: Date | string | null | undefined) {
  const date = toDate(value);
  return date ? date.toLocaleDateString() : "-";
}

function ownerNameForContent(item: ContentRow) {
  return item.owner?.name?.trim() || "Unassigned";
}

function roleForContent(item: ContentRow) {
  return formatRole(item.owner?.role ?? item.job_position);
}

function groupKey(owner: string, role: string) {
  return `${owner}\u0000${role}`;
}

function sortedRows<T extends { total: number; owner: string; role: string }>(rows: T[]) {
  return rows.sort(
    (a, b) => b.total - a.total || a.owner.localeCompare(b.owner) || a.role.localeCompare(b.role),
  );
}

function getOrCreateReportGroup(groups: Map<string, ReportGroupRow>, owner: string, role: string) {
  const key = groupKey(owner, role);
  let row = groups.get(key);
  if (!row) {
    row = {
      owner,
      role,
      total: 0,
      current: 0,
      stale: 0,
      missingDates: 0,
      expired: 0,
      expiringSoon: 0,
      reviewOverdue: 0,
      reviewSoon: 0,
      nextExpiration: null,
      nextReview: null,
    };
    groups.set(key, row);
  }
  return row;
}

function contentDateReport(item: ContentRow, today: Date, staleBefore: Date) {
  const expirationDate = toDate(item.expiration_date);
  const reviewDate = toDate(item.next_review_date);
  const modifiedDate = toDate(item.last_modified);
  const expired = isBefore(expirationDate, today);
  const reviewOverdue = isBefore(reviewDate, today);
  const stale = isBefore(modifiedDate, staleBefore);

  return {
    expirationDate,
    reviewDate,
    current: Boolean(expirationDate && reviewDate && !expired && !reviewOverdue && !stale),
    stale,
    missingDates: !expirationDate || !reviewDate,
    expired,
    expiringSoon: isWithinDays(expirationDate, today, REVIEW_WINDOW_DAYS),
    reviewOverdue,
    reviewSoon: isWithinDays(reviewDate, today, REVIEW_WINDOW_DAYS),
  };
}

export function buildContentReportRows(content: ContentRow[]) {
  const today = startOfToday();
  const staleBefore = new Date(today.getTime() - STALE_AFTER_DAYS * DAY_MS);
  const groups = new Map<string, ReportGroupRow>();

  for (const item of content) {
    const owner = ownerNameForContent(item);
    const role = roleForContent(item);
    const row = getOrCreateReportGroup(groups, owner, role);

    const report = contentDateReport(item, today, staleBefore);

    row.total += 1;
    row.current += Number(report.current);
    row.stale += Number(report.stale);
    row.missingDates += Number(report.missingDates);
    row.expired += Number(report.expired);
    row.expiringSoon += Number(report.expiringSoon);
    row.reviewOverdue += Number(report.reviewOverdue);
    row.reviewSoon += Number(report.reviewSoon);
    row.nextExpiration = earliestFutureDate(row.nextExpiration, report.expirationDate, today);
    row.nextReview = earliestFutureDate(row.nextReview, report.reviewDate, today);
  }

  return sortedRows(Array.from(groups.values()));
}

function getEventOwnerAndRole(event: AuditEventRow, contentByFilename: Map<string, ContentRow>) {
  const enriched = event as AuditEventRow & {
    owner?: { name?: string | null; role?: string | null } | null;
    ownerName?: string | null;
    ownerRole?: string | null;
    role?: string | null;
    job_position?: string | null;
  };
  const relatedContent = event.fileName ? contentByFilename.get(event.fileName) : undefined;
  const owner =
    enriched.owner?.name?.trim() ||
    enriched.ownerName?.trim() ||
    (relatedContent ? ownerNameForContent(relatedContent) : event.user?.name?.trim()) ||
    "Unknown User";

  return {
    owner,
    role: formatRole(
      enriched.owner?.role ??
        enriched.ownerRole ??
        enriched.role ??
        enriched.job_position ??
        relatedContent?.owner?.role ??
        relatedContent?.job_position,
    ),
  };
}

function getOrCreateActivityGroup(
  groups: Map<string, ActivityReportRow>,
  owner: string,
  role: string,
) {
  const key = groupKey(owner, role);
  let row = groups.get(key);
  if (!row) {
    row = {
      owner,
      role,
      uploads: 0,
      views: 0,
      downloads: 0,
      edits: 0,
      deletes: 0,
      ownershipUpdates: 0,
      other: 0,
      total: 0,
      latestAt: null,
    };
    groups.set(key, row);
  }
  return row;
}

export function buildActivityReportRows(auditEvents: AuditEventRow[], content: ContentRow[]) {
  const contentByFilename = new Map(
    content.flatMap((item) => (item.filename ? [[item.filename, item] as const] : [])),
  );
  const groups = new Map<string, ActivityReportRow>();

  for (const event of auditEvents) {
    const { owner, role } = getEventOwnerAndRole(event, contentByFilename);
    const row = getOrCreateActivityGroup(groups, owner, role);
    const createdAt = toDate(event.createdAt);

    row.total += 1;
    if (event.action === "upload") row.uploads += 1;
    else if (event.action === "view") row.views += 1;
    else if (event.action === "download") row.downloads += 1;
    else if (event.action === "edit") row.edits += 1;
    else if (event.action === "delete") row.deletes += 1;
    else if (event.action === "ownership-update") row.ownershipUpdates += 1;
    else row.other += 1;

    if (createdAt && (!row.latestAt || createdAt.getTime() > row.latestAt.getTime())) {
      row.latestAt = createdAt;
    }
  }

  return sortedRows(Array.from(groups.values()));
}

export function DashboardReports({
  content,
  auditEvents,
}: {
  content: ContentRow[];
  auditEvents: AuditEventRow[];
}) {
  const contentRows = buildContentReportRows(content);
  const activityRows = buildActivityReportRows(auditEvents, content);
  const currentCount = contentRows.reduce((sum, row) => sum + row.current, 0);
  const staleCount = contentRows.reduce((sum, row) => sum + row.stale, 0);
  const expiredCount = contentRows.reduce((sum, row) => sum + row.expired, 0);
  const reviewDueCount = contentRows.reduce(
    (sum, row) => sum + row.reviewOverdue + row.reviewSoon,
    0,
  );

  return (
    <div className="mb-8 space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            <LabelWithInfo label="Current Content" title="Current Content">
              Records with expiration and review dates that are not expired, review overdue, or
              stale.
            </LabelWithInfo>
          </p>
          <p className="text-2xl font-bold text-hanover-green">{currentCount}</p>
        </div>
        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            <LabelWithInfo label="Stale Content" title="Stale Content">
              Records whose last modified date is older than 180 days.
            </LabelWithInfo>
          </p>
          <p className="text-2xl font-bold text-foreground">{staleCount}</p>
        </div>
        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            <LabelWithInfo label="Expired" title="Expired Content">
              Records with expiration dates before today.
            </LabelWithInfo>
          </p>
          <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
        </div>
        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            <LabelWithInfo label="Review Due" title="Review Due">
              Records with overdue review dates or review dates in the next 30 days.
            </LabelWithInfo>
          </p>
          <p className="text-2xl font-bold text-[#9A6B00]">{reviewDueCount}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="overflow-x-auto rounded border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-foreground">
            Transactions By Owner And Role
            <InfoPopover title="Transactions By Owner And Role">
              Audit transactions grouped by content owner and role.
            </InfoPopover>
          </h2>
          {activityRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No recent transaction activity.
            </p>
          ) : (
            <table className="w-full min-w-180 text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-3 text-left font-semibold text-foreground">Owner</th>
                  <th className="px-2 py-3 text-left font-semibold text-foreground">Role</th>
                  <th className="px-2 py-3 text-right font-semibold text-foreground">Total</th>
                  <th className="px-2 py-3 text-right font-semibold text-foreground">Uploads</th>
                  <th className="px-2 py-3 text-right font-semibold text-foreground">Views</th>
                  <th className="px-2 py-3 text-right font-semibold text-foreground">Downloads</th>
                  <th className="px-2 py-3 text-right font-semibold text-foreground">Edits</th>
                  <th className="px-2 py-3 text-right font-semibold text-foreground">
                    Owner Changes
                  </th>
                  <th className="px-2 py-3 text-right font-semibold text-foreground">Latest</th>
                </tr>
              </thead>
              <tbody>
                {activityRows.slice(0, 8).map((row) => (
                  <tr key={groupKey(row.owner, row.role)} className="border-b border-border">
                    <td className="px-2 py-3 text-foreground">{row.owner}</td>
                    <td className="px-2 py-3 text-muted-foreground">{row.role}</td>
                    <td className="px-2 py-3 text-right font-medium text-foreground">
                      {row.total}
                    </td>
                    <td className="px-2 py-3 text-right text-muted-foreground">{row.uploads}</td>
                    <td className="px-2 py-3 text-right text-muted-foreground">{row.views}</td>
                    <td className="px-2 py-3 text-right text-muted-foreground">{row.downloads}</td>
                    <td className="px-2 py-3 text-right text-muted-foreground">{row.edits}</td>
                    <td className="px-2 py-3 text-right text-muted-foreground">
                      {row.ownershipUpdates}
                    </td>
                    <td className="px-2 py-3 text-right text-muted-foreground">
                      {formatDate(row.latestAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="overflow-x-auto rounded border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-foreground">
            Content Currency By Owner And Role
            <InfoPopover title="Content Currency By Owner And Role">
              Current, stale, missing-date, and expired records grouped by owner and role.
            </InfoPopover>
          </h2>
          {contentRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No content records.</p>
          ) : (
            <table className="w-full min-w-170 text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-3 text-left font-semibold text-foreground">Owner</th>
                  <th className="px-2 py-3 text-left font-semibold text-foreground">Role</th>
                  <th className="px-2 py-3 text-right font-semibold text-foreground">Total</th>
                  <th className="px-2 py-3 text-right font-semibold text-foreground">Current</th>
                  <th className="px-2 py-3 text-right font-semibold text-foreground">Stale</th>
                  <th className="px-2 py-3 text-right font-semibold text-foreground">
                    Missing Dates
                  </th>
                  <th className="px-2 py-3 text-right font-semibold text-foreground">Expired</th>
                </tr>
              </thead>
              <tbody>
                {contentRows.slice(0, 8).map((row) => (
                  <tr key={groupKey(row.owner, row.role)} className="border-b border-border">
                    <td className="px-2 py-3 text-foreground">{row.owner}</td>
                    <td className="px-2 py-3 text-muted-foreground">{row.role}</td>
                    <td className="px-2 py-3 text-right font-medium text-foreground">
                      {row.total}
                    </td>
                    <td className="px-2 py-3 text-right text-hanover-green">{row.current}</td>
                    <td className="px-2 py-3 text-right text-muted-foreground">{row.stale}</td>
                    <td className="px-2 py-3 text-right text-muted-foreground">
                      {row.missingDates}
                    </td>
                    <td className="px-2 py-3 text-right text-red-600">{row.expired}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-foreground">
          Expiration And Review Dates By Owner And Role
          <InfoPopover title="Expiration And Review Dates">
            Upcoming and overdue expiration and review dates grouped by owner and role.
          </InfoPopover>
        </h2>
        {contentRows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No expiration or review dates.
          </p>
        ) : (
          <table className="w-full min-w-205 text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-3 text-left font-semibold text-foreground">Owner</th>
                <th className="px-2 py-3 text-left font-semibold text-foreground">Role</th>
                <th className="px-2 py-3 text-right font-semibold text-foreground">Expired</th>
                <th className="px-2 py-3 text-right font-semibold text-foreground">Expires 30d</th>
                <th className="px-2 py-3 text-right font-semibold text-foreground">
                  Review Overdue
                </th>
                <th className="px-2 py-3 text-right font-semibold text-foreground">Review 30d</th>
                <th className="px-2 py-3 text-right font-semibold text-foreground">
                  Next Expiration
                </th>
                <th className="px-2 py-3 text-right font-semibold text-foreground">Next Review</th>
              </tr>
            </thead>
            <tbody>
              {contentRows.slice(0, 10).map((row) => (
                <tr key={groupKey(row.owner, row.role)} className="border-b border-border">
                  <td className="px-2 py-3 text-foreground">{row.owner}</td>
                  <td className="px-2 py-3 text-muted-foreground">{row.role}</td>
                  <td className="px-2 py-3 text-right text-red-600">{row.expired}</td>
                  <td className="px-2 py-3 text-right text-muted-foreground">{row.expiringSoon}</td>
                  <td className="px-2 py-3 text-right text-red-600">{row.reviewOverdue}</td>
                  <td className="px-2 py-3 text-right text-muted-foreground">{row.reviewSoon}</td>
                  <td className="px-2 py-3 text-right text-muted-foreground">
                    {formatDate(row.nextExpiration)}
                  </td>
                  <td className="px-2 py-3 text-right text-muted-foreground">
                    {formatDate(row.nextReview)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
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

  const content = trpc.content.list.useQuery(
    {},
    {
      refetchInterval: 30000,
    },
  );

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
    { name: "Views", value: auditSummary.data?.views ?? 0 },
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
      <div className="mb-8 grid grid-cols-2 gap-4 stagger-children md:grid-cols-4">
        {[
          {
            label: "Requests",
            value: metrics.data.totalRequests ?? 0,
            info: "Total API requests captured by the metrics middleware.",
          },
          {
            label: "Errors",
            value: metrics.data.errors ?? 0,
            info: "API requests recorded with an error status.",
          },
          {
            label: "Active Users",
            value: metrics.data.activeUsers ?? 0,
            info: "Distinct users represented in recent metrics events.",
          },
          {
            label: "Error Rate",
            value: `${(errorRate * 100).toFixed(2)}%`,
            info: "Percentage of tracked requests that resulted in an error.",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border border-t-4 border-t-hanover-green bg-card p-4 shadow-sm hover:shadow-md hover:border-t-hanover-green/90 sm:p-5"
          >
            <div className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>{stat.label}</span>
              <InfoPopover title={stat.label}>{stat.info}</InfoPopover>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-foreground">
            Document Activity
            <InfoPopover title="Document Activity">
              Upload, view, download, edit, and delete audit counts.
            </InfoPopover>
          </h2>
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
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-foreground">
            Top Active Users
            <InfoPopover title="Top Active Users">
              Users with the most recent document activity events.
            </InfoPopover>
          </h2>
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

      <DashboardReports content={content.data ?? []} auditEvents={auditRecent.data ?? []} />

      <div className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-foreground">Recent Activity</h2>

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
    </>
  );
}
