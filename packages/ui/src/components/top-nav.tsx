import {
  BookOpen,
  Bot,
  Boxes,
  CalendarDays,
  CircleHelp,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Settings,
  Tags,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import hanoverLogo from "../assets/hanover-logo.png";
import wpiWordmark from "../assets/wpi-wordmark.svg";
import { cn } from "../lib/utils";

interface NavItem {
  label: string;
  to: string;
}

interface TopNavProps {
  items: NavItem[];
  /** Logo links here (e.g. `/hero` for the app landing page). */
  brandTo?: string;
  /** Focuses content search. Usually wired to Command/Ctrl+K too. */
  onSearchFocus?: () => void;
  /** Account menu (profile trigger, Settings link, Log out). Shown for signed-in layouts. */
  accountMenu?: {
    settingsTo: string;
    links?: NavItem[];
    onSignOut: () => void | Promise<void>;
    photoUrl?: string | null;
    notificationsTo?: string;
    unreadNotificationCount?: number;
    announcementUnreadCount?: number;
    gompeiUnreadCount?: number;
  };
}

const menuItemClass =
  "relative flex cursor-default select-none items-center rounded-md px-2.5 py-2 text-sm outline-none transition-colors duration-150 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground";

const menuContentClass =
  "z-[200] min-w-[10rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg shadow-black/10 animate-fade-in-down origin-top-right";

const disclaimerStorageKey = "wpi-class-project-disclaimer-dismissed";

const navIcons = {
  Content: FileText,
  Users: UsersRound,
  "User Management": UsersRound,
  Tags,
  Dashboard: LayoutDashboard,
  Coworkers: UsersRound,
  Help: CircleHelp,
};

function TopNav({ items, brandTo, accountMenu }: TopNavProps) {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const hasUnreadNotifications = Boolean(
    accountMenu?.unreadNotificationCount && accountMenu.unreadNotificationCount > 0,
  );
  const hasUnreadAnnouncements = Boolean(
    accountMenu?.announcementUnreadCount && accountMenu.announcementUnreadCount > 0,
  );
  const hasUnreadGompei = Boolean(
    accountMenu?.gompeiUnreadCount && accountMenu.gompeiUnreadCount > 0,
  );

  useEffect(() => {
    if (window.localStorage.getItem(disclaimerStorageKey) !== "true") {
      setShowDisclaimer(true);
    }
  }, []);

  function dismissDisclaimer() {
    window.localStorage.setItem(disclaimerStorageKey, "true");
    setShowDisclaimer(false);
  }

  const logo = (
    <img
      src={hanoverLogo}
      alt="The Hanover Insurance Group"
      height={24}
      className="h-9 max-h-9 w-auto max-w-[min(100%,9rem)] shrink-0 object-contain object-left brightness-0 invert"
    />
  );

  return (
    <>
      <nav className="sticky top-0 z-40 w-full bg-hanover-deepblue shadow-sm shadow-black/20 backdrop-blur supports-[backdrop-filter]:bg-hanover-deepblue/95">
        <div className="flex h-11 w-full items-center justify-between px-4 sm:px-6">
          {brandTo ? (
            <NavLink
              to={brandTo}
              className="flex h-full shrink-0 items-center rounded-md px-1 no-underline hover:no-underline"
            >
              <span>{logo}</span>
            </NavLink>
          ) : (
            logo
          )}

          <div className="flex h-full items-center gap-0.5 sm:gap-2">
            {items.map((item) => {
              const isHelpItem = item.label === "Help";
              const Icon = navIcons[item.label as keyof typeof navIcons];

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  aria-label={isHelpItem ? "Help" : undefined}
                  title={isHelpItem ? "Help" : undefined}
                  className={() =>
                    cn(
                      "group relative flex h-8 items-center gap-1.5 rounded-full px-2 text-xs font-medium text-white/85 no-underline outline-none hover:no-underline sm:px-2.5 sm:text-sm",
                      "focus-visible:ring-2 focus-visible:ring-hanover-green focus-visible:ring-offset-2 focus-visible:ring-offset-hanover-deepblue",
                      isHelpItem && "justify-center px-2 sm:px-2",
                    )
                  }
                >
                  {isHelpItem ? (
                    <>
                      <CircleHelp
                        className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-90"
                        aria-hidden
                        strokeWidth={2}
                      />
                      <span className="sr-only">Help</span>
                    </>
                  ) : (
                    <>
                      {Icon ? (
                        <Icon
                          className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-90"
                          aria-hidden
                          strokeWidth={2}
                        />
                      ) : null}
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
            {accountMenu ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger
                  type="button"
                  className={cn(
                    "group flex h-full items-center rounded-md px-0.5 text-white outline-none transition-colors sm:px-1",
                    "focus-visible:ring-2 focus-visible:ring-hanover-green focus-visible:ring-offset-2 focus-visible:ring-offset-hanover-deepblue",
                  )}
                  aria-label="Account menu"
                >
                  <span className="relative flex size-8 shrink-0 items-center justify-center">
                    {accountMenu.photoUrl ? (
                      <img
                        src={accountMenu.photoUrl}
                        alt=""
                        className="size-8 rounded-full border border-white/25 object-cover"
                      />
                    ) : (
                      <span
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full border border-white/25 bg-white/10",
                        )}
                      >
                        <UserRound
                          className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-90"
                          aria-hidden
                          strokeWidth={2}
                        />
                      </span>
                    )}
                    {hasUnreadNotifications || hasUnreadAnnouncements || hasUnreadGompei ? (
                      <span
                        className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-hanover-green ring-2 ring-hanover-deepblue"
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  {hasUnreadNotifications || hasUnreadAnnouncements || hasUnreadGompei ? (
                    <span className="sr-only">
                      {[
                        hasUnreadNotifications
                          ? `${accountMenu.unreadNotificationCount} unread notifications`
                          : null,
                        hasUnreadAnnouncements
                          ? `${accountMenu.announcementUnreadCount} unread announcements`
                          : null,
                        hasUnreadGompei
                          ? `${accountMenu.gompeiUnreadCount} unread Gompei chats`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  ) : null}
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className={menuContentClass}
                    sideOffset={8}
                    align="end"
                    collisionPadding={8}
                  >
                    {accountMenu.notificationsTo ? (
                      <DropdownMenu.Item asChild className={menuItemClass}>
                        <NavLink
                          to={accountMenu.notificationsTo}
                          className={cn(menuItemClass, "justify-between gap-4 no-underline")}
                        >
                          <span className="flex items-center gap-2">
                            <Inbox className="size-4" aria-hidden strokeWidth={2} />
                            Activity
                          </span>
                          {hasUnreadNotifications ? (
                            <>
                              <span className="rounded-full bg-hanover-green px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                {accountMenu.unreadNotificationCount}
                              </span>
                              <span className="sr-only">
                                {accountMenu.unreadNotificationCount} unread items
                              </span>
                            </>
                          ) : null}
                        </NavLink>
                      </DropdownMenu.Item>
                    ) : null}
                    <DropdownMenu.Item asChild className={menuItemClass}>
                      <NavLink
                        to={accountMenu.settingsTo}
                        className={cn(menuItemClass, "gap-2 no-underline")}
                      >
                        <Settings className="size-4" aria-hidden strokeWidth={2} />
                        Settings
                      </NavLink>
                    </DropdownMenu.Item>
                    {accountMenu.links?.map((item) => (
                      <DropdownMenu.Item key={item.to} asChild className={menuItemClass}>
                        <NavLink to={item.to} className={cn(menuItemClass, "gap-2 no-underline")}>
                          {item.label === "Credits" ? (
                            <Boxes className="size-4" aria-hidden strokeWidth={2} />
                          ) : item.label === "Gompei" ? (
                            <span className="relative inline-flex">
                              <Bot className="size-4" aria-hidden strokeWidth={2} />
                              {hasUnreadGompei ? (
                                <span
                                  className="absolute -right-1 -top-1 size-2 rounded-full bg-hanover-green"
                                  aria-hidden
                                />
                              ) : null}
                            </span>
                          ) : item.label === "Calendar" ? (
                            <CalendarDays className="size-4" aria-hidden strokeWidth={2} />
                          ) : item.label === "Announcements" ? (
                            <span className="relative inline-flex">
                              <Megaphone className="size-4" aria-hidden strokeWidth={2} />
                              {hasUnreadAnnouncements ? (
                                <span
                                  className="absolute -right-1 -top-1 size-2 rounded-full bg-hanover-green"
                                  aria-hidden
                                />
                              ) : null}
                            </span>
                          ) : item.label === "Activity" ? (
                            <Inbox className="size-4" aria-hidden strokeWidth={2} />
                          ) : item.label === "About" ? (
                            <BookOpen className="size-4" aria-hidden strokeWidth={2} />
                          ) : (
                            <CircleHelp className="size-4" aria-hidden strokeWidth={2} />
                          )}
                          {item.label}
                        </NavLink>
                      </DropdownMenu.Item>
                    ))}
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <DropdownMenu.Item
                      className={cn(
                        menuItemClass,
                        "gap-2 text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive",
                      )}
                      onSelect={(event) => {
                        event.preventDefault();
                        void Promise.resolve(accountMenu.onSignOut());
                      }}
                    >
                      <LogOut className="size-4" aria-hidden strokeWidth={2} />
                      Log out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : null}
          </div>
        </div>
      </nav>

      {showDisclaimer ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center px-4 py-6"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Dismiss disclaimer"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={dismissDisclaimer}
          />
          <section
            aria-labelledby="class-project-disclaimer-title"
            aria-modal="true"
            className="relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-card p-6 text-card-foreground shadow-2xl shadow-black/25"
            role="dialog"
          >
            <button
              type="button"
              className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hanover-green"
              aria-label="Dismiss disclaimer"
              onClick={dismissDisclaimer}
            >
              <X className="size-4" aria-hidden strokeWidth={2} />
            </button>
            <img
              src={wpiWordmark}
              alt="Worcester Polytechnic Institute"
              className="mb-5 h-14 w-auto max-w-[11rem]"
            />
            <h2
              id="class-project-disclaimer-title"
              className="pr-8 text-xl font-semibold tracking-normal text-foreground"
            >
              Class Project Notice
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This website has been created for WPI&apos;s CS 3733 Software Engineering as a class
              project and is not in use by Hanover Insurance.
            </p>
            <button
              type="button"
              className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-md bg-hanover-deepblue px-4 text-sm font-medium text-white transition-colors hover:bg-hanover-deepblue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hanover-green focus-visible:ring-offset-2"
              onClick={dismissDisclaimer}
            >
              Continue
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}

export type { NavItem };
export { TopNav };
