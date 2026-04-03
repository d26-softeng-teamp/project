import { TextInput } from "@myapp/ui/components/text-input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { trpc } from "@/lib/trpc";

function ContentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id) && id !== "new";

  const existing = trpc.content.getById.useQuery({ id: id! }, { enabled: isEditing });

  const employees = trpc.employee.list.useQuery({});

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [employeeId, setEmployeeId] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (existing.data) {
      setTitle(existing.data.title);
      setBody(existing.data.body);
      setStatus(existing.data.status as "draft" | "published");
      setEmployeeId(existing.data.employee_id ?? "");
    }
  }, [existing.data]);

  const utils = trpc.useUtils();

  const create = trpc.content.create.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      navigate("/content");
    },
  });

  const update = trpc.content.update.useMutation({
    onSuccess: () => {
      utils.content.list.invalidate();
      utils.content.getById.invalidate({ id: id! });
      navigate("/content");
    },
  });

  const isSaving = create.isPending || update.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      title,
      body,
      status,
      employee_id: employeeId || null,
    };

    if (isEditing) {
      update.mutate({ id: id!, ...data });
    } else {
      create.mutate(data);
    }
  }

  if (isEditing && existing.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
        <span className="ml-2 text-muted-foreground">Loading content...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="py-12">
        <div className="mx-auto max-w-[640px] px-4">
          <Link
            to="/content"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Content
          </Link>

          <h1 className="mb-6 text-2xl font-bold text-foreground">
            {isEditing ? "Edit Content" : "New Content"}
          </h1>

          <div className="rounded bg-white p-8 shadow-md">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <TextInput
                label="Title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              {/* Body — textarea, not a text input */}
              <div>
                <label htmlFor="body" className="mb-2 block text-sm font-semibold text-foreground">
                  Body
                </label>
                <textarea
                  id="body"
                  required
                  rows={6}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-hanover-green"
                />
              </div>

              {/* Author */}
              <div>
                <label
                  htmlFor="employee"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Author
                </label>
                <select
                  id="employee"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full rounded border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-hanover-green"
                >
                  <option value="">Unassigned</option>
                  {employees.data?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                      {emp.department ? ` — ${emp.department}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                  className="w-full rounded border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-hanover-green"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Error display */}
              {(create.isError || update.isError) && (
                <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {create.error?.message || update.error?.message || "Something went wrong."}
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded bg-hanover-green py-3 font-semibold text-white transition-colors hover:bg-hanover-green/90 disabled:opacity-60"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? "Update Content" : "Save Content"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentFormPage;
