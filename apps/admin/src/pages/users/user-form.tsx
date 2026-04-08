import { TextInput } from "@myapp/ui/components/text-input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { trpc } from "@/lib/trpc";

type UserRole = "admin" | "underwriter" | "business-analyst";

const ROLES: UserRole[] = ["admin", "underwriter", "business-analyst"];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  underwriter: "Underwriter",
  "business-analyst": "Business Analyst",
};

function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id) && id !== "new";

  const existing = trpc.appUser.getById.useQuery(
    { id: id! },
    { enabled: isEditing },
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("underwriter");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (existing.data) {
      setUsername(existing.data.username);
      setPassword(existing.data.password);
      setRole(existing.data.role as UserRole);
      setDisplayName(existing.data.display_name ?? "");
    }
  }, [existing.data]);

  const utils = trpc.useUtils();

  const create = trpc.appUser.create.useMutation({
    onSuccess: () => {
      utils.appUser.list.invalidate();
      navigate("/users");
    },
    onError: (err) => setError(err.message),
  });

  const update = trpc.appUser.update.useMutation({
    onSuccess: () => {
      utils.appUser.list.invalidate();
      utils.appUser.getById.invalidate({ id: id! });
      navigate("/users");
    },
    onError: (err) => setError(err.message),
  });

  const isSaving = create.isPending || update.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isEditing) {
      update.mutate({
        id: id!,
        username: username.trim(),
        password: password.trim(),
        role,
        display_name: displayName.trim() || null,
      });
    } else {
      create.mutate({
        username: username.trim(),
        password: password.trim(),
        role,
        display_name: displayName.trim() || null,
      });
    }
  }

  if (isEditing && existing.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
        <span className="ml-2 text-muted-foreground">Loading user...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="py-12">
        <div className="mx-auto max-w-[640px] px-4">
          <Link
            to="/users"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to User Management
          </Link>

          <h1 className="mb-6 text-2xl font-bold text-foreground">
            {isEditing ? "Edit User" : "Add New User"}
          </h1>

          <div className="rounded bg-white p-8 shadow-md">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <TextInput
                label="Username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <TextInput
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="rounded border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>

              <TextInput
                label="Display Name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />

              {error && (
                <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded bg-hanover-green py-3 font-semibold text-white transition-colors hover:bg-hanover-green/90 disabled:opacity-60"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? "Update User" : "Save User"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserFormPage;
