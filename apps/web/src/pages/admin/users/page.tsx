import { Loader2, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/lib/trpc";

type UserRole = "admin" | "underwriter" | "business-analyst";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  underwriter: "Underwriter",
  "business-analyst": "Business Analyst",
};

const PORTAL_LABELS = { employee: "Employee app", admin: "Admin app" } as const;

function UsersPage() {
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const users = trpc.user.adminList.useQuery({ search });

  const deleteMutation = trpc.user.adminDelete.useMutation({
    onSuccess: async () => {
      await utils.user.invalidate();
      setConfirmDeleteId(null);
    },
  });

  const allUsers = users.data ?? [];

  return (
    <div className="border-t border-border/60 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
              <Users className="h-8 w-8 text-hanover-green" />
              User Management
            </h1>
            <p className="mt-1 text-muted-foreground">Supabase accounts and directory fields</p>
          </div>
          <Link
            to="/users/new"
            className="flex shrink-0 items-center justify-center gap-2 rounded bg-hanover-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hanover-green/90"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Link>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by email, name, role, or employee code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-border bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green"
            />
          </div>
        </div>

        {users.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
            <span className="ml-2 text-muted-foreground">Loading users...</span>
          </div>
        ) : users.isError ? (
          <div className="mx-auto max-w-lg px-4 py-16 text-center">
            <p className="font-medium text-red-600">Could not load users.</p>
            <p className="mt-2 break-words text-sm text-muted-foreground">
              {users.error instanceof Error ? users.error.message : String(users.error)}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded bg-card shadow-sm">
            {allUsers.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">No users found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/80">
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Portal</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Code</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border transition-colors hover:bg-muted/80"
                    >
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {PORTAL_LABELS[user.portal as "employee" | "admin"] ?? user.portal}
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {user.employee_code ?? "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/users/${user.id}`}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-hanover-green transition-colors hover:bg-hanover-green/10"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(user.id)}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                        {confirmDeleteId === user.id && (
                          <div className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2">
                            <p className="mb-2 text-xs text-red-700">
                              Delete <strong>{user.email}</strong>? This cannot be undone.
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/80"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteMutation.mutate({ id: user.id })}
                                disabled={deleteMutation.isPending}
                                className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                              >
                                Confirm Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const known = role as UserRole;
  const styles: Record<UserRole, string> = {
    admin: "bg-hanover-deepblue/10 text-hanover-deepblue",
    underwriter: "bg-hanover-green/10 text-hanover-green",
    "business-analyst": "bg-[#C9A84C]/20 text-[#8a6f28]",
  };
  const label = ROLE_LABELS[known as UserRole] ?? role;
  const cls = styles[known] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
  );
}

export default UsersPage;
