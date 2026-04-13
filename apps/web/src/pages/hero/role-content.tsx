import { trpc } from "@/lib/trpc";
import AdminContentPage from "@/pages/admin/content/page";
import ContentListPage from "@/pages/content/page";

/** Renders the admin content view for admins, employee content view for everyone else. */
function RoleAwareContentPage() {
  const { data: access } = trpc.user.myAccess.useQuery();
  if (access?.role === "admin") return <AdminContentPage />;
  return <ContentListPage />;
}

export default RoleAwareContentPage;
