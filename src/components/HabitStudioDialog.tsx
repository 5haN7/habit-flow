import { useEffect, useMemo, useState } from "react";
import { Archive, Flame, PencilLine, RotateCcw, Sparkles } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_CLASSES,
  CategoryId,
  Habit,
  HabitUpdate,
  getActiveHabits,
  getArchivedHabits,
} from "@/lib/habits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface HabitStudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  habits: Habit[];
  onUpdateHabit: (id: string, updates: HabitUpdate) => void;
  onArchiveHabit: (id: string) => void;
  onRestoreHabit: (id: string) => void;
  onResetUser: () => void;
}

export default function HabitStudioDialog({
  open,
  onOpenChange,
  userName,
  habits,
  onUpdateHabit,
  onArchiveHabit,
  onRestoreHabit,
  onResetUser,
}: HabitStudioDialogProps) {
  const activeHabits = useMemo(() => getActiveHabits(habits), [habits]);
  const archivedHabits = useMemo(() => getArchivedHabits(habits), [habits]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftCategory, setDraftCategory] = useState<CategoryId>("mind");
  const [archiveTarget, setArchiveTarget] = useState<Habit | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (open) return;
    setEditingId(null);
    setDraftName("");
    setDraftCategory("mind");
    setArchiveTarget(null);
  }, [open]);

  const startEditing = (habit: Habit) => {
    setEditingId(habit.id);
    setDraftName(habit.name);
    setDraftCategory(habit.category);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftName("");
  };

  const saveHabit = () => {
    if (!editingId) return;
    const trimmed = draftName.trim();
    if (!trimmed) return;

    onUpdateHabit(editingId, { name: trimmed, category: draftCategory });
    setEditingId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md gap-0 overflow-hidden rounded-[28px] border-0 bg-[#f8f6ef] p-0 shadow-2xl sm:rounded-[28px]">
          <div className="flex max-h-[85vh] flex-col">
            <DialogHeader className="border-b border-black/5 bg-white/70 px-6 py-6 text-left backdrop-blur">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                <Sparkles className="h-3.5 w-3.5" />
                Routine Studio
              </div>
              <DialogTitle className="mt-3 text-[26px] font-bold tracking-tight text-slate-900">
                Keep the streak, switch the vibe.
              </DialogTitle>
              <DialogDescription className="mt-2 text-[14px] leading-6 text-slate-600">
                Rename or move any habit for {userName} without losing check-ins, streaks, or history.
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto px-6 pb-6">
              <section className="mt-5 rounded-[24px] border border-slate-200/80 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Active habits
                    </p>
                    <p className="mt-1 text-[14px] text-slate-600">
                      Edit the label or category. Your streak stays attached to the same habit.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[12px] font-bold text-white">
                    {activeHabits.length}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {activeHabits.map((habit) => {
                    const categoryMeta = CATEGORIES.find((category) => category.id === habit.category);
                    const categoryClass = CATEGORY_CLASSES[habit.category];
                    const isEditing = editingId === habit.id;

                    return (
                      <div
                        key={habit.id}
                        className="rounded-[24px] border border-slate-200 bg-[#fcfbf7] p-4 shadow-sm transition-all duration-300"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-1 h-3 w-3 rounded-full shadow-sm"
                            style={{ backgroundColor: categoryClass.chart }}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-[16px] font-bold tracking-tight text-slate-900">
                                {habit.name}
                              </p>
                              {habit.completedToday && (
                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                                  Done today
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[13px] text-slate-500">
                              {categoryMeta?.label} · {habit.history.length} check-ins · best {habit.bestStreak}d
                            </p>
                          </div>
                          <div className="ml-2 flex shrink-0 items-center gap-2">
                            <div className="flex items-center gap-1 rounded-full bg-slate-900 px-3 py-2 text-[12px] font-bold text-white">
                              <Flame className="h-3.5 w-3.5" />
                              <span className="tabular-nums">{habit.streak}d</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => startEditing(habit)}
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-all duration-200 hover:scale-105 hover:shadow-sm",
                                isEditing && "border-slate-900 text-slate-900"
                              )}
                              aria-label={`Edit ${habit.name}`}
                            >
                              <PencilLine className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {isEditing && (
                          <div className="mt-4 space-y-4 rounded-[22px] border border-slate-200 bg-white p-4">
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                Habit name
                              </label>
                              <Input
                                value={draftName}
                                onChange={(event) => setDraftName(event.target.value)}
                                placeholder="Medication"
                                className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-[15px] font-semibold"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                Category
                              </label>
                              <Select
                                value={draftCategory}
                                onValueChange={(value) => setDraftCategory(value as CategoryId)}
                              >
                                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-[15px] font-semibold">
                                  <SelectValue placeholder="Pick a category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {CATEGORIES.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <p className="text-[12px] leading-5 text-slate-500">
                              Save to update the habit in place. Every past completion stays with it.
                            </p>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={saveHabit}
                                className="h-11 flex-1 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                              >
                                Save changes
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={cancelEditing}
                                className="h-11 rounded-full border-slate-200 px-5"
                              >
                                Cancel
                              </Button>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setArchiveTarget(habit)}
                              className="h-auto rounded-full px-0 py-0 text-[13px] font-semibold text-rose-600 hover:bg-transparent hover:text-rose-700"
                            >
                              Archive habit
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {archivedHabits.length > 0 && (
                <section className="mt-5 rounded-[24px] border border-slate-200/80 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        Archived history
                      </p>
                      <p className="mt-1 text-[14px] text-slate-600">
                        Hidden from the daily list, still safe in your stats.
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-[12px] font-bold text-slate-700">
                      {archivedHabits.length}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {archivedHabits.map((habit) => {
                      const categoryMeta = CATEGORIES.find((category) => category.id === habit.category);

                      return (
                        <div
                          key={habit.id}
                          className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-[#fcfbf7] p-4"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-bold text-slate-900">{habit.name}</p>
                            <p className="mt-1 text-[13px] text-slate-500">
                              {categoryMeta?.label} · {habit.history.length} check-ins saved
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => onRestoreHabit(habit.id)}
                            className="h-10 rounded-full border-slate-200 px-4 text-[13px] font-semibold"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Restore
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="mt-5 rounded-[24px] border border-rose-100 bg-rose-50/70 p-4 shadow-sm">
                <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-rose-500">
                  Danger zone
                </p>
                <p className="mt-2 text-[14px] leading-6 text-rose-700/80">
                  Reset clears everything, including streaks and archived history.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResetOpen(true)}
                  className="mt-4 h-11 rounded-full border-rose-200 bg-white px-5 text-[13px] font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-800"
                >
                  Reset app
                </Button>
              </section>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!archiveTarget} onOpenChange={(isOpen) => !isOpen && setArchiveTarget(null)}>
        <AlertDialogContent className="max-w-sm rounded-[24px] border-0 bg-[#fcfbf7] p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-left text-[22px] font-bold tracking-tight text-slate-900">
              Archive {archiveTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left text-[14px] leading-6 text-slate-600">
              This removes it from your daily routine, but keeps every streak and check-in safe in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="rounded-full border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => {
                if (!archiveTarget) return;
                onArchiveHabit(archiveTarget.id);
                setEditingId(null);
                setArchiveTarget(null);
              }}
            >
              <Archive className="h-4 w-4" />
              Archive habit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="max-w-sm rounded-[24px] border-0 bg-[#fcfbf7] p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-left text-[22px] font-bold tracking-tight text-slate-900">
              Reset everything?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left text-[14px] leading-6 text-slate-600">
              This clears your habits, streaks, to-dos, and archived history. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="rounded-full border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => {
                onResetUser();
                setResetOpen(false);
                onOpenChange(false);
              }}
            >
              Reset app
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
