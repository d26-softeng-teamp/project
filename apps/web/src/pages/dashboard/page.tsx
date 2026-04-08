import { LayoutGrid, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { trpc } from "@/lib/trpc.ts";

function getStatusBadge(status: string | null) {
  switch (status) {
    case "Finalized":
      return "bg-hanover-green text-white";
    case "Created":
      return "bg-[#C9A84C] text-white";
    case "in-progress":
      return "bg-blue-500 text-white";
    case "Archived":
      return "bg-gray-400 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function DashboardPage() {
  const employees = trpc.employee.list.useQuery({});
  const allContent = trpc.content.list.useQuery({});

  const isLoading = employees.isLoading || allContent.isLoading;

  const finalized = allContent.data?.filter((c) => c.document_status === "Finalized") ?? [];
  const inProgress = allContent.data?.filter((c) => c.document_status === "in-progress") ?? [];

  const stats = [
    { label: "Total Employees", value: employees.data?.length ?? "—" },
    { label: "Total Content", value: allContent.data?.length ?? "—" },
    { label: "Finalized", value: finalized.length },
    { label: "In Progress", value: inProgress.length },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="flex items-center gap-3 text-3xl font-bold text-foreground">
              <LayoutGrid className="h-8 w-8 text-hanover-green" />
              Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">Overview of employees and content</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-hanover-green" />
              <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
            </div>
          ) : (
            <>
              <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded border-t-4 border-t-hanover-green bg-white p-6 shadow-sm"
                  >
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Employees Table */}
                <div className="overflow-x-auto rounded bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">Employees</h2>
                  {(employees.data?.length ?? 0) === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No employees yet.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-2 py-3 text-left font-semibold text-foreground">ID</th>
                          <th className="px-2 py-3 text-left font-semibold text-foreground">
                            Name
                          </th>
                          <th className="px-2 py-3 text-left font-semibold text-foreground">
                            Role
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.data?.slice(0, 6).map((emp) => (
                          <tr key={emp.employeeID} className="border-b border-border">
                            <td className="px-2 py-3 font-mono text-xs text-muted-foreground">
                              {emp.employeeID}
                            </td>
                            <td className="px-2 py-3">
                              <Link
                                to={`/employees/${emp.employeeID}`}
                                className="text-hanover-green hover:underline"
                              >
                                {emp.employee_name ?? "—"}
                              </Link>
                            </td>
                            <td className="px-2 py-3 text-muted-foreground">
                              {emp.job_desc ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Recent Content Table */}
                <div className="overflow-x-auto rounded bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Content</h2>
                  {(allContent.data?.length ?? 0) === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No content yet.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-2 py-3 text-left font-semibold text-foreground">
                            File
                          </th>
                          <th className="px-2 py-3 text-left font-semibold text-foreground">
                            Owner
                          </th>
                          <th className="px-2 py-3 text-left font-semibold text-foreground">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allContent.data?.slice(0, 6).map((item) => (
                          <tr key={item.fileID} className="border-b border-border">
                            <td className="px-2 py-3">
                              <Link
                                to={`/content/${item.fileID}/edit`}
                                className="text-hanover-green hover:underline"
                              >
                                {item.filename ?? item.fileID}
                              </Link>
                            </td>
                            <td className="px-2 py-3 text-muted-foreground">
                              {item.employee?.employee_name ?? "Unassigned"}
                            </td>
                            <td className="px-2 py-3">
                              <span
                                className={`rounded px-2 py-0.5 text-xs font-semibold ${getStatusBadge(item.document_status)}`}
                              >
                                {item.document_status ?? "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
