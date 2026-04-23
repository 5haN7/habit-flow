import { useMemo, useState } from "react";
import { useApp } from "@/store/useAppStore";
import { Navigate } from "react-router-dom";
import MobileShell from "@/components/MobileShell";
import HabitCard from "@/components/HabitCard";
import CategoryHeader from "@/components/CategoryHeader";
import HabitStudioDialog from "@/components/HabitStudioDialog";
import { CATEGORIES, getActiveHabits } from "@/lib/habits";
import { PencilLine } from "lucide-react";

export default function Home() {
  const { user, toggleHabit, updateHabit, archiveHabit, restoreHabit, resetUser } = useApp();
  const [isStudioOpen, setStudioOpen] = useState(false);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const activeHabits = useMemo(() => getActiveHabits(user?.habits ?? []), [user]);

  const grouped = useMemo(() => {
    if (!activeHabits.length) return [];
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: activeHabits.filter((h) => h.category === cat.id),
    })).filter((g) => g.items.length > 0);
  }, [activeHabits]);

  if (!user?.onboarded) return <Navigate to="/welcome" replace />;

  const totalDone = activeHabits.filter((h) => h.completedToday).length;
  const total = activeHabits.length;
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
                {total === 0
                  ? "Shape the routine."
                  : totalDone === total
                    ? "All done today."
                    : "Build the day."}
              </span>
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setStudioOpen(true)}
            aria-label="Edit your routine"
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-bold text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
          >
            <PencilLine className="h-4 w-4" />
            <span>Edit routine</span>
          </button>
        </div>

        {/* daily progress bar */}
        <div className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Today
            </span>
            <span className="text-[12px] font-bold tabular-nums text-foreground bg-slate-100 px-3 py-1 rounded-full">
              {total === 0 ? "No active habits" : `${totalDone}/${total} · ${pct}%`}
            </span>
          </div>
          <div className="relative">
            <div className="h-3 w-full bg-gradient-to-r from-slate-100 to-slate-200 overflow-hidden rounded-full shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out shadow-lg"
                style={{ width: `${pct}%` }}
              />
            </div>
            {pct > 0 && pct < 100 && (
              <div 
                className="absolute top-1/2 -translate-y-1/2 h-5 w-5 bg-white rounded-full shadow-md border-2 border-purple-500 transition-all duration-700"
                style={{ left: `calc(${pct}% - 10px)` }}
              />
            )}
          </div>
        </div>
      </header>

      <div className="px-6 space-y-10">
        {grouped.length === 0 && (
          <section className="rounded-[32px] border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white px-6 py-8 text-center shadow-sm">
            <div className="mx-auto max-w-[250px]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                No active habits
              </p>
              <h2 className="mt-3 text-[24px] font-bold tracking-tight text-slate-900">
                Your streak history is safe.
              </h2>
              <p className="mt-2 text-[14px] leading-6 text-slate-600">
                Restore an archived habit or edit your routine to put something back on today&apos;s board.
              </p>
              <button
                type="button"
                onClick={() => setStudioOpen(true)}
                className="mt-5 inline-flex items-center rounded-full bg-slate-900 px-5 py-3 text-[13px] font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
              >
                Open routine studio
              </button>
            </div>
          </section>
        )}

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

      <HabitStudioDialog
        open={isStudioOpen}
        onOpenChange={setStudioOpen}
        userName={user.name}
        habits={user.habits}
        onUpdateHabit={updateHabit}
        onArchiveHabit={archiveHabit}
        onRestoreHabit={restoreHabit}
        onResetUser={resetUser}
      />

      </MobileShell>
  );
}
