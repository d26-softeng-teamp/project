const STATUS_LABELS: Record<string, string> = {
  "in-progress": "In Progress",
};

export function formatStatus(status: string | null | undefined) {
  if (!status) return "—";
  return STATUS_LABELS[status] ?? status;
}
