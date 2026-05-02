import CMSChatbot from "@myapp/ui/components/chatbot";
import { TopNav } from "@myapp/ui/components/top-nav";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router";
import { useSession } from "@/auth/session-context";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import AboutPage from "@/pages/about/page.tsx";
import AccountPage from "@/pages/account/page.tsx";
import UsersPage from "@/pages/admin/users/page.tsx";
import UserFormPage from "@/pages/admin/users/user-form.tsx";
import AnnouncementsPage from "@/pages/announcements/page.tsx";
import BusinessAnalystPage from "@/pages/business-analyst/page.tsx";
import CalendarPage from "@/pages/calendar/page.tsx";
import ContentFormPage from "@/pages/content/content-form.tsx";
import ContentPage from "@/pages/content/page.tsx";
import CreditsPage from "@/pages/credits/page.tsx";
import DashboardPage from "@/pages/dashboard/page.tsx";
import EmployeeDetailPage from "@/pages/employees/employee-detail.tsx";
import EmployeesPage from "@/pages/employees/page.tsx";
import HelpPage from "@/pages/help/page.tsx";
import HeroLayout from "@/pages/hero/layout.tsx";
import LoginFormPage from "@/pages/login.tsx";
import ActivityPage from "@/pages/notifications/page.tsx";
import UnderwriterPage from "@/pages/underwriter/page.tsx";
import { useAppPreferences } from "@/store/app-preferences";

function LegacyContentEditRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/hero/content/${id}/edit`} replace />;
}

const SIGNED_OUT_NOTICE = "You were signed out. Please sign in again.";
const CONTENT_SEARCH_FOCUS_EVENT = "content-search:focus";
const USERS_SEARCH_FOCUS_EVENT = "users-search:focus";
const TAGS_SEARCH_FOCUS_EVENT = "tags-search:focus";

function describePage(pathname: string) {
  if (pathname === "/hero" || pathname === "/hero/content") {
    return {
      path: pathname,
      title: "Content library",
      description: "Browsing searchable documents, filters, favorites, tags, owners, and status.",
    };
  }
  if (pathname === "/hero/content/new") {
    return {
      path: pathname,
      title: "New content",
      description: "Creating a content record with upload or URL, metadata, owner, role, and tags.",
    };
  }
  if (pathname.startsWith("/hero/content/")) {
    return {
      path: pathname,
      title: "Content detail",
      description:
        "Viewing or editing one document with checkout, download, upload, and metadata controls.",
    };
  }
  if (pathname === "/notifications") {
    return {
      path: pathname,
      title: "Notifications",
      description:
        "Reviewing document changes, ownership changes, review reminders, and expiration reminders.",
    };
  }
  if (pathname === "/users" || pathname.startsWith("/users/")) {
    return {
      path: pathname,
      title: "User management",
      description: "Admin user account and role management.",
    };
  }
  if (pathname === "/tags") {
    return {
      path: pathname,
      title: "Meta tags",
      description: "Admin global tag management.",
    };
  }
  if (pathname === "/dashboard") {
    return {
      path: pathname,
      title: "Dashboard",
      description:
        "Role-aware dashboard: admin metrics and content health for admins, personal content overview for everyone else.",
    };
  }
  if (pathname === "/employees" || pathname.startsWith("/employees/")) {
    return {
      path: pathname,
      title: "Coworker directory",
      description: "Employee profiles and associated content.",
    };
  }
  if (pathname === "/account") {
    return {
      path: pathname,
      title: "Account settings",
      description: "Current user profile settings.",
    };
  }
  if (pathname === "/help") {
    return {
      path: pathname,
      title: "Help",
      description: "Workflow guidance and product reference.",
    };
  }
  if (pathname === "/gompei") {
    return {
      path: pathname,
      title: "Gompei chat",
      description: "Full-screen assistant conversation with current app context.",
    };
  }
  return {
    path: pathname,
    title: "iBank",
    description: "General app workspace.",
  };
}

type ProtectedOutletContext = {
  assistantContext: ComponentProps<typeof CMSChatbot>["context"];
};

function GompeiPage() {
  const { assistantContext } = useOutletContext<ProtectedOutletContext>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const activeConversationId = searchParams.get("chat");
  const initialPrompt = searchParams.get("q") ?? undefined;
  const conversations = trpc.chat.list.useQuery();
  const activeConversation = trpc.chat.get.useQuery(
    { conversationId: activeConversationId ?? "" },
    { enabled: Boolean(activeConversationId) },
  );
  const createConversation = trpc.chat.create.useMutation();
  const addMessage = trpc.chat.addMessage.useMutation();
  const markRead = trpc.chat.markRead.useMutation();
  const deleteConversation = trpc.chat.delete.useMutation();
  const checkoutOverdue = trpc.content.checkoutOverdue.useMutation();
  const promptCreateKeyRef = useRef<string | null>(null);
  const emptyCreateRequestedRef = useRef(false);

  useEffect(() => {
    if (activeConversationId || !initialPrompt) {
      promptCreateKeyRef.current = null;
      return;
    }
    if (promptCreateKeyRef.current === initialPrompt) return;

    promptCreateKeyRef.current = initialPrompt;
    createConversation.mutate(
      { title: initialPrompt },
      {
        onSuccess: (conversation) => {
          navigate(`/gompei?chat=${conversation.id}&q=${encodeURIComponent(initialPrompt)}`, {
            replace: true,
          });
        },
        onError: () => {
          promptCreateKeyRef.current = null;
        },
      },
    );
  }, [activeConversationId, createConversation, initialPrompt, navigate]);

  useEffect(() => {
    if (activeConversationId || initialPrompt) {
      emptyCreateRequestedRef.current = false;
    }

    if (
      activeConversationId ||
      initialPrompt ||
      !conversations.isSuccess ||
      emptyCreateRequestedRef.current
    ) {
      return;
    }

    const firstConversation = conversations.data[0];
    if (firstConversation) {
      navigate(`/gompei?chat=${firstConversation.id}`, { replace: true });
      return;
    }

    emptyCreateRequestedRef.current = true;
    createConversation.mutate(undefined, {
      onSuccess: (conversation) => navigate(`/gompei?chat=${conversation.id}`, { replace: true }),
      onError: () => {
        emptyCreateRequestedRef.current = false;
      },
    });
  }, [
    activeConversationId,
    conversations.data,
    conversations.isSuccess,
    createConversation,
    initialPrompt,
    navigate,
  ]);

  useEffect(() => {
    if (!activeConversationId) return;
    markRead.mutate({ conversationId: activeConversationId });
  }, [activeConversationId, markRead]);

  const history =
    conversations.data?.map((conversation) => {
      const last = conversation.messages[0];
      return {
        id: conversation.id,
        title: conversation.title,
        preview: last?.content,
        updatedAt: conversation.updatedAt,
        unread:
          last?.role === "assistant" &&
          (!conversation.readAt ||
            new Date(conversation.updatedAt) > new Date(conversation.readAt)),
      };
    }) ?? [];

  const initialMessages = useMemo(
    () =>
      activeConversation.data?.messages.map((message) => ({
        id: message.id,
        role: message.role as "user" | "assistant",
        content: message.content,
      })),
    [activeConversation.data?.messages],
  );

  return (
    <CMSChatbot
      activeConversationId={activeConversationId}
      context={assistantContext}
      history={history}
      initialMessages={initialMessages}
      initialPrompt={activeConversationId ? initialPrompt : undefined}
      mode="page"
      onDeleteConversation={(conversationId) => {
        deleteConversation.mutate(
          { conversationId },
          {
            onSuccess: async () => {
              await utils.chat.list.invalidate();
              if (conversationId === activeConversationId) navigate("/gompei", { replace: true });
            },
          },
        );
      }}
      onNavigate={(to) => navigate(to)}
      onNewConversation={() => {
        createConversation.mutate(undefined, {
          onSuccess: async (conversation) => {
            await utils.chat.list.invalidate();
            navigate(`/gompei?chat=${conversation.id}`);
          },
        });
      }}
      onPersistMessage={async (message) => {
        if (!activeConversationId) return;
        const persistedMessage = await addMessage.mutateAsync({
          conversationId: activeConversationId,
          ...message,
        });
        await utils.chat.list.invalidate();
        if (message.role === "assistant") {
          await utils.chat.get.invalidate({ conversationId: activeConversationId });
        }
        await utils.chat.unreadCount.invalidate();
        return {
          id: persistedMessage.id,
          role: persistedMessage.role as "user" | "assistant",
          content: persistedMessage.content,
        };
      }}
      onRunSiteAction={async ({ prompt }) => {
        const normalizedPrompt = prompt.toLowerCase();
        const wantsCheckout =
          /\bcheck\s*out\b/.test(normalizedPrompt) || /\bcheckout\b/.test(normalizedPrompt);
        const wantsOverdue =
          normalizedPrompt.includes("overdue") || normalizedPrompt.includes("expired");
        const wantsBatch =
          normalizedPrompt.includes("all") ||
          normalizedPrompt.includes("files") ||
          normalizedPrompt.includes("documents") ||
          normalizedPrompt.includes("items");

        if (!(wantsCheckout && wantsOverdue && wantsBatch)) return null;

        const result = await checkoutOverdue.mutateAsync();
        await utils.content.list.invalidate();
        await utils.notifications.myList.invalidate();

        if (result.checkedOut.length === 0) {
          const skipped = result.skipped.slice(0, 3);
          const details =
            skipped.length > 0
              ? ` ${skipped.map((item) => `${item.filename ?? item.fileID}: ${item.reason}`).join(" ")}`
              : "";

          return `I could not check out any overdue files.${details}\nACTION: /hero/content | Open content`;
        }

        const fileLines = result.checkedOut
          .slice(0, 5)
          .map(
            (item) => `ACTION: /hero/content/${item.fileID}/edit | Open ${item.filename ?? "file"}`,
          )
          .join("\n");
        const skippedText =
          result.skipped.length > 0
            ? ` ${result.skipped.length} overdue file${result.skipped.length === 1 ? " was" : "s were"} already checked out or unavailable.`
            : "";

        return `Done. I checked out ${result.checkedOut.length} overdue file${result.checkedOut.length === 1 ? "" : "s"} to you.${skippedText}\n${fileLines}`;
      }}
      onSelectConversation={(conversationId) => navigate(`/gompei?chat=${conversationId}`)}
    />
  );
}

function toTime(value: unknown) {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
  return Number.isNaN(time) ? null : time;
}

function AuthSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <Loader2 className="h-8 w-8 animate-spin text-hanover-green" />
    </div>
  );
}

/** Login route — redirects already-authenticated users to /hero. */
function LoginRoute() {
  const { session, loading: sessionLoading } = useSession();
  const location = useLocation();
  const state = location.state as { notice?: string } | null;

  const accessQuery = trpc.user.myAccess.useQuery(undefined, {
    enabled: Boolean(session),
  });

  if (sessionLoading) return <AuthSplash />;
  if (session && accessQuery.isError) {
    void supabase.auth.signOut();
    return <AuthSplash />;
  }
  if (session && accessQuery.isLoading) return <AuthSplash />;
  if (session && accessQuery.data) {
    return <Navigate to="/hero" replace />;
  }

  return <LoginFormPage bannerText={state?.notice} />;
}

/** Nav items for admin role. */
function adminNavItems() {
  return [
    { label: "Content", to: "/hero/content" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Users", to: "/users" },
  ];
}

/** Redirect that selects the Tags tab in the dashboard before navigating. */
function TagsRedirect() {
  useAppPreferences.getState().setDashboardTab("tags");
  return <Navigate to="/dashboard" replace />;
}

/** Renders the admin dashboard for admins and the user dashboard for everyone else. */
function DashboardRoute() {
  const accessQuery = trpc.user.myAccess.useQuery();
  if (accessQuery.isLoading) return <AuthSplash />;
  return <DashboardPage />;
}

/** Nav items for employee roles. */
function employeeNavItems() {
  return [
    { label: "Content", to: "/hero/content" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Coworkers", to: "/employees" },
  ];
}

/** Layout wrapper that protects routes behind authentication and shows role-appropriate nav. */
function ProtectedLayout() {
  const { session, loading: sessionLoading } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: me } = trpc.user.myProfile.useQuery();

  const accessQuery = trpc.user.myAccess.useQuery(undefined, {
    enabled: Boolean(session),
  });
  const notificationsQuery = trpc.notifications.myList.useQuery(undefined, {
    enabled: Boolean(session) && Boolean(accessQuery.data),
  });
  const announcementsQuery = trpc.notifications.listAnnouncements.useQuery(undefined, {
    enabled: Boolean(session) && Boolean(accessQuery.data),
  });
  const gompeiUnreadQuery = trpc.chat.unreadCount.useQuery(undefined, {
    enabled: Boolean(session) && Boolean(accessQuery.data),
  });
  const submittedContentQuery = trpc.content.list.useQuery(
    { owner_id: session?.user.id ?? "" },
    {
      enabled: Boolean(session?.user.id) && Boolean(accessQuery.data),
    },
  );
  const activityUnread = notificationsQuery.data?.unreadCount ?? 0;
  const announcementUnread = announcementsQuery.data?.unreadCount ?? 0;
  const unreadCount = activityUnread + announcementUnread;
  const unreadRows = notificationsQuery.data?.items.filter((r) => !r.isRead) ?? [];
  const dashboardTab = useAppPreferences((state) => state.dashboardTab);
  const isContentPage = location.pathname === "/hero" || location.pathname === "/hero/content";
  const isUsersPage = location.pathname === "/users";
  const isUsersRoute = location.pathname.startsWith("/users/");
  const isDashboardTagsTab = location.pathname === "/dashboard" && dashboardTab === "tags";

  const focusCurrentSearch = useCallback(() => {
    if (isUsersPage) {
      window.dispatchEvent(new Event(USERS_SEARCH_FOCUS_EVENT));
      return;
    }

    if (isUsersRoute) {
      navigate("/users", { state: { focusUsersSearch: true } });
      return;
    }

    if (isDashboardTagsTab) {
      window.dispatchEvent(new Event(TAGS_SEARCH_FOCUS_EVENT));
      return;
    }

    if (isContentPage) {
      window.dispatchEvent(new Event(CONTENT_SEARCH_FOCUS_EVENT));
      return;
    }

    navigate("/hero/content", { state: { focusContentSearch: true } });
  }, [isContentPage, isDashboardTagsTab, isUsersPage, isUsersRoute, navigate]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusCurrentSearch();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusCurrentSearch]);

  if (sessionLoading) return <AuthSplash />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (accessQuery.isError) {
    void supabase.auth.signOut();
    return <Navigate to="/login" replace state={{ notice: SIGNED_OUT_NOTICE }} />;
  }
  if (accessQuery.isLoading) return <AuthSplash />;

  const role = accessQuery.data?.role;
  const isAdmin = role === "admin";
  const navItems = isAdmin ? adminNavItems() : employeeNavItems();
  const username = me?.name;
  const submittedDocuments = submittedContentQuery.data ?? [];
  const now = Date.now();
  const notificationItems = notificationsQuery.data?.items ?? [];
  const dueSoon = notificationItems.filter((row) => {
    const message = row.message.toLowerCase();
    return message.includes("due") || message.includes("expires");
  }).length;
  const overdue = notificationItems.filter((row) => {
    const message = row.message.toLowerCase();
    return message.includes("passed") || message.includes("expired");
  }).length;
  const checkedOutByUser = submittedDocuments.filter(
    (document) => document.checked_out_by === session.user.id,
  ).length;
  const assistantContext = {
    user: {
      name: username ? username : "User",
      email: me?.email ?? session.user.email ?? undefined,
      role: role ? role : "Unknown",
      portal: accessQuery.data?.portal ?? undefined,
    },
    page: describePage(location.pathname),
    permissions: {
      isAdmin,
      canCreateContent: true,
      canManageUsers: isAdmin,
      canManageTags: isAdmin,
      canViewDashboard: isAdmin,
      canViewCoworkers: !isAdmin,
    },
    workload: {
      unreadNotifications: unreadCount,
      submittedDocuments: submittedDocuments.length,
      dueSoon,
      overdue,
      checkedOutByUser,
    },
    highlights: [
      ...unreadRows.slice(0, 3).map((row) => ({
        id: row.id,
        label: row.fileName,
        detail: row.message,
        to: row.fileID ? `/hero/content/${row.fileID}/edit` : "/notifications",
        tone: "attention" as const,
      })),
      ...submittedDocuments.slice(0, 3).map((document) => {
        const reviewTime = toTime(document.next_review_date);
        const expirationTime = toTime(document.expiration_date);
        const needsReview = reviewTime !== null && reviewTime <= now + 30 * 24 * 60 * 60 * 1000;
        const expired = expirationTime !== null && expirationTime < now;

        return {
          id: document.fileID,
          label: document.filename ?? document.fileID,
          detail: expired
            ? "Expired"
            : needsReview
              ? "Review due soon"
              : (document.document_status ?? "Submitted document"),
          to: `/hero/content/${document.fileID}/edit`,
          tone: expired || needsReview ? ("attention" as const) : ("muted" as const),
        };
      }),
    ],
    actions: [
      {
        label: unreadCount > 0 ? `Open notifications (${unreadCount})` : "Open notifications",
        to: "/notifications",
        description: "Review document changes and due-date reminders.",
        tone: unreadCount > 0 ? ("primary" as const) : ("neutral" as const),
      },
      {
        label: "Open content",
        to: "/hero/content",
        description: "Search and filter documents available to your role.",
        tone: "neutral" as const,
      },
      {
        label: "New content",
        to: "/hero/content/new",
        description: "Create a document record for your allowed role.",
        tone: "neutral" as const,
      },
      ...(isAdmin
        ? [
            {
              label: "Open dashboard",
              to: "/dashboard",
              description: "Review metrics, audits, and content health.",
              adminOnly: true,
              tone: "neutral" as const,
            },
            {
              label: "Open users",
              to: "/users",
              description: "Manage accounts, roles, and portal access.",
              adminOnly: true,
              tone: "neutral" as const,
            },
            {
              label: "Open tags",
              to: "/tags",
              description: "Manage global meta tags.",
              adminOnly: true,
              tone: "neutral" as const,
            },
          ]
        : [
            {
              label: "Open coworkers",
              to: "/employees",
              description: "Find coworkers and profile context.",
              tone: "neutral" as const,
            },
          ]),
      {
        label: "Open help",
        to: "/help",
        description: "View workflow help.",
        tone: "neutral" as const,
      },
    ],
  };

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav
        items={navItems}
        brandTo="/hero"
        accountMenu={{
          notificationsTo: "/activity",
          unreadNotificationCount: activityUnread,
          announcementUnreadCount: announcementUnread,
          gompeiUnreadCount: gompeiUnreadQuery.data ?? 0,
          settingsTo: "/account",
          links: [
            { label: "Calendar", to: "/calendar" },
            { label: "Announcements", to: "/announcements" },
            { label: "Gompei", to: "/gompei" },
            { label: "Help", to: "/help" },
            { label: "About", to: "/about" },
            { label: "Credits", to: "/credits" },
          ],
          onSignOut: handleSignOut,
          photoUrl: accessQuery.data?.photo_url,
        }}
      />
      {location.pathname !== "/gompei" ? (
        <CMSChatbot
          context={assistantContext}
          mode="launcher"
          onSubmitQuestion={(question) => navigate(`/gompei?q=${encodeURIComponent(question)}`)}
        />
      ) : null}
      <Outlet context={{ assistantContext } satisfies ProtectedOutletContext} />
    </div>
  );
}

/** Guard that only renders children for admin-role users; others get redirected home. */
function AdminOnly() {
  const accessQuery = trpc.user.myAccess.useQuery();
  if (accessQuery.isLoading) return <AuthSplash />;
  if (accessQuery.data?.role !== "admin") {
    return <Navigate to="/hero" replace />;
  }
  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />

        <Route element={<ProtectedLayout />}>
          {/* Main hero page — content view adapts to role */}
          <Route path="/" element={<Navigate to="/hero" replace />} />
          <Route path="/hero" element={<HeroLayout />}>
            <Route index element={<ContentPage />} />
            <Route path="content">
              <Route index element={<ContentPage />} />
              <Route path="new" element={<ContentFormPage />} />
              <Route path=":id/edit" element={<ContentFormPage />} />
            </Route>
          </Route>

          {/* Employee role pages */}
          <Route path="/underwriter" element={<UnderwriterPage />} />
          <Route path="/business-analyst" element={<BusinessAnalystPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />

          {/* Admin-only: user management */}
          <Route element={<AdminOnly />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/new" element={<UserFormPage />} />
            <Route path="/users/:id" element={<UserFormPage />} />
            <Route path="/tags" element={<TagsRedirect />} />
          </Route>

          {/* Shared */}
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/gompei" element={<GompeiPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/credits" element={<CreditsPage />} />

          {/* Legacy redirects */}
          <Route path="/notifications" element={<Navigate to="/activity" replace />} />
          <Route path="/content" element={<Navigate to="/hero/content" replace />} />
          <Route path="/content/new" element={<Navigate to="/hero/content/new" replace />} />
          <Route path="/content/:id/edit" element={<LegacyContentEditRedirect />} />
          <Route path="/businessAnalyst" element={<Navigate to="/business-analyst" replace />} />
          <Route path="/admin/metrics" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/hero" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
