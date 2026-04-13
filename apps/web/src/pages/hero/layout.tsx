import { Outlet, useLocation } from "react-router";
import { trpc } from "@/lib/trpc";
import { HeroBanner } from "@/pages/hero/banner.tsx";
import { HeroQuickLinks } from "@/pages/hero/quick-links.tsx";

function HeroLayout() {
  const { pathname } = useLocation();
  const isHeroHome = pathname === "/hero" || pathname === "/hero/";
  const { data: access } = trpc.user.myAccess.useQuery();
  const isAdmin = access?.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      {isHeroHome ? <HeroBanner /> : null}
      <div className="bg-muted">
        {isHeroHome && !isAdmin ? <HeroQuickLinks /> : null}
        <Outlet />
      </div>
    </div>
  );
}

export default HeroLayout;
