export type CategoryId = "mind" | "home" | "finances" | "energy";

export interface Category {
  id: CategoryId;
  label: string;
  hint: string;
}

export const CATEGORIES: Category[] = [
  { id: "mind", label: "Mind", hint: "Focus, calm & clarity" },
  { id: "home", label: "Home", hint: "Care for your space" },
  { id: "finances", label: "Finances", hint: "Money, mindfully" },
  { id: "energy", label: "Energy", hint: "Move, rest, fuel" },
];

export interface HabitTemplate {
  id: string;
  name: string;
  hint: string;
  defaultCategory: CategoryId;
}

export const HABIT_LIBRARY: HabitTemplate[] = [
  { id: "meditate", name: "Meditate", hint: "10 minutes of stillness", defaultCategory: "mind" },
  { id: "read", name: "Read", hint: "20 pages a day", defaultCategory: "mind" },
  { id: "journal", name: "Journal", hint: "One page, free writing", defaultCategory: "mind" },
  { id: "no-phone-am", name: "No phone first hour", hint: "Mornings unplugged", defaultCategory: "mind" },

  { id: "make-bed", name: "Make the bed", hint: "Start tidy", defaultCategory: "home" },
  { id: "dishes", name: "Clean the kitchen", hint: "Reset the counter", defaultCategory: "home" },
  { id: "tidy-15", name: "Tidy 15 minutes", hint: "Quick reset", defaultCategory: "home" },
  { id: "laundry", name: "Laundry cycle", hint: "Wash, fold, away", defaultCategory: "home" },

  { id: "track-spend", name: "Log spending", hint: "Every transaction", defaultCategory: "finances" },
  { id: "save", name: "Save something", hint: "Any amount counts", defaultCategory: "finances" },
  { id: "no-spend", name: "No-spend day", hint: "Essentials only", defaultCategory: "finances" },
  { id: "review-budget", name: "Review budget", hint: "5 minute check", defaultCategory: "finances" },

  { id: "workout", name: "Workout", hint: "Move with intent", defaultCategory: "energy" },
  { id: "walk", name: "10k steps", hint: "Stay in motion", defaultCategory: "energy" },
  { id: "water", name: "Drink 2L water", hint: "Hydrate steadily", defaultCategory: "energy" },
  { id: "sleep", name: "Sleep by 11", hint: "Protect your rest", defaultCategory: "energy" },
];

export interface Habit {
  id: string;
  name: string;
  hint: string;
  category: CategoryId;
  streak: number;
  bestStreak: number;
  lastCompleted: string | null; // ISO date YYYY-MM-DD
  completedToday: boolean;
  history: string[]; // ISO dates of completions
  archived: boolean;
  archivedAt: string | null;
}

export interface UserState {
  name: string;
  onboarded: boolean;
  habits: Habit[];
}

const STORAGE_KEY = "streak.app.v1";

export interface HabitUpdate {
  name: string;
  category: CategoryId;
  hint?: string;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadState(): UserState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserState;
    const today = todayISO();
    parsed.habits = parsed.habits.map((h) => normalizeHabit(h, today));
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state: UserState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function completeHabit(state: UserState, habitId: string): UserState {
  const today = todayISO();
  const yest = yesterdayISO();
  return {
    ...state,
    habits: state.habits.map((h) => {
      if (h.id !== habitId) return h;
      if (h.archived) return h;
      if (h.lastCompleted === today) return h;
      const continued = h.lastCompleted === yest;
      const newStreak = continued ? h.streak + 1 : 1;
      return {
        ...h,
        streak: newStreak,
        bestStreak: Math.max(h.bestStreak, newStreak),
        lastCompleted: today,
        completedToday: true,
        history: Array.from(new Set([...(h.history ?? []), today])),
      };
    }),
  };
}

export function uncompleteHabit(state: UserState, habitId: string): UserState {
  const today = todayISO();
  return {
    ...state,
    habits: state.habits.map((h) => {
      if (h.id !== habitId || h.lastCompleted !== today) return h;
      const history = (h.history ?? []).filter((d) => d !== today);
      const newStreak = Math.max(0, h.streak - 1);
      return {
        ...h,
        streak: newStreak,
        lastCompleted: history[history.length - 1] ?? null,
        completedToday: false,
        history,
      };
    }),
  };
}

export function updateHabit(state: UserState, habitId: string, updates: HabitUpdate): UserState {
  const trimmedName = updates.name.trim();
  const trimmedHint = updates.hint?.trim();

  if (!trimmedName) return state;

  return {
    ...state,
    habits: state.habits.map((h) =>
      h.id === habitId
        ? {
            ...h,
            name: trimmedName,
            category: updates.category,
            hint: trimmedHint || h.hint,
          }
        : h,
    ),
  };
}

export function archiveHabit(state: UserState, habitId: string): UserState {
  const archivedAt = todayISO();
  return {
    ...state,
    habits: state.habits.map((h) =>
      h.id === habitId
        ? {
            ...h,
            archived: true,
            archivedAt,
          }
        : h,
    ),
  };
}

export function restoreHabit(state: UserState, habitId: string): UserState {
  const today = todayISO();
  return {
    ...state,
    habits: state.habits.map((h) =>
      h.id === habitId
        ? {
            ...h,
            archived: false,
            archivedAt: null,
            completedToday: h.lastCompleted === today,
          }
        : h,
    ),
  };
}

export function getActiveHabits(habits: Habit[]) {
  return habits.filter((habit) => !habit.archived);
}

export function getArchivedHabits(habits: Habit[]) {
  return habits.filter((habit) => habit.archived);
}

function normalizeHabit(habit: Habit, today = todayISO()): Habit {
  return {
    ...habit,
    hint: habit.hint || "Track your progress",
    completedToday: habit.lastCompleted === today,
    history: Array.isArray(habit.history) ? habit.history : [],
    archived: habit.archived ?? false,
    archivedAt: habit.archivedAt ?? null,
  };
}

export const CATEGORY_CLASSES: Record<
  CategoryId,
  {
    border: string;
    text: string;
    fill: string;
    softBg: string;
    dot: string;
    ring: string;
    chart: string; // hsl var name
  }
> = {
  mind: {
    border: "border-mind",
    text: "text-mind",
    fill: "bg-mind text-mind-foreground",
    softBg: "bg-mind-soft",
    dot: "bg-mind",
    ring: "ring-mind",
    chart: "hsl(var(--cat-mind))",
  },
  home: {
    border: "border-home",
    text: "text-home",
    fill: "bg-home text-home-foreground",
    softBg: "bg-home-soft",
    dot: "bg-home",
    ring: "ring-home",
    chart: "hsl(var(--cat-home))",
  },
  finances: {
    border: "border-finances",
    text: "text-finances",
    fill: "bg-finances text-finances-foreground",
    softBg: "bg-finances-soft",
    dot: "bg-finances",
    ring: "ring-finances",
    chart: "hsl(var(--cat-finances))",
  },
  energy: {
    border: "border-energy",
    text: "text-energy",
    fill: "bg-energy text-energy-foreground",
    softBg: "bg-energy-soft",
    dot: "bg-energy",
    ring: "ring-energy",
    chart: "hsl(var(--cat-energy))",
  },
};
