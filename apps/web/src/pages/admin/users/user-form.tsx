import type { AccountRole, UserPortal } from "@myapp/types/schemas";
import { TextInput } from "@myapp/ui/components/text-input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { trpc } from "@/lib/trpc";

const ROLES: AccountRole[] = ["admin", "underwriter", "business-analyst"];

const ROLE_LABELS: Record<AccountRole, string> = {
  admin: "Admin",
  underwriter: "Underwriter",
  "business-analyst": "Business Analyst",
};

const PORTALS: UserPortal[] = ["employee", "admin"];
const PORTAL_LABELS: Record<UserPortal, string> = {
  employee: "Employee portal (web app)",
  admin: "Admin portal",
};

function userFormValidationError(
  emailRaw: string,
  passwordRaw: string,
  nameRaw: string,
  isEditing: boolean,
): string | null {
  if (!emailRaw.trim()) return "Email is required.";
  if (!isEditing && !passwordRaw.trim()) return "Password is required.";
  if (!nameRaw.trim()) return "Name is required.";
  return null;
}

function sharedUserPayload(
  nameRaw: string,
  portal: UserPortal,
  role: AccountRole,
  employeeCodeRaw: string,
  jobDescRaw: string,
) {
  return {
    name: nameRaw.trim(),
    portal,
    role,
    employee_code: employeeCodeRaw.trim() || null,
    job_desc: jobDescRaw.trim() || null,
  };
}

function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id) && id !== "new";
  const utils = trpc.useUtils();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [portal, setPortal] = useState<UserPortal>("employee");
  const [role, setRole] = useState<AccountRole>("underwriter");
  const [employeeCode, setEmployeeCode] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [error, setError] = useState("");

  const existingUser = trpc.user.adminGetById.useQuery({ id: id! }, { enabled: isEditing });

  useEffect(() => {
    if (existingUser.data) {
      setEmail(existingUser.data.email);
      setPassword("");
      setName(existingUser.data.name);
      setPortal(existingUser.data.portal as UserPortal);
      setRole(existingUser.data.role as AccountRole);
      setEmployeeCode(existingUser.data.employee_code ?? "");
      setJobDesc(existingUser.data.job_desc ?? "");
    }
  }, [existingUser.data]);

  const createMutation = trpc.user.adminCreate.useMutation({
    onSuccess: async () => {
      await utils.user.invalidate();
      navigate("/users");
    },
    onError: (err) => setError(err.message),
  });

  const updateMutation = trpc.user.adminUpdate.useMutation({
    onSuccess: async () => {
      await utils.user.invalidate();
      navigate("/users");
    },
    onError: (err) => setError(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const validationError = userFormValidationError(email, password, name, isEditing);
    if (validationError) {
      setError(validationError);
      return;
    }
    const fields = sharedUserPayload(name, portal, role, employeeCode, jobDesc);
    if (isEditing && id) {
      updateMutation.mutate({
        id,
        email: email.trim(),
        ...(password.trim() ? { password: password.trim() } : {}),
        ...fields,
      });
    } else {
      createMutation.mutate({
        email: email.trim(),
        password: password.trim(),
        ...fields,
      });
    }
  }

  if (isEditing && existingUser.isLoading) {
    return (
      <div className="flex justify-center border-t border-border/60 py-16">
        <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
        <span className="ml-2 text-muted-foreground">Loading user...</span>
      </div>
    );
  }

  if (isEditing && existingUser.isError) {
    return (
      <div className="border-t border-border/60 py-8 sm:py-10">
        <div className="mx-auto max-w-[640px] px-4 sm:px-6 lg:px-8">
          <Link
            to="/users"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to User Management
          </Link>
          <div className="rounded border border-red-200 bg-red-50 py-12 text-center text-sm text-red-700">
            User not found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border/60 py-8 sm:py-10">
      <div className="mx-auto max-w-[640px] px-4 sm:px-6 lg:px-8">
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

        <div className="rounded bg-card p-8 shadow-md">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <TextInput
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextInput
              label={isEditing ? "New password (leave blank to keep current)" : "Password"}
              type="password"
              required={!isEditing}
              autoComplete={isEditing ? "new-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <TextInput
              label="Display name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="portal" className="text-sm font-medium text-foreground">
                Portal access
              </label>
              <select
                id="portal"
                value={portal}
                onChange={(e) => setPortal(e.target.value as UserPortal)}
                className="rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green"
              >
                {PORTALS.map((p) => (
                  <option key={p} value={p}>
                    {PORTAL_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="role" className="text-sm font-medium text-foreground">
                Job role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as AccountRole)}
                className="rounded border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            <TextInput
              label="Employee code (optional)"
              type="text"
              maxLength={10}
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
            />

            <TextInput
              label="Job description (optional)"
              type="text"
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />

            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded bg-hanover-green py-3 font-semibold text-white transition-colors hover:bg-hanover-green/90 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Update User" : "Save User"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserFormPage;
