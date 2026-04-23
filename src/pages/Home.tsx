import { useMemo } from "react";
import { useApp } from "@/store/useAppStore";
import { Navigate } from "react-router-dom";
import MobileShell from "@/components/MobileShell";
import BottomNav from "@/components/BottomNav";
import HabitCard from "@/components/HabitCard";
import CategoryHeader from "@/components/CategoryHeader";
import { CATEGORIES } from "@/lib/habits";
import { Settings2 } from "lucide-react";

export default function Home() {
  const { user, toggleHabit, resetUser } = useApp();

  const today = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const grouped = useMemo(() => {
    if (!user) return [];
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: user.habits.filter((h) => h.category === cat.id),
    })).filter((g) => g.items.length > 0);
  }, [user]);

  if (!user?.onboarded) return <Navigate to="/welcome" replace />;

  const totalDone = user.habits.filter((h) => h.completedToday).length;
  const total = user.habits.length;
  const pct = total === 0 ? 0 : Math.round((totalDone / total) * 100);

  return (
    <MobileShell>
      <header className="px-6 pt-10 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {today}
            </div>
            <h1 className="mt-2 text-[32px] leading-[1.05] font-bold tracking-tight text-foreground">
              Hello, {user.name}.
              <br />
              <span className="italic font-medium text-muted-foreground">
                {totalDone === total && total > 0 ? "All done today." : "Build the day."}
              </span>
            </h1>
          </div>
          <button
            onClick={() => {
              if (confirm("Reset your setup? This clears all habits and streaks.")) resetUser();
            }}
            aria-label="Reset"
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <Settings2 className="h-5 w-5" />
          </button>
        </div>

        {/* daily progress bar */}
        <div className="mt-7">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Today
            </span>
            <span className="text-[12px] font-bold tabular-nums text-foreground">
              {totalDone}/{total} · {pct}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted overflow-hidden rounded-sm">
            <div
              className="h-full bg-foreground transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </header>

      <div className="px-6 space-y-10">
        {grouped.map((g) => (
          <section key={g.id}>
            <CategoryHeader
              category={g.id}
              label={g.label}
              count={g.items.length}
              done={g.items.filter((h) => h.completedToday).length}
            />
            <div className="space-y-3">
              {g.items.map((h) => (
                <HabitCard key={h.id} habit={h} onComplete={() => toggleHabit(h.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <BottomNav />
    </MobileShell>
  );
}
