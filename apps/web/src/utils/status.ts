export function formatStatus(status: string | null | undefined): string {
  if (!status) return "—";
  if (status === "in-progress") return "In Progress";
  return status;
}
