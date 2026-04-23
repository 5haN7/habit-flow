import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import MobileShell from "@/components/MobileShell";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/store/useAppStore";
import { CATEGORIES, CATEGORY_CLASSES, todayISO } from "@/lib/habits";
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
  if (!user?.onboarded) return <Navigate to="/welcome" replace />;

  const habits = user.habits;
  const totalCompletions = habits.reduce((s, h) => s + (h.history?.length ?? 0), 0);
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.bestStreak), 0);
  const currentStreaksSum = habits.reduce((s, h) => s + h.streak, 0);
  const today = todayISO();
  const doneToday = habits.filter((h) => h.lastCompleted === today).length;
  const completionRate = habits.length === 0 ? 0 : Math.round((doneToday / habits.length) * 100);

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

      <div className="px-6 grid grid-cols-2 gap-3">
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Completions" value={totalCompletions} />
        <Stat icon={<Flame className="h-4 w-4" />} label="Active streaks" value={currentStreaksSum} />
        <Stat icon={<Trophy className="h-4 w-4" />} label="Best streak" value={bestStreak} />
        <Stat icon={<Activity className="h-4 w-4" />} label="Today" value={`${completionRate}%`} />
      </div>

      <section className="px-6 mt-10">
        <SectionTitle title="Last 7 days" hint="Habits completed each day" />
        <div className="bg-surface border border-border rounded-md p-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fontWeight: 500, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, maxBar]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                contentStyle={{
                  background: "hsl(var(--surface))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: "DM Sans",
                }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {last7.map((d, i) => (
                  <Cell key={i} fill="hsl(var(--foreground))" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="px-6 mt-10">
        <SectionTitle title="By category" hint="Where your effort goes" />
        <div className="bg-surface border border-border rounded-md p-4 flex items-center gap-4">
          <div className="h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={36}
                  outerRadius={56}
                  stroke="hsl(var(--surface))"
                  strokeWidth={2}
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex-1 space-y-2">
            {byCategory.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />
                  <span className="text-[13px] font-medium text-foreground">{c.label}</span>
                </div>
                <span className="text-[12px] font-bold tabular-nums text-muted-foreground">
                  {c.value}
                </span>
              </li>
            ))}
            {byCategory.length === 0 && (
              <li className="text-[12px] text-muted-foreground">No habits yet.</li>
            )}
          </ul>
        </div>
      </section>

      <section className="px-6 mt-10 mb-4">
        <SectionTitle title="Per habit" hint="Current and best streaks" />
        <div className="space-y-2">
          {habits.map((h) => {
            const c = CATEGORY_CLASSES[h.category];
            return (
              <div
                key={h.id}
                className={cn(
                  "bg-surface border-l-4 border-y border-r border-border rounded-md px-4 py-3 flex items-center justify-between",
                  c.border
                )}
                style={{ borderLeftColor: c.chart }}
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-foreground truncate">{h.name}</div>
                  <div className="text-[11px] font-medium text-muted-foreground truncate">{h.hint}</div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Now</div>
                    <div className="text-[15px] font-bold text-foreground tabular-nums">{h.streak}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Best</div>
                    <div className="text-[15px] font-bold text-foreground tabular-nums">{h.bestStreak}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-[0.14em]">{label}</span>
      </div>
      <div className="mt-2 text-[26px] font-bold tracking-tight tabular-nums text-foreground">{value}</div>
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
