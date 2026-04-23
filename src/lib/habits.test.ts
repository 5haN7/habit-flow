import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  archiveHabit,
  completeHabit,
  getActiveHabits,
  loadState,
  restoreHabit,
  todayISO,
  updateHabit,
  UserState,
} from "@/lib/habits";

describe("habit persistence helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-23T09:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("preserves streaks and history when a habit is renamed or recategorized", () => {
    const state = buildState();
    const completed = completeHabit(state, "habit-1");

    const updated = updateHabit(completed, "habit-1", {
      name: "Medication",
      category: "energy",
    });

    expect(updated.habits[0]).toMatchObject({
      id: "habit-1",
      name: "Medication",
      category: "energy",
      streak: 1,
      bestStreak: 1,
      history: [todayISO()],
      archived: false,
    });
  });

  it("archives a habit without deleting its track record and restores it intact", () => {
    const completed = completeHabit(buildState(), "habit-1");
    const archived = archiveHabit(completed, "habit-1");

    expect(getActiveHabits(archived.habits)).toHaveLength(0);
    expect(archived.habits[0]).toMatchObject({
      archived: true,
      archivedAt: todayISO(),
      history: [todayISO()],
      streak: 1,
    });

    const restored = restoreHabit(archived, "habit-1");

    expect(getActiveHabits(restored.habits)).toHaveLength(1);
    expect(restored.habits[0]).toMatchObject({
      archived: false,
      archivedAt: null,
      completedToday: true,
      history: [todayISO()],
      streak: 1,
    });
  });

  it("migrates older saved habits by defaulting archive fields safely", () => {
    localStorage.setItem(
      "streak.app.v1",
      JSON.stringify({
        name: "Shant",
        onboarded: true,
        habits: [
          {
            id: "habit-1",
            name: "Meditation",
            hint: "Track your progress",
            category: "mind",
            streak: 3,
            bestStreak: 4,
            lastCompleted: todayISO(),
            completedToday: false,
            history: [todayISO()],
          },
        ],
      }),
    );

    const loaded = loadState();

    expect(loaded?.habits[0]).toMatchObject({
      archived: false,
      archivedAt: null,
      completedToday: true,
    });
  });
});

function buildState(): UserState {
  return {
    name: "Shant",
    onboarded: true,
    habits: [
      {
        id: "habit-1",
        name: "Meditation",
        hint: "Track your progress",
        category: "mind",
        streak: 0,
        bestStreak: 0,
        lastCompleted: null,
        completedToday: false,
        history: [],
        archived: false,
        archivedAt: null,
      },
    ],
  };
}
