import { Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { deleteUser, getUsers, ROLE_LABELS, type AppUser } from "@/lib/users-store";

function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>(() => getUsers());
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      ROLE_LABELS[u.role].toLowerCase().includes(search.toLowerCase()),
  );

  function handleDelete(id: string) {
    deleteUser(id);
    setUsers(getUsers());
    setConfirmDeleteId(null);
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
                <Users className="h-8 w-8 text-hanover-green" />
                User Management
              </h1>
              <p className="mt-1 text-muted-foreground">Add, edit, and remove user accounts</p>
            </div>
            <Link
              to="/users/new"
              className="flex items-center gap-2 rounded bg-hanover-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hanover-green/90"
            >
              <Plus className="h-4 w-4" />
              Add User
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by username, name, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-border bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded bg-white shadow-sm">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">No users found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-[#F9FAFB]">
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Username</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      Display Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Role</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <>
                      <tr
                        key={user.id}
                        className="border-b border-border transition-colors hover:bg-[#F9FAFB]"
                      >
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                          {user.username}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {user.displayName}
                        </td>
                        <td className="px-4 py-3">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/users/${user.id}`}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-hanover-green hover:bg-hanover-green/10 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Link>
                            <button
                              onClick={() => setConfirmDeleteId(user.id)}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {confirmDeleteId === user.id && (
                        <tr key={`${user.id}-confirm`} className="bg-red-50">
                          <td colSpan={4} className="px-4 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-red-700">
                                Delete <strong>{user.username}</strong>? This cannot be undone.
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="rounded border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[#F9FAFB] transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                                >
                                  Confirm Delete
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: AppUser["role"] }) {
  const styles: Record<AppUser["role"], string> = {
    admin: "bg-hanover-deepblue/10 text-hanover-deepblue",
    underwriter: "bg-hanover-green/10 text-hanover-green",
    "business-analyst": "bg-[#C9A84C]/20 text-[#8a6f28]",
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${styles[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

export default UsersPage;
