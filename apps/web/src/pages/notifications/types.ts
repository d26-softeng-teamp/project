import type { RouterOutputs } from "@/lib/trpc";

type ApiNotificationItem = RouterOutputs["notifications"]["myList"]["items"][number];

export type NotificationItem = Omit<ApiNotificationItem, "type" | "urgency"> & {
  type: "document-change" | "ownership-update" | "expiration" | "announcement";
  urgency: "info" | "warning" | "high" | "critical";
};

export type FilterKey = "all" | "unread" | "pinned" | "changes" | "ownership";
