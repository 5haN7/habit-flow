import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import MobileShell from "@/components/MobileShell";
import { useApp } from "@/store/useAppStore";
import { CATEGORIES, CATEGORY_CLASSES, getActiveHabits, todayISO } from "@/lib/habits";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Flame, Trophy, CheckCircle2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Analytics() {
  const { user } = useApp();
  const habits = useMemo(() => user?.habits ?? [], [user]);
  const activeHabits = useMemo(() => getActiveHabits(habits), [habits]);

  const last7 = useMemo(() => {
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const label = d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2);
      const count = habits.reduce((s, h) => s + ((h.history ?? []).includes(iso) ? 1 : 0), 0);
      days.push({ date: iso, label, count });
    }
    return days;
  }, [habits]);

  const byCategory = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const items = habits.filter((h) => h.category === cat.id);
      const completions = items.reduce((s, h) => s + (h.history?.length ?? 0), 0);
      return {
        id: cat.id,
        label: cat.label,
        value: completions,
        items: items.length,
        color: CATEGORY_CLASSES[cat.id].chart,
      };
    }).filter((c) => c.items > 0);
  }, [habits]);

  if (!user?.onboarded) return <Navigate to="/welcome" replace />;

  const totalCompletions = habits.reduce((s, h) => s + (h.history?.length ?? 0), 0);
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.bestStreak), 0);
  const currentStreaksSum = activeHabits.reduce((s, h) => s + h.streak, 0);
  const today = todayISO();
  const doneToday = activeHabits.filter((h) => h.lastCompleted === today).length;
  const completionRate = activeHabits.length === 0 ? 0 : Math.round((doneToday / activeHabits.length) * 100);

  const pieData = byCategory.length > 0 && byCategory.some((c) => c.value > 0)
    ? byCategory
    : byCategory.map((c) => ({ ...c, value: 1 })); // placeholder so the ring renders

  const maxBar = Math.max(...last7.map((d) => d.count), habits.length || 1);

  return (
    <MobileShell>
      <header className="px-6 pt-10 pb-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Your progress
        </div>
        <h1 className="mt-2 text-[32px] leading-[1.05] font-bold tracking-tight text-foreground">
          Analytics.
          <br />
          <span className="italic font-medium text-muted-foreground">A look at your week.</span>
        </h1>
      </header>

      <div className="px-6 grid grid-cols-2 gap-4">
        <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Completions" value={totalCompletions} color="hsl(var(--cat-mind))" />
        <Stat icon={<Flame className="h-5 w-5" />} label="Active streaks" value={currentStreaksSum} color="hsl(var(--cat-energy))" />
        <Stat icon={<Trophy className="h-5 w-5" />} label="Best streak" value={bestStreak} color="hsl(var(--cat-finances))" />
        <Stat icon={<Activity className="h-5 w-5" />} label="Today" value={`${completionRate}%`} color="hsl(var(--cat-home))" />
      </div>

      <section className="px-6 mt-10">
        <SectionTitle title="Last 7 days" hint="Habits completed each day" />
        <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-3xl p-6 h-48 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, maxBar]}
                tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                contentStyle={{
                  background: "hsl(var(--surface))",
                  border: "2px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                  fontFamily: "DM Sans",
                  fontWeight: 600,
                }}
              />
              <Bar dataKey="count" radius={[12, 12, 0, 0]}>
                {last7.map((d, i) => (
                  <Cell key={i} fill={`hsl(${(i * 30) % 360}, 70%, 60%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="px-6 mt-10">
        <SectionTitle title="By category" hint="Where your effort goes" />
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-3xl p-6 flex items-center gap-6 shadow-lg">
          <div className="h-36 w-36 shrink-0 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full"></div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={40}
                  outerRadius={64}
                  stroke="hsl(var(--surface))"
                  strokeWidth={3}
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex-1 space-y-3">
            {byCategory.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-2 rounded-full hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full shadow-sm" style={{ background: c.color }} />
                  <span className="text-[14px] font-bold text-foreground">{c.label}</span>
                </div>
                <span className="text-[13px] font-bold tabular-nums text-muted-foreground bg-slate-100 px-3 py-1 rounded-full">
                  {c.value}
                </span>
              </li>
            ))}
            {byCategory.length === 0 && (
              <li className="text-[13px] text-muted-foreground font-medium">No habits yet.</li>
            )}
          </ul>
        </div>
      </section>

      <section className="px-6 mt-10 mb-4">
        <SectionTitle title="Per habit" hint="Current and best streaks" />
        <div className="space-y-3">
          {habits.map((h) => {
            const c = CATEGORY_CLASSES[h.category];
            return (
              <div
                key={h.id}
                className={cn(
                  "bg-gradient-to-r from-slate-50 to-slate-100 border-2 rounded-2xl px-5 py-4 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
                  c.border,
                  h.archived && "opacity-70"
                )}
                style={{ borderColor: c.chart }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-[15px] font-bold text-foreground truncate">{h.name}</div>
                    {h.archived && (
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                        Archived
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] font-medium text-muted-foreground truncate">{h.hint}</div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-3">
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Now</div>
                    <div className="text-[16px] font-bold text-foreground tabular-nums">{h.streak}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Best</div>
                    <div className="text-[16px] font-bold text-foreground tabular-nums">{h.bestStreak}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </MobileShell>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color?: string }) {
  return (
    <div className="relative bg-gradient-to-br from-white to-slate-50 border-2 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ background: color }}></div>
      <div className="relative">
        <div className="flex items-center gap-1.5" style={{ color: color || 'hsl(var(--muted-foreground))' }}>
          {icon}
          <span className="text-[11px] font-bold uppercase tracking-[0.14em]">{label}</span>
        </div>
        <div className="mt-2 text-[26px] font-bold tracking-tight tabular-nums text-foreground">{value}</div>
      </div>
    </div>
  );
}

function SectionTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-3 flex items-end justify-between px-1">
      <h2 className="text-[18px] font-bold tracking-tight text-foreground">{title}</h2>
      <span className="text-[11px] font-medium text-muted-foreground">{hint}</span>
    </div>
  );
}
