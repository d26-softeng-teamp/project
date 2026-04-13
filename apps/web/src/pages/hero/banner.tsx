import { FileText, Minus, Shield, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import heroCampus from "@/assets/hero-campus.png";
import { trpc } from "@/lib/trpc";

const HERO_CONTENT_PATH = "/hero#content-library";

function HeroBanner() {
  const [heroExpanded, setHeroExpanded] = useState(true);
  const { data: access } = trpc.user.myAccess.useQuery();
  const isAdmin = access?.role === "admin";

  const quickLinks = isAdmin
    ? [
        { to: HERO_CONTENT_PATH, label: "Content", icon: FileText },
        { to: "/users", label: "Users", icon: Users },
      ]
    : [
        { to: HERO_CONTENT_PATH, label: "Content", icon: FileText },
        {
          to: access?.role === "business-analyst" ? "/business-analyst" : "/underwriter",
          label: access?.role === "business-analyst" ? "Business Analyst" : "Underwriter",
          icon: Shield,
        },
        { to: "/employees", label: "Coworkers", icon: Users },
      ];

  return (
    <div
      className={`relative isolate w-full transition-[min-height,max-height] duration-300 ease-in-out ${
        heroExpanded
          ? "min-h-[min(22rem,calc(100dvh-4.75rem))] max-h-none overflow-hidden lg:min-h-[min(30rem,calc(100dvh-5.75rem))]"
          : "h-0 max-h-0 min-h-0 overflow-hidden"
      }`}
    >
      <img
        src={heroCampus}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300 ${
          heroExpanded ? "opacity-100" : "opacity-0"
        }`}
        decoding="async"
      />

      {heroExpanded ? (
        <button
          type="button"
          aria-expanded
          aria-controls="hero-panel"
          aria-label="Minimize hero section"
          onClick={() => setHeroExpanded(false)}
          className="absolute right-3 top-3 z-20 p-0.5 text-white outline-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)] transition-opacity duration-150 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-hanover-green focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <Minus className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
      ) : null}

      {heroExpanded ? (
        <div
          id="hero-panel"
          className="relative z-10 w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12"
        >
          <div className="mx-auto w-full max-w-[22rem] rounded-xl border border-border/60 bg-card/90 p-4 shadow-md backdrop-blur-md sm:max-w-[24rem] sm:p-4 lg:mx-0 lg:ml-8">
            <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">
              Welcome to Hanover
            </h1>

            <div
              className={`mt-3 grid gap-1.5 sm:gap-2 ${quickLinks.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}
            >
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-md bg-hanover-green px-1 py-2 text-center text-white shadow-sm transition-colors hover:bg-hanover-green/90 sm:min-h-16 sm:py-2"
                >
                  <link.icon className="size-4 shrink-0 sm:size-5" aria-hidden />
                  <span className="text-[0.6rem] font-medium leading-tight sm:text-[0.65rem]">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { HERO_CONTENT_PATH, HeroBanner };
