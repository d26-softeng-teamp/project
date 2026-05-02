import { InfoPopover } from "@myapp/ui/components/info-popover";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  FilePlus2,
  HelpCircle,
  Inbox,
  LayoutGrid,
  Loader2,
  type LucideIcon,
  Megaphone,
  ShieldCheck,
  Tag as TagIcon,
  UserCircle2,
} from "lucide-react";
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
import { useSession } from "@/auth/session-context";
import type { RouterOutputs } from "@/lib/trpc.ts";
import { trpc } from "@/lib/trpc.ts";
import { DashboardReports, MetricsView } from "@/pages/admin/metrics/page.tsx";
import { TodayStrip } from "@/pages/dashboard/components/TodayStrip";
import { SwappableLayout } from "@/pages/dashboard/SwappableLayout";
import TagsPage from "@/pages/tags/TagsPage";
import { type DashboardTab, useAppPreferences } from "@/store/app-preferences";
import { formatStatus } from "@/utils/status";
import { renderTag } from "@/utils/tag";

type EmployeeRow = RouterOutputs["employee"]["list"][number];
type ContentRow = RouterOutputs["content"]["list"][number];
type AuditEventRow = RouterOutputs["audit"]["getRecent"][number];

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

function normalizeRole(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .trim();
}

function formatRoleLabel(value?: string | null) {
  const role = normalizeRole(value);
  if (!role) return "Unassigned";
  return role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type QuickLink = {
  label: string;
  to: string;
  icon: LucideIcon;
  description: string;
};

const COMMON_QUICK_LINKS: QuickLink[] = [
  {
    label: "Create Content",
    to: "/hero/content/new",
    icon: FilePlus2,
    description: "Start a new content record.",
  },
  {
    label: "Calendar",
    to: "/calendar",
    icon: CalendarDays,
    description: "Review dates and expirations.",
  },
  {
    label: "Announcements",
    to: "/announcements",
    icon: Megaphone,
    description: "Updates from administrators.",
  },
  {
    label: "Activity",
    to: "/activity",
    icon: Inbox,
    description: "Edits and ownership changes.",
  },
  {
    label: "My Account",
    to: "/account",
    icon: UserCircle2,
    description: "Profile and preferences.",
  },
  {
    label: "Help",
    to: "/help",
    icon: HelpCircle,
    description: "Guides and FAQs.",
  },
];

const ROLE_QUICK_LINKS: Record<string, QuickLink[]> = {
  "business-analyst": [
    {
      label: "BA Workspace",
      to: "/business-analyst",
      icon: ShieldCheck,
      description: "Your business analyst tools.",
    },
  ],
  underwriter: [
    {
      label: "Underwriter Workspace",
      to: "/underwriter",
      icon: ShieldCheck,
      description: "Your underwriter tools.",
    },
  ],
};

function QuickLinksCard({ role }: { role: string }) {
  const roleSpecific = ROLE_QUICK_LINKS[role] ?? [];
  const links = [...roleSpecific, ...COMMON_QUICK_LINKS];

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">Quick Links</h2>
        <InfoPopover title="Quick Links">
          Frequent destinations tailored to your role. Click any tab to jump to that area.
        </InfoPopover>
      </div>
      <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              to={link.to}
              title={link.description}
              className="group flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-hanover-green/40 hover:bg-hanover-green/6 hover:text-hanover-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hanover-green/40 focus-visible:ring-offset-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-foreground transition-colors group-hover:bg-hanover-green/15 group-hover:text-hanover-green">
                <Icon className="h-5 w-5" />
              </span>
              <span className="truncate">{link.label}</span>
              <span className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
                →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DashboardLoaded({
  employees,
  allContent,
  auditEvents,
  isAdmin,
  userRole,
  userId,
  unreadAnnouncements,
}: {
  employees: EmployeeRow[];
  allContent: ContentRow[];
  auditEvents: AuditEventRow[];
  isAdmin: boolean;
  userRole?: string | null;
  userId?: string;
  unreadAnnouncements: number;
}) {
  const roleKey = normalizeRole(userRole);
  const dashboardContent = isAdmin
    ? allContent
    : allContent.filter((item) => {
        const itemRole = normalizeRole(item.job_position);
        return !itemRole || itemRole === roleKey;
      });

  const roleEmployees = isAdmin
    ? employees
    : employees.filter((employee) => normalizeRole(employee.role) === roleKey);

  const finalized = dashboardContent.filter((c) => c.document_status === "Finalized");
  const inProgress = dashboardContent.filter((c) => c.document_status === "in-progress");
  const reviewDue = dashboardContent.filter((c) => {
    if (!c.next_review_date) return false;
    const review = new Date(c.next_review_date);
    review.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return review < today;
  });

  const roleQuery = isAdmin ? "" : `&role=${encodeURIComponent(roleKey)}`;
  const stats = [
    {
      label: isAdmin ? "Total Employees" : "Role Coworkers",
      value: roleEmployees.length,
      info: isAdmin
        ? "Count of employee records currently available in the system."
        : "Employees assigned to the same role as your account.",
      href: "/employees",
    },
    {
      label: isAdmin ? "Total Content" : "Role Content",
      value: dashboardContent.length,
      info: isAdmin
        ? "Count of content records included in the dashboard data set."
        : "Content records assigned to your role, plus unassigned shared content.",
      href: isAdmin ? "/hero/content" : `/hero/content?${roleQuery.slice(1)}`,
    },
    {
      label: "Finalized",
      value: finalized.length,
      info: "Content records with a document status of Finalized.",
      href: `/hero/content?status=Finalized${roleQuery}`,
    },
    {
      label: isAdmin ? "In Progress" : "Review Due",
      value: isAdmin ? inProgress.length : reviewDue.length,
      info: isAdmin
        ? "Content records currently marked with the in-progress document status."
        : "Role content whose next review date has already passed.",
      href: isAdmin
        ? `/hero/content?status=in-progress${roleQuery}`
        : `/hero/content?${roleQuery.slice(1)}`,
    },
  ];

  const contentByStatus = [
    {
      name: "Created",
      value: dashboardContent.filter((c) => c.document_status === "Created").length,
    },
    { name: "In Progress", value: inProgress.length },
    { name: "Finalized", value: finalized.length },
    {
      name: "Archived",
      value: dashboardContent.filter((c) => c.document_status === "Archived").length,
    },
  ];

  const roleCounts = new Map<string, number>();
  for (const item of dashboardContent) {
    const role = item.job_position?.trim() || "unassigned";
    roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1);
  }

  const contentByRole = Array.from(roleCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const pieColors = ["#497728", "#1B2A4A", "#C9A84C", "#9CA3AF"];

  // ---- Today strip counts (owned-by-me only) ----
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const ownedContent = userId ? allContent.filter((c) => c.owner_id === userId) : [];
  const todayOverdueReviews = ownedContent.filter((c) => {
    if (!c.next_review_date) return false;
    return new Date(c.next_review_date).getTime() < todayStart.getTime();
  }).length;
  const todayExpiredDocs = ownedContent.filter((c) => {
    if (!c.expiration_date) return false;
    return new Date(c.expiration_date).getTime() < todayStart.getTime();
  }).length;
  const todayStaleCheckouts = userId
    ? allContent.filter((c) => {
        if (c.checked_out_by !== userId) return false;
        if (!c.checked_out_at) return false;
        return Date.now() - new Date(c.checked_out_at).getTime() > SEVEN_DAYS_MS;
      }).length
    : 0;

  return (
    <>
      <TodayStrip
        overdueReviews={todayOverdueReviews}
        expiredDocs={todayExpiredDocs}
        staleCheckouts={todayStaleCheckouts}
        unreadAnnouncements={unreadAnnouncements}
      />
      {!isAdmin ? (
        <div className="mb-6 animate-fade-in-down rounded-lg border-l-4 border-l-hanover-green border-y border-r border-border bg-card px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              {formatRoleLabel(userRole)} Dashboard View
            </h2>
            <InfoPopover title="Role dashboard">
              This view is customized to content assigned to your role and unassigned shared
              content.
            </InfoPopover>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Showing {dashboardContent.length} content records relevant to your role.
          </p>
        </div>
      ) : null}

      <div className="mb-8 grid grid-cols-2 gap-4 stagger-children md:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.href}
            className="group relative block rounded-lg border border-border border-t-4 border-t-hanover-green bg-card p-4 shadow-sm transition-shadow hover:shadow-md hover:border-t-hanover-green/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hanover-green/40 focus-visible:ring-offset-2 sm:p-5"
          >
            <div className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-hanover-green">
              <span>{stat.label}</span>
              <span className="opacity-0 transition-opacity group-hover:opacity-100">→</span>
              <button
                type="button"
                className="absolute right-3 top-3 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <InfoPopover title={stat.label}>{stat.info}</InfoPopover>
              </button>
            </div>
          </Link>
        ))}
      </div>

      <DashboardWidgetGrid
        contentByStatus={contentByStatus}
        contentByRole={contentByRole}
        pieColors={pieColors}
        employees={roleEmployees}
        dashboardContent={dashboardContent}
        isAdmin={isAdmin}
        roleKey={roleKey}
        userRole={userRole}
      />

      {isAdmin ? (
        <DashboardReports content={dashboardContent} auditEvents={auditEvents} />
      ) : (
        <MyContentReports allContent={allContent} />
      )}
    </>
  );
}

