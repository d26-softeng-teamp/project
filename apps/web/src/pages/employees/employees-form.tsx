import { TextInput } from "@myapp/ui/components/text-input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { trpc } from "@/lib/trpc.ts";

function EmployeesFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id) && id !== "new";

  const existing = trpc.employee.getById.useQuery({ employeeID: id! }, { enabled: isEditing });

  const [employeeID, setEmployeeID] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [jobDesc, setJobDesc] = useState("");

  useEffect(() => {
    if (existing.data) {
      setEmployeeID(existing.data.employeeID);
      setEmployeeName(existing.data.employee_name ?? "");
      setJobDesc(existing.data.job_desc ?? "");
    }
  }, [existing.data]);

  const utils = trpc.useUtils();

  const create = trpc.employee.create.useMutation({
    onSuccess: () => {
      utils.employee.list.invalidate();
      navigate("/employees");
    },
  });

  const update = trpc.employee.update.useMutation({
    onSuccess: () => {
      utils.employee.list.invalidate();
      utils.employee.getById.invalidate({ employeeID: id! });
      navigate("/employees");
    },
  });

  const isSaving = create.isPending || update.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isEditing) {
      update.mutate({
        employeeID: id!,
        employee_name: employeeName || null,
        job_desc: jobDesc || null,
      });
    } else {
      create.mutate({
        employeeID,
        employee_name: employeeName || null,
        job_desc: jobDesc || null,
      });
    }
  }

  if (isEditing && existing.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
        <span className="ml-2 text-muted-foreground">Loading employee...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="py-12">
        <div className="mx-auto max-w-[640px] px-4">
          <Link
            to="/employees"
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Link>

          <h1 className="mb-6 text-2xl font-bold text-foreground">
            {isEditing ? "Edit Employee" : "Add New Employee"}
          </h1>

          <div className="rounded bg-white p-8 shadow-md">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <TextInput
                label="Employee ID"
                type="text"
                required
                maxLength={10}
                disabled={isEditing}
                value={employeeID}
                onChange={(e) => setEmployeeID(e.target.value)}
              />
              <TextInput
                label="Name"
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
              />
              <TextInput
                label="Job Description"
                type="text"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />

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
                {isEditing ? "Update Employee" : "Save Employee"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeesFormPage;
