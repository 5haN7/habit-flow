import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  HabitUpdate,
  UserState,
  archiveHabit as archiveHabitInState,
  clearState,
  completeHabit,
  loadState,
  restoreHabit as restoreHabitInState,
  saveState,
  todayISO,
  uncompleteHabit,
  updateHabit as updateHabitInState,
} from "@/lib/habits";

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  date: string; // ISO
}

interface AppContextShape {
  user: UserState | null;
  setUser: (u: UserState) => void;
  resetUser: () => void;
  toggleHabit: (id: string) => void;
  updateHabit: (id: string, updates: HabitUpdate) => void;
  archiveHabit: (id: string) => void;
  restoreHabit: (id: string) => void;
  todos: TodoItem[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
}

const AppContext = createContext<AppContextShape | null>(null);

const TODOS_KEY = "streak.todos.v1";

function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(TODOS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TodoItem[];
  } catch {
    return [];
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserState | null>(() => loadState());
  const [todos, setTodos] = useState<TodoItem[]>(() => loadTodos());

  useEffect(() => {
    if (user) saveState(user);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  }, [todos]);

  const setUser = useCallback((u: UserState) => setUserState(u), []);
  const resetUser = useCallback(() => {
    clearState();
    setUserState(null);
  }, []);

  const toggleHabit = useCallback((id: string) => {
    setUserState((prev) => {
      if (!prev) return prev;
      const habit = prev.habits.find((h) => h.id === id);
      if (!habit) return prev;
      return habit.completedToday ? uncompleteHabit(prev, id) : completeHabit(prev, id);
    });
  }, []);

  const updateHabit = useCallback((id: string, updates: HabitUpdate) => {
    setUserState((prev) => (prev ? updateHabitInState(prev, id, updates) : prev));
  }, []);

  const archiveHabit = useCallback((id: string) => {
    setUserState((prev) => (prev ? archiveHabitInState(prev, id) : prev));
  }, []);

  const restoreHabit = useCallback((id: string) => {
    setUserState((prev) => (prev ? restoreHabitInState(prev, id) : prev));
  }, []);

  const addTodo = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      { id: crypto.randomUUID(), text: trimmed, done: false, date: todayISO() },
      ...prev,
    ]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const removeTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      resetUser,
      toggleHabit,
      updateHabit,
      archiveHabit,
      restoreHabit,
      todos,
      addTodo,
      toggleTodo,
      removeTodo,
    }),
    [
      user,
      setUser,
      resetUser,
      toggleHabit,
      updateHabit,
      archiveHabit,
      restoreHabit,
      todos,
      addTodo,
      toggleTodo,
      removeTodo,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
