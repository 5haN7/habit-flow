import { NavLink } from "react-router-dom";
import { Home, ListChecks, BarChart3 } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/todo", label: "To-do", icon: ListChecks },
  { to: "/analytics", label: "Stats", icon: BarChart3 },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-surface border-t border-border shadow-lg">
      <div className="max-w-md mx-auto">
        <ul className="grid grid-cols-3">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-3 text-[11px] font-bold transition-colors ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-2 rounded-full transition-colors ${isActive ? "bg-foreground/10" : ""}`}>
                      <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
