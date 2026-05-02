-- ============================================================================
-- Notification inbox + announcements
-- ----------------------------------------------------------------------------
-- 1. notification_state — per-user, per-notification persistent state
--    (read / pinned / soft-deleted). Notification keys are deterministic
--    strings produced by the API (e.g. "change-{eventId}", "review-{fileID}",
--    "expiration-{fileID}", "ownership-{eventId}", "announcement-{id}").
--
-- 2. announcement — admin-authored broadcasts shown to all employees or
--    targeted role groups. Joined into the user's notification feed by the
--    notifications router (apps/api/src/routers/notifications.ts).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- notification_state
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_state (
  "userId"          UUID         NOT NULL,
  "notificationKey" VARCHAR(200) NOT NULL,
  "readAt"          TIMESTAMP(3),
  "pinnedAt"        TIMESTAMP(3),
  "deletedAt"       TIMESTAMP(3),

  CONSTRAINT notification_state_pkey
    PRIMARY KEY ("userId", "notificationKey"),

  CONSTRAINT notification_state_userId_fkey
    FOREIGN KEY ("userId")
    REFERENCES public.users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS notification_state_user_idx
  ON public.notification_state ("userId", "deletedAt", "pinnedAt", "readAt");

-- ----------------------------------------------------------------------------
-- announcement
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcement (
  id            UUID         NOT NULL DEFAULT gen_random_uuid(),
  "authorId"    UUID         NOT NULL,
  title         VARCHAR(200) NOT NULL,
  body          TEXT         NOT NULL,
  urgency       VARCHAR(20)  NOT NULL DEFAULT 'info',
  audience      VARCHAR(20)  NOT NULL DEFAULT 'all',
  "targetRoles" TEXT[]       NOT NULL DEFAULT '{}',
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"   TIMESTAMP(3),

  CONSTRAINT announcement_pkey PRIMARY KEY (id),

  CONSTRAINT announcement_authorId_fkey
    FOREIGN KEY ("authorId")
    REFERENCES public.users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS announcement_publishedAt_idx
  ON public.announcement ("publishedAt");

CREATE INDEX IF NOT EXISTS announcement_audience_idx
  ON public.announcement (audience);
