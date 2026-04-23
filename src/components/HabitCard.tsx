import { useRef, useState } from "react";
import { Habit, CATEGORY_CLASSES } from "@/lib/habits";
import { Flame, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: Habit;
  onComplete: () => void;
}

const SWIPE_THRESHOLD = 110;

export default function HabitCard({ habit, onComplete }: HabitCardProps) {
  const c = CATEGORY_CLASSES[habit.category];
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);
  const completed = habit.completedToday;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (completed) return;
    startX.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (startX.current == null || completed) return;
    const dx = Math.max(0, e.clientX - startX.current);
    setDragX(Math.min(dx, 220));
  };
  const handlePointerUp = () => {
    if (completed) {
      startX.current = null;
      return;
    }
    if (dragX >= SWIPE_THRESHOLD) {
      onComplete();
    }
    setDragX(0);
    startX.current = null;
  };

  const progress = Math.min(1, dragX / SWIPE_THRESHOLD);

  return (
    <div className="relative select-none">
      {/* swipe trail */}
      {!completed && (
        <div
          className={cn("absolute inset-0 rounded-md transition-opacity", c.softBg)}
          style={{ opacity: progress * 0.9 }}
          aria-hidden
        />
      )}

      <button
        type="button"
        onClick={() => completed && onComplete()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          "relative w-full text-left rounded-md border-2 px-4 py-4 flex items-center justify-between gap-3 transition-[background-color,color,transform,border-color] duration-300 touch-none",
          completed
            ? cn(c.fill, c.border)
            : cn("bg-surface", c.border, c.text, "active:scale-[0.995]")
        )}
        style={{
          transform: completed ? undefined : `translateX(${dragX}px)`,
        }}
        aria-pressed={completed}
      >
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "text-[15px] font-bold leading-tight tracking-tight truncate",
              completed ? "text-mind-foreground" : c.text
            )}
            style={completed ? { color: "hsl(var(--cat-" + habit.category + "-foreground))" } : undefined}
          >
            {habit.name}
          </div>
          <div
            className={cn(
              "mt-0.5 text-[12px] font-medium truncate",
              completed ? "opacity-80" : "opacity-70"
            )}
          >
            {completed ? "Done for today · tap to undo" : habit.hint}
          </div>
        </div>

        <div
          className={cn(
            "shrink-0 flex items-center gap-1.5 rounded-sm px-2 py-1 text-[12px] font-bold",
            completed ? "bg-white/20" : cn(c.softBg, c.text)
          )}
        >
          {completed ? <Check className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />}
          <span>{habit.streak}</span>
        </div>
      </button>

      {!completed && (
        <div className="mt-1.5 px-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Swipe right to complete →
        </div>
      )}
    </div>
  );
}
