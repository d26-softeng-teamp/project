import { Loader2, Plus, Search, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/lib/trpc.ts";

function EmployeesPage() {
  const [search, setSearch] = useState("");

  const employees = trpc.employee.list.useQuery({ search });

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
                <Users className="h-8 w-8 text-hanover-green" />
                Employees
              </h1>
              <p className="mt-1 text-muted-foreground">Manage your team directory</p>
            </div>
            <Link
              to="/employees/new"
              className="flex items-center gap-2 rounded bg-hanover-green px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hanover-green/90"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, ID, or job description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded border border-border bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-hanover-green"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded bg-white shadow-sm">
            {employees.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
                <span className="ml-2 text-muted-foreground">Loading employees...</span>
              </div>
            ) : employees.isError ? (
              <div className="py-16 text-center text-red-600">
                Failed to load employees. Is the API running?
              </div>
            ) : employees.data?.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">No employees found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-[#F9FAFB]">
                    <th className="px-4 py-3 text-left font-semibold text-foreground">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">
                      Job Description
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Content</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.data?.map((emp) => (
                    <tr
                      key={emp.employeeID}
                      className="border-b border-border transition-colors hover:bg-[#F9FAFB]"
                    >
                      <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                        {emp.employeeID}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        <Link
                          to={`/employees/${emp.employeeID}`}
                          className="text-hanover-green hover:underline"
                        >
                          {emp.employee_name ?? "—"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{emp.job_desc ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {emp._count.content_items} item
                        {emp._count.content_items !== 1 ? "s" : ""}
                      </td>
                    </tr>
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

export default EmployeesPage;
