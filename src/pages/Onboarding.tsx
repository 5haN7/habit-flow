import { useState } from "react";
import { CATEGORIES, CategoryId, HABIT_LIBRARY, Habit, UserState } from "@/lib/habits";
import { useApp } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import MobileShell from "@/components/MobileShell";

type Step = "name" | "pick" | "categorize";

export default function Onboarding() {
  const { setUser } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<Record<string, CategoryId>>({});

  const togglePick = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const finish = () => {
    const habits: Habit[] = picked.map((id) => {
      const t = HABIT_LIBRARY.find((h) => h.id === id)!;
      return {
        id: t.id,
        name: t.name,
        hint: t.hint,
        category: overrides[id] ?? t.defaultCategory,
        streak: 0,
        bestStreak: 0,
        lastCompleted: null,
        completedToday: false,
        history: [],
      };
    });
    const u: UserState = { name: name.trim() || "Friend", onboarded: true, habits };
    setUser(u);
    nav("/", { replace: true });
  };

  return (
    <MobileShell withNav={false}>
      <div className="px-6 pt-12 pb-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-10">
          <Sparkles className="h-3.5 w-3.5" />
          Streak · setup
        </div>

        {step === "name" && (
          <section className="animate-fade-in">
            <h1 className="text-[34px] leading-[1.1] font-bold tracking-tight text-foreground">
              Let's begin.
              <br />
              <span className="italic font-medium text-muted-foreground">What should we call you?</span>
            </h1>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              className="mt-10 w-full bg-transparent border-0 border-b-2 border-border focus:border-foreground outline-none px-0 py-3 text-2xl font-medium placeholder:text-muted-foreground/60"
            />
            <button
              type="button"
              onClick={() => name.trim() && setStep("pick")}
              disabled={!name.trim()}
              className="mt-12 w-full bg-foreground text-background font-bold py-4 rounded-md flex items-center justify-center gap-2 disabled:opacity-30"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        )}

        {step === "pick" && (
          <section className="animate-fade-in">
            <h1 className="text-[28px] leading-tight font-bold tracking-tight text-foreground">
              Pick your habits.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground font-medium">
              Choose what you want to track every day.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-2">
              {HABIT_LIBRARY.map((h) => {
                const on = picked.includes(h.id);
                return (
                  <button
                    key={h.id}
                    onClick={() => togglePick(h.id)}
                    className={cn(
                      "flex items-center justify-between rounded-md border-2 px-4 py-3.5 text-left transition-colors",
                      on
                        ? "bg-foreground text-background border-foreground"
                        : "bg-surface border-border text-foreground"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-[15px] font-bold truncate">{h.name}</div>
                      <div className={cn("text-[12px] font-medium truncate", on ? "opacity-70" : "text-muted-foreground")}>
                        {h.hint}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "h-5 w-5 rounded-sm border-2 flex items-center justify-center shrink-0 ml-3",
                        on ? "bg-background border-background text-foreground" : "border-border"
                      )}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="sticky bottom-0 -mx-6 mt-8 px-6 pt-4 pb-6 bg-gradient-to-t from-background via-background to-transparent">
              <button
                disabled={picked.length === 0}
                onClick={() => setStep("categorize")}
                className="w-full bg-foreground text-background font-bold py-4 rounded-md disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {picked.length === 0 ? "Pick at least one" : `Continue with ${picked.length}`} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {step === "categorize" && (
          <section className="animate-fade-in">
            <h1 className="text-[28px] leading-tight font-bold tracking-tight text-foreground">
              Sort them.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground font-medium">
              Each habit lives under one category.
            </p>

            <div className="mt-8 space-y-3">
              {picked.map((id) => {
                const t = HABIT_LIBRARY.find((h) => h.id === id)!;
                const current = overrides[id] ?? t.defaultCategory;
                return (
                  <div key={id} className="bg-surface border border-border rounded-md p-3.5">
                    <div className="text-[15px] font-bold text-foreground">{t.name}</div>
                    <div className="text-[12px] font-medium text-muted-foreground mb-3">{t.hint}</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {CATEGORIES.map((cat) => {
                        const active = current === cat.id;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setOverrides((o) => ({ ...o, [id]: cat.id }))}
                            className={cn(
                              "py-2 rounded-sm border-2 text-[11px] font-bold transition-colors",
                              active
                                ? cat.id === "mind"
                                  ? "bg-mind border-mind text-mind-foreground"
                                  : cat.id === "home"
                                  ? "bg-home border-home text-home-foreground"
                                  : cat.id === "finances"
                                  ? "bg-finances border-finances text-finances-foreground"
                                  : "bg-energy border-energy text-energy-foreground"
                                : cat.id === "mind"
                                ? "border-mind text-mind"
                                : cat.id === "home"
                                ? "border-home text-home"
                                : cat.id === "finances"
                                ? "border-finances text-finances"
                                : "border-energy text-energy"
                            )}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 -mx-6 mt-8 px-6 pt-4 pb-6 bg-gradient-to-t from-background via-background to-transparent">
              <button
                onClick={finish}
                className="w-full bg-foreground text-background font-bold py-4 rounded-md flex items-center justify-center gap-2"
              >
                Start tracking <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}
      </div>
    </MobileShell>
  );
}
