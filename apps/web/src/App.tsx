import { TopNav } from "@myapp/ui/components/top-nav";
import { Loader2 } from "lucide-react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { useSession } from "@/auth/session-context";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import AccountPage from "@/pages/account/page.tsx";
import UsersPage from "@/pages/admin/users/page.tsx";
import UserFormPage from "@/pages/admin/users/user-form.tsx";
import BusinessAnalystPage from "@/pages/business-analyst/page.tsx";
import ContentFormPage from "@/pages/content/content-form.tsx";
import ContentPage from "@/pages/content/page.tsx";
import DashboardPage from "@/pages/dashboard/page.tsx";
import EmployeeDetailPage from "@/pages/employees/employee-detail.tsx";
import EmployeesPage from "@/pages/employees/page.tsx";
import HeroLayout from "@/pages/hero/layout.tsx";
import LoginFormPage from "@/pages/login.tsx";
import TagsPage from "@/pages/tags/TagsPage";
import UnderwriterPage from "@/pages/underwriter/page.tsx";

function LegacyContentEditRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/hero/content/${id}/edit`} replace />;
}

const SIGNED_OUT_NOTICE = "You were signed out. Please sign in again.";

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
    { label: "User Management", to: "/users" },
    { label: "Tags", to: "/tags" },
    { label: "Dashboard", to: "/dashboard" },
  ];
}

/** Nav items for employee roles. */
function employeeNavItems() {
  return [
    { label: "Content", to: "/hero/content" },
    { label: "Coworkers", to: "/employees" },
  ];
}

/** Layout wrapper that protects routes behind authentication and shows role-appropriate nav. */
function ProtectedLayout() {
  const { session, loading: sessionLoading } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  const accessQuery = trpc.user.myAccess.useQuery(undefined, {
    enabled: Boolean(session),
  });

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
          settingsTo: "/account",
          onSignOut: handleSignOut,
          photoUrl: accessQuery.data?.photo_url,
        }}
      />
      <Outlet />
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
            <Route path="/tags" element={<TagsPage />} />
          </Route>

          {/* Shared */}
          <Route path="/dashboard/" element={<DashboardPage />} />
          <Route path="/account" element={<AccountPage />} />

          {/* Legacy redirects */}
          <Route path="/content" element={<Navigate to="/hero/content" replace />} />
          <Route path="/content/new" element={<Navigate to="/hero/content/new" replace />} />
          <Route path="/content/:id/edit" element={<LegacyContentEditRedirect />} />
          <Route path="/businessAnalyst" element={<Navigate to="/business-analyst" replace />} />
          <Route path="/dashboard" element={<Navigate to="/hero" replace />} />
          <Route path="/admin/metrics" element={<Navigate to="/dashboard/" replace />} />
          <Route path="*" element={<Navigate to="/hero" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
