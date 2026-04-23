import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Plus, X } from "lucide-react";
import { saveState, UserState, Habit, todayISO } from "@/lib/habits";
import { useApp } from "@/store/useAppStore";

const GROUPS = [
  { name: "Mind", color: "#4CC9F0" },
  { name: "Home", color: "#7BD88F" },
  { name: "Finances", color: "#A78BFA" },
  { name: "Energy", color: "#F59E0B" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [name, setName] = useState("");
  const [step, setStep] = useState(1);
  const [habit, setHabit] = useState("");
  const [group, setGroup] = useState("Mind");
  const [items, setItems] = useState<{ name: string; group: string }[]>([]);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  const wordCount = habit.trim().split(/\s+/).filter(Boolean).length;
  const validHabit = habit.trim().length > 0 && wordCount <= 4;
  const canContinue = name.trim().length > 0;

  useEffect(() => {
    if (!done) return;
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(() => setReady(true), 700);
          return 100;
        }
        return p + 2;
      });
    }, 45);
    return () => clearInterval(timer);
  }, [done]);

  const addHabit = () => {
    if (!validHabit) return;
    setItems([...items, { name: habit.trim(), group }]);
    setHabit("");
  };

  const removeHabit = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const startTracking = () => {
    if (!items.length) return;
    
    // Convert selected habits to the proper Habit format
    const habits: Habit[] = items.map((item, index) => ({
      id: `habit-${Date.now()}-${index}`,
      name: item.name,
      hint: "Track your progress",
      category: item.group.toLowerCase() as "mind" | "home" | "finances" | "energy",
      streak: 0,
      bestStreak: 0,
      lastCompleted: null,
      completedToday: false,
      history: [],
    }));

    // Create UserState in the format expected by Home component
    const userState: UserState = {
      name,
      onboarded: true,
      habits,
    };

    // Save using the proper saveState function and update app state immediately
    saveState(userState);
    setUser(userState);
    setDone(true);
  };

  if (ready) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] p-4 font-['DM_Sans'] text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6">
          <div className="space-y-3 text-center">
            <p className="text-sm tracking-[0.25em] text-slate-500">SETUP COMPLETE</p>
            <h1 className="text-3xl font-bold">Let’s start this journey</h1>
            <p className="text-slate-600">Your habits are ready. Tap to begin tracking.</p>
          </div>
          <button
            onClick={() => {
              localStorage.setItem("habitflow_ready", "1");
              navigate("/home");
            }}
            className="w-full rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-4 font-bold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
          >
            Start journey <ArrowRight className="inline h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] p-4 font-['DM_Sans'] text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 text-center">
          <div className="space-y-3">
            <p className="text-sm tracking-[0.25em] text-slate-500">SETUP IN PROGRESS</p>
            <h1 className="text-3xl font-bold">Getting your habits ready</h1>
            <p className="text-slate-600">We are building your personal flow.</p>
          </div>
          <div className="w-full space-y-3">
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-slate-900 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-5xl font-bold">{progress}%</p>
          </div>
          <div className="grid w-full gap-3">
            {items.map((it, i) => {
              const c = GROUPS.find((g) => g.name === it.group)?.color ?? "#CBD5E1";
              return (
                <div key={i} className="flex items-center justify-between rounded-3xl border bg-white px-5 py-4" style={{ borderColor: c }}>
                  <div>
                    <p className="font-bold" style={{ color: c }}>{it.name}</p>
                    <p className="text-xs text-slate-500">{it.group}</p>
                  </div>
                  <div className="h-9 w-9 rounded-full" style={{ background: c, opacity: 0.2 }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] p-4 font-['DM_Sans'] text-slate-900">
      <div className="mx-auto max-w-md space-y-5">
        <div>
          <p className="text-sm text-slate-500">Habit Flow</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">
            {step === 1 ? "Let's begin." : "Add your habits."}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {step === 1 ? "Tell us your name." : "Habit names must be 4 words or less."}
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              className="w-full rounded-3xl border-2 border-slate-200 bg-white px-5 py-4 text-xl outline-none placeholder:text-slate-400 transition-all duration-300 focus:border-slate-400 focus:scale-[1.01] focus:shadow-lg"
            />
            <button
              disabled={!canContinue}
              onClick={() => setStep(2)}
              className="w-full rounded-3xl bg-slate-900 px-4 py-4 font-bold text-white disabled:opacity-40 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              Continue <ArrowRight className="inline h-4 w-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <input
                value={habit}
                onChange={(e) => setHabit(e.target.value)}
                placeholder="Habit name"
                className="w-full rounded-3xl border-2 border-slate-200 bg-white px-5 py-4 outline-none transition-all duration-300 focus:border-slate-400 focus:scale-[1.01] focus:shadow-lg"
              />
              <p className="text-xs text-slate-500">Max 4 words.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {GROUPS.map((g) => {
                const active = group === g.name;
                return (
                  <button
                    key={g.name}
                    onClick={() => setGroup(g.name)}
                    className="rounded-3xl border-2 px-3 py-3 font-bold transition-all duration-300 hover:scale-[1.05] hover:shadow-md active:scale-[0.95]"
                    style={{
                      borderColor: g.color,
                      background: active ? g.color : "#fff",
                      color: active ? "#fff" : g.color,
                    }}
                  >
                    {g.name}
                  </button>
                );
              })}
            </div>

            <button
              disabled={!validHabit}
              onClick={addHabit}
              className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-slate-200 bg-white px-4 py-4 font-bold disabled:opacity-40 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> Add habit
            </button>

            <div className="space-y-3">
              {items.map((it, idx) => {
                const c = GROUPS.find((g) => g.name === it.group)?.color ?? "#CBD5E1";
                return (
                  <div key={`${it.name}-${idx}`} className="flex items-center justify-between rounded-3xl border bg-white px-5 py-4" style={{ borderColor: c }}>
                    <div>
                      <p className="font-bold" style={{ color: c }}>{it.name}</p>
                      <p className="text-xs text-slate-500">{it.group}</p>
                    </div>
                    <button onClick={() => removeHabit(idx)} className="text-slate-400">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              disabled={items.length === 0}
              onClick={startTracking}
              className="w-full rounded-3xl bg-slate-900 px-4 py-4 font-bold text-white disabled:opacity-40 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            >
              Start tracking <Check className="inline h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