function daysUntil(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateLabel(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value instanceof Date ? value : new Date(value));
}

function CoworkersWidget({
  employees,
  isAdmin,
  userRole,
}: {
  employees: EmployeeRow[];
  isAdmin: boolean;
  userRole?: string | null;
}) {
  const { session } = useSession();
  const userId = session?.user.id;
  const userEmail = session?.user.email?.toLowerCase();
  const userName = session?.user.user_metadata?.name?.toLowerCase();

  const list = isAdmin
    ? employees
    : employees.filter((emp) => {
        // Exclude self by id, then by email/name fallbacks.
        if (userId && emp.id === userId) return false;
        if (userEmail && emp.email && emp.email.toLowerCase() === userEmail) return false;
        return !(userName && emp.name && emp.name.toLowerCase() === userName);
      });

  const title = isAdmin ? "Employees" : `${formatRoleLabel(userRole)} Coworkers`;
  const emptyText = isAdmin ? "No employees yet." : "No other coworkers share your role yet.";
  const description = isAdmin
    ? "All employees in the system."
    : `Other employees who share the ${formatRoleLabel(userRole)} role with you.`;

  return (
    <div className="h-full overflow-x-auto rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <InfoPopover title={title}>{description}</InfoPopover>
      </div>
      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Code
              </th>
              <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Name
              </th>
              <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Job
              </th>
            </tr>
          </thead>
          <tbody>
            {list.slice(0, 6).map((emp) => (
              <tr
                key={emp.id}
                className="border-b border-border transition-colors duration-150 last:border-b-0 hover:bg-muted/50"
              >
                <td className="px-2 py-3 font-mono text-xs text-muted-foreground">
                  {emp.employee_code ?? "—"}
                </td>
                <td className="px-2 py-3">
                  <Link
                    to={`/employees/${emp.id}`}
                    className="font-medium text-hanover-green transition-colors duration-150 hover:text-hanover-green/80 hover:underline underline-offset-2"
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
  );
}

function MyContentReports({ allContent }: { allContent: ContentRow[] }) {
  const { session } = useSession();
  const userId = session?.user.id;

  const myContent = userId ? allContent.filter((c) => c.owner_id === userId) : [];

  const expiringSoon = myContent
    .filter((c) => c.expiration_date)
    .map((c) => ({ ...c, _days: daysUntil(new Date(c.expiration_date as string | Date)) }))
    .filter((c) => c._days <= 60)
    .sort((a, b) => a._days - b._days)
    .slice(0, 8);

  const reviewsDue = myContent
    .filter((c) => c.next_review_date)
    .map((c) => ({ ...c, _days: daysUntil(new Date(c.next_review_date as string | Date)) }))
    .filter((c) => c._days <= 30)
    .sort((a, b) => a._days - b._days)
    .slice(0, 8);

  const expiredCount = myContent.filter(
    (c) => c.expiration_date && daysUntil(new Date(c.expiration_date as string | Date)) < 0,
  ).length;

  const reviewOverdueCount = myContent.filter(
    (c) => c.next_review_date && daysUntil(new Date(c.next_review_date as string | Date)) < 0,
  ).length;

  const finalizedCount = myContent.filter((c) => c.document_status === "Finalized").length;

  const summary: {
    label: string;
    value: number;
    tone: "alert" | "warn" | "ok";
    icon: LucideIcon;
  }[] = [
    { label: "Total Owned", value: myContent.length, tone: "ok", icon: Briefcase },
    { label: "Expired", value: expiredCount, tone: "alert", icon: AlertTriangle },
    { label: "Reviews Overdue", value: reviewOverdueCount, tone: "warn", icon: CalendarClock },
    { label: "Finalized", value: finalizedCount, tone: "ok", icon: CheckCircle2 },
  ];

  const toneClass = (tone: "alert" | "warn" | "ok") =>
    tone === "alert" ? "text-red-600" : tone === "warn" ? "text-[#C9A84C]" : "text-hanover-green";

  if (!userId) return null;

  return (
    <div className="mb-8 space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted ${toneClass(
                  s.tone,
                )}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${toneClass(s.tone)}`}>{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">My Upcoming Expirations</h2>
            <InfoPopover title="My Upcoming Expirations">
              Documents you own that have expired or will expire within the next 60 days, sorted by
              the most urgent first.
            </InfoPopover>
          </div>
          {expiringSoon.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing expiring in the next 60 days.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    File
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Expires
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {expiringSoon.map((item) => {
                  const days = item._days;
                  const tone =
                    days < 0
                      ? "bg-red-100 text-red-700"
                      : days <= 14
                        ? "bg-[#C9A84C]/15 text-[#8a6f25]"
                        : "bg-muted text-muted-foreground";
                  const label =
                    days < 0
                      ? `${Math.abs(days)}d overdue`
                      : days === 0
                        ? "Today"
                        : `${days}d left`;
                  return (
                    <tr
                      key={item.fileID}
                      className="border-b border-border transition-colors duration-150 last:border-b-0 hover:bg-muted/50"
                    >
                      <td className="px-2 py-3">
                        <Link
                          to={`/hero/content/${item.fileID}/edit`}
                          className="font-medium text-hanover-green transition-colors duration-150 hover:text-hanover-green/80 hover:underline underline-offset-2"
                        >
                          {item.filename ?? item.fileID}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{formatDateLabel(item.expiration_date as string | Date)}</span>
                          <span
                            className={`mt-0.5 inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}
                          >
                            {label}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${getStatusBadge(item.document_status)}`}
                        >
                          {formatStatus(item.document_status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">My Reviews Due</h2>
            <InfoPopover title="My Reviews Due">
              Documents you own with a next-review date in the past or within the next 30 days.
            </InfoPopover>
          </div>
          {reviewsDue.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No reviews due soon.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    File
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Review
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviewsDue.map((item) => {
                  const days = item._days;
                  const tone =
                    days < 0
                      ? "bg-red-100 text-red-700"
                      : days <= 7
                        ? "bg-[#C9A84C]/15 text-[#8a6f25]"
                        : "bg-muted text-muted-foreground";
                  const label =
                    days < 0
                      ? `${Math.abs(days)}d overdue`
                      : days === 0
                        ? "Today"
                        : `${days}d left`;
                  return (
                    <tr
                      key={item.fileID}
                      className="border-b border-border transition-colors duration-150 last:border-b-0 hover:bg-muted/50"
                    >
                      <td className="px-2 py-3">
                        <Link
                          to={`/hero/content/${item.fileID}/edit`}
                          className="font-medium text-hanover-green transition-colors duration-150 hover:text-hanover-green/80 hover:underline underline-offset-2"
                        >
                          {item.filename ?? item.fileID}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{formatDateLabel(item.next_review_date as string | Date)}</span>
                          <span
                            className={`mt-0.5 inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${tone}`}
                          >
                            {label}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${getStatusBadge(item.document_status)}`}
                        >
                          {formatStatus(item.document_status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

type DashboardWidgetGridProps = {
  contentByStatus: { name: string; value: number }[];
  contentByRole: { name: string; value: number }[];
  pieColors: string[];
  employees: EmployeeRow[];
  dashboardContent: ContentRow[];
  isAdmin: boolean;
  roleKey: string;
  userRole?: string | null;
};

function DashboardWidgetGrid({
  contentByStatus,
  contentByRole,
  pieColors,
  employees,
  dashboardContent,
  isAdmin,
  roleKey,
  userRole,
}: DashboardWidgetGridProps) {
  const order = useAppPreferences((state) => state.dashboardWidgetOrder);
  const swap = useAppPreferences((state) => state.swapDashboardWidgets);

  const contentByStatusWidget = (
    <div className="h-full rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">Content By Status</h2>
        <InfoPopover title="Content By Status">
          Distribution of content records across Created, In Progress, Finalized, and Archived
          document statuses.
        </InfoPopover>
      </div>
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
  );

  const sidePanelWidget = isAdmin ? (
    <div className="h-full rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">Top Roles By Content</h2>
        <InfoPopover title="Top Roles By Content">
          The six job positions with the most associated content records. Records without a job
          position are grouped as unassigned.
        </InfoPopover>
      </div>
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
  ) : (
    <QuickLinksCard role={roleKey} />
  );

  const employeesWidget = (
    <CoworkersWidget employees={employees} isAdmin={isAdmin} userRole={userRole} />
  );

  const recentContentWidget = (
    <div className="h-full overflow-x-auto rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Content</h2>
      {dashboardContent.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No content yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                File
              </th>
              <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Owner
              </th>
              <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tags
              </th>
              <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {dashboardContent.slice(0, 6).map((item) => (
              <tr
                key={item.fileID}
                className="border-b border-border transition-colors duration-150 last:border-b-0 hover:bg-muted/50"
              >
                <td className="px-2 py-3">
                  <Link
                    to={`/hero/content/${item.fileID}/edit`}
                    className="font-medium text-hanover-green transition-colors duration-150 hover:text-hanover-green/80 hover:underline underline-offset-2"
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
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ring-black/4"
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
                    className={`inline-block rounded px-2 py-0.5 text-xs font-semibold transition-colors ${getStatusBadge(item.document_status)}`}
                  >
                    {formatStatus(item.document_status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <SwappableLayout
      className="mb-6 grid gap-5 lg:grid-cols-2"
      order={order}
      onSwap={swap}
      items={[
        { id: "content-by-status", node: contentByStatusWidget },
        { id: "side-panel", node: sidePanelWidget },
        { id: "employees", node: employeesWidget },
        { id: "recent-content", node: recentContentWidget },
      ]}
    />
  );
}

function DashboardPage() {
  const { session } = useSession();
  const tab = useAppPreferences((state) => state.dashboardTab);
  const setTab = useAppPreferences((state) => state.setDashboardTab);

  const access = trpc.user.myAccess.useQuery();
  const isAdmin = access.data?.role === "admin";
  const activeTab: DashboardTab =
    (tab === "metrics" || tab === "tags") && !isAdmin ? "overview" : tab;

  const announcementsQuery = trpc.notifications.listAnnouncements.useQuery(undefined, {
    enabled: activeTab === "overview" && Boolean(session),
  });

  const employees = trpc.employee.list.useQuery({}, { enabled: activeTab === "overview" });
  const allContent = trpc.content.list.useQuery({}, { enabled: activeTab === "overview" });

  const isLoading = activeTab === "overview" && (employees.isLoading || allContent.isLoading);
  const loadError = activeTab === "overview" ? (employees.error ?? allContent.error) : null;

  const auditRecent = trpc.audit.getRecent.useQuery(undefined, {
    enabled: activeTab === "overview" && isAdmin,
    refetchInterval: 30000,
  });

  const tabs: { key: DashboardTab; label: string; icon: typeof LayoutGrid }[] = [
    { key: "overview", label: "Overview", icon: LayoutGrid },
    ...(isAdmin
      ? [
          { key: "metrics" as const, label: "Metrics", icon: Activity },
          { key: "tags" as const, label: "Tags", icon: TagIcon },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-muted">
      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 animate-fade-in-down">
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-hanover-green/10">
                <LayoutGrid className="h-6 w-6 text-hanover-green" />
              </span>
              Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              {activeTab === "metrics"
                ? "System and document activity metrics"
                : activeTab === "tags"
                  ? "Manage global meta tags used across content."
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
                    className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hanover-green/40 focus-visible:ring-offset-2 ${
                      isActive
                        ? "bg-hanover-deepblue text-white shadow-sm shadow-hanover-deepblue/20"
                        : "border border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/25 hover:bg-muted/50"
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
            <div className="animate-fade-in">
              <MetricsView />
            </div>
          ) : activeTab === "tags" ? (
            <div className="animate-fade-in">
              <TagsPage />
            </div>
          ) : isLoading ? (
            <div className="flex animate-fade-in items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
              <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
            </div>
          ) : loadError ? (
            <div className="mx-auto max-w-lg animate-fade-in-up py-16 text-center">
              <p className="font-medium text-red-600">Could not load dashboard data.</p>
              <p className="mt-2 wrap-break-word text-sm text-muted-foreground">
                {loadError instanceof Error ? loadError.message : String(loadError)}
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <DashboardLoaded
                employees={employees.data ?? []}
                allContent={allContent.data ?? []}
                auditEvents={auditRecent.data ?? []}
                isAdmin={isAdmin}
                userRole={access.data?.role}
                userId={session?.user.id}
                unreadAnnouncements={announcementsQuery.data?.unreadCount ?? 0}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
