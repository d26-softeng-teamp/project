import { NavLink } from "react-router";
import { cn } from "../lib/utils";

interface NavItem {
    label: string;
    to: string;
}

function TopNav({ items }: { items: NavItem[] }) {
    return (
        <nav className="w-full bg-hanover-deepblue py-2">
            <div className="flex items-center justify-between px-8 h-24 w-full">
                <span className="text-lg font-bold tracking-tight text-white shrink-0">
                  Hanover
                </span>

                <div className="flex items-center gap-2 h-full">
                    {items.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center h-full px-4 text-sm font-medium transition-colors border-b-2",
                                    isActive
                                        ? "text-white border-hanover-green"
                                        : "text-white border-transparent hover:border-hanover-green/50"
                                )
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    );
}

export type { NavItem };
export { TopNav };