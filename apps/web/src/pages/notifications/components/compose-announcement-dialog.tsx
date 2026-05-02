import { cn } from "@myapp/ui/lib/utils";
import { Megaphone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

const ROLE_OPTIONS = [
  { value: "underwriter", label: "Underwriter" },
  { value: "business-analyst", label: "Business Analyst" },
  { value: "actuarial-analyst", label: "Actuarial Analyst" },
  { value: "exl-operations", label: "EXL Operations" },
];

const URGENCY_OPTIONS = [
  { value: "info" as const, label: "Informational", description: "General update" },
  { value: "warning" as const, label: "Soon", description: "Act in coming weeks" },
  { value: "high" as const, label: "This week", description: "Act in days" },
  { value: "critical" as const, label: "Urgent", description: "Immediate attention" },
];

interface ComposeAnnouncementDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ComposeAnnouncementDialog({ open, onClose }: ComposeAnnouncementDialogProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [urgency, setUrgency] = useState<"info" | "warning" | "high" | "critical">("info");
  const [audience, setAudience] = useState<"all" | "roles">("all");
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const utils = trpc.useUtils();
  const dialogRef = useRef<HTMLDivElement>(null);

  const createMutation = trpc.notifications.createAnnouncement.useMutation({
    onSuccess: async () => {
      await utils.notifications.listAnnouncements.invalidate();
      await utils.notifications.adminListAnnouncements.invalidate();
      onClose();
      resetForm();
    },
  });

  function resetForm() {
    setTitle("");
    setBody("");
    setUrgency("info");
    setAudience("all");
    setTargetRoles([]);
    setExpiresAt("");
  }

  function toggleRole(role: string) {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (audience === "roles" && targetRoles.length === 0) return;

    createMutation.mutate({
      title: title.trim(),
      body: body.trim(),
      urgency,
      audience,
      targetRoles: audience === "roles" ? targetRoles : [],
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
  }

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Focus trap — focus the first interactive element when the dialog opens
  useEffect(() => {
    if (open) {
      const first = dialogRef.current?.querySelector<HTMLElement>("input, textarea, button");
      first?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: click-outside-to-close is a standard modal UX pattern
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-dialog-title"
        className="animate-fade-in-up w-full max-w-lg rounded-xl border border-border bg-card shadow-xl"
      >
        {/* Dialog header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-hanover-green/10">
            <Megaphone className="h-4 w-4 text-hanover-green" />
          </div>
          <h2 id="compose-dialog-title" className="flex-1 text-base font-semibold text-foreground">
            New Announcement
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-5">
          {/* Title */}
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold text-foreground"
              htmlFor="ann-title"
            >
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="ann-title"
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief subject line…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-hanover-green/40"
            />
          </div>

          {/* Body */}
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold text-foreground"
              htmlFor="ann-body"
            >
              Message <span className="text-destructive">*</span>
            </label>
            <textarea
              id="ann-body"
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement here…"
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-hanover-green/40"
            />
          </div>

          {/* Urgency */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-foreground">Priority</p>
            <div className="flex gap-2">
              {URGENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUrgency(opt.value)}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-2 text-left text-xs transition-colors",
                    urgency === opt.value
                      ? opt.value === "critical"
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : opt.value === "high"
                          ? "border-[#EA580C] bg-[#EA580C]/10 text-[#EA580C]"
                          : opt.value === "warning"
                            ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]"
                            : "border-hanover-green bg-hanover-green/10 text-hanover-green"
                      : "border-border text-muted-foreground hover:border-muted-foreground",
                  )}
                >
                  <span className="block font-semibold">{opt.label}</span>
                  <span className="block leading-tight opacity-70">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-foreground">Audience</p>
            <div className="flex gap-2">
              {(["all", "roles"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAudience(opt)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                    audience === opt
                      ? "border-hanover-deepblue bg-hanover-deepblue text-white"
                      : "border-border text-muted-foreground hover:border-muted-foreground",
                  )}
                >
                  {opt === "all" ? "All employees" : "Specific roles"}
                </button>
              ))}
            </div>

            {audience === "roles" && (
              <div className="mt-2 flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => toggleRole(role.value)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      targetRoles.includes(role.value)
                        ? "border-hanover-green bg-hanover-green text-white"
                        : "border-border text-muted-foreground hover:border-hanover-green hover:text-hanover-green",
                    )}
                  >
                    {role.label}
                  </button>
                ))}
                {audience === "roles" && targetRoles.length === 0 && (
                  <p className="w-full text-xs text-destructive">Select at least one role.</p>
                )}
              </div>
            )}
          </div>

          {/* Expires at */}
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold text-foreground"
              htmlFor="ann-expires"
            >
              Expires (optional)
            </label>
            <input
              id="ann-expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-hanover-green/40"
            />
          </div>

          {/* Error */}
          {createMutation.isError && (
            <p className="text-xs text-destructive">
              Failed to post announcement. Please try again.
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createMutation.isPending ||
                !title.trim() ||
                !body.trim() ||
                (audience === "roles" && targetRoles.length === 0)
              }
              className="rounded-md bg-hanover-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-hanover-green/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {createMutation.isPending ? "Posting…" : "Post announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
