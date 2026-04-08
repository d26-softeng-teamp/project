import { TextInput } from "@myapp/ui/components/text-input";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  generateId,
  getUserById,
  ROLE_LABELS,
  saveUser,
  type AppUser,
  type UserRole,
} from "@/lib/users-store";

const ROLES: UserRole[] = ["admin", "underwriter", "business-analyst"];

function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id) && id !== "new";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("underwriter");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditing && id) {
      const existing = getUserById(id);
      if (existing) {
        setUsername(existing.username);
        setPassword(existing.password);
        setRole(existing.role);
        setDisplayName(existing.displayName);
      }
    }
  }, [id, isEditing]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    const user: AppUser = {
      id: isEditing ? id! : generateId(),
      username: username.trim(),
      password: password.trim(),
      role,
      displayName: displayName.trim() || username.trim(),
    };

    saveUser(user);
    navigate("/users");
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
                className="flex w-full items-center justify-center gap-2 rounded bg-hanover-green py-3 font-semibold text-white transition-colors hover:bg-hanover-green/90"
              >
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
