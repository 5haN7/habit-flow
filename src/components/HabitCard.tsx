import { useEffect, useRef, useState } from "react";
import { Habit, CATEGORY_CLASSES } from "@/lib/habits";
import { ArrowRight, Check, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: Habit;
  onComplete: () => void;
}

const HANDLE = 56; // px — circular handle diameter
const PAD = 4; // px — inner padding around track

export default function HabitCard({ habit, onComplete }: HabitCardProps) {
  const c = CATEGORY_CLASSES[habit.category];
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const [trackW, setTrackW] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const completed = habit.completedToday;

  // measure track
  useEffect(() => {
    if (!trackRef.current) return;
    const el = trackRef.current;
    const update = () => setTrackW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxX = Math.max(0, trackW - HANDLE - PAD * 2);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (completed) return;
    startX.current = e.clientX - dragX;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (startX.current == null || completed) return;
    const next = Math.min(maxX, Math.max(0, e.clientX - startX.current));
    setDragX(next);
  };
  const handlePointerUp = () => {
    if (completed) return;
    setDragging(false);
    if (dragX >= maxX - 4 && maxX > 0) {
      // snap to end then trigger
      setDragX(maxX);
      onComplete();
      // reset for next day cycle (will be hidden by completed state)
      setTimeout(() => setDragX(0), 280);
    } else {
      setDragX(0);
    }
    startX.current = null;
  };

  const progress = maxX === 0 ? 0 : dragX / maxX;

  return (
    <div className="relative select-none">
      {/* Pill track */}
      <div
        ref={trackRef}
        className={cn(
          "relative w-full overflow-hidden rounded-full border-2 transition-colors duration-300",
          "h-[64px]",
          completed ? cn(c.fill, c.border) : cn("bg-surface", c.border)
        )}
        style={{ padding: PAD }}
      >
        {/* Filled progress trail (incomplete state) */}
        {!completed && (
          <div
            className={cn("absolute inset-0 rounded-full transition-opacity", c.softBg)}
            style={{
              clipPath: `inset(0 ${(1 - progress) * 100}% 0 0 round 9999px)`,
              opacity: 1,
            }}
            aria-hidden
          />
        )}

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-20">
          {completed ? (
            <div className="flex items-center gap-2 text-[14px] font-bold tracking-tight text-current">
              <Check className="h-4 w-4" strokeWidth={3} />
              <span>Done · {habit.streak} day{habit.streak === 1 ? "" : "s"}</span>
            </div>
          ) : (
            <div className="min-w-0 text-center">
              <div
                className={cn(
                  "text-[14px] font-bold tracking-tight truncate transition-opacity",
                  c.text
                )}
                style={{ opacity: 1 - progress * 0.6 }}
              >
                {habit.name}
              </div>
              <div
                className="text-[11px] font-medium text-muted-foreground truncate transition-opacity"
                style={{ opacity: 1 - progress }}
              >
                Slide to complete
              </div>
            </div>
          )}
        </div>

        {/* Streak chip on the right (incomplete only) */}
        {!completed && (
          <div
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-bold transition-opacity",
              c.text
            )}
            style={{ opacity: 1 - progress }}
          >
            <Flame className="h-3.5 w-3.5" />
            <span className="tabular-nums">{habit.streak}</span>
          </div>
        )}

        {/* Draggable handle */}
        <button
          type="button"
          aria-label={completed ? `Tap to undo ${habit.name}` : `Slide to complete ${habit.name}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={() => completed && onComplete()}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center touch-none",
            "shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
            dragging ? "transition-none" : "transition-[transform,background-color,left] duration-300",
            completed
              ? "bg-white/20 text-current"
              : cn("bg-surface", c.text)
          )}
          style={{
            width: HANDLE,
            height: HANDLE,
            left: completed ? `calc(100% - ${HANDLE + PAD}px)` : PAD + dragX,
          }}
        >
          {completed ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : (
            <ArrowRight className="h-5 w-5" strokeWidth={2.25} />
          )}
        </button>
      </div>
    </div>
  );
}
