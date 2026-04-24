import { useEffect, useRef, useState, useCallback } from "react";
import { Habit, CATEGORY_CLASSES, CATEGORIES } from "@/lib/habits";
import { ArrowRight, Check, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: Habit;
  onComplete: () => void;
}

const HANDLE = 56;
const PAD = 4;
const THRESHOLD = 0.75; // Must drag 75% to complete

export default function HabitCard({ habit, onComplete }: HabitCardProps) {
  const c = CATEGORY_CLASSES[habit.category];
  const category = CATEGORIES.find((item) => item.id === habit.category);
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use refs for immediate updates during drag (no React render lag)
  const dragXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  
  // State for React (visual updates)
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [trackW, setTrackW] = useState(0);
  
  const completed = habit.completedToday;
  const maxX = Math.max(0, trackW - HANDLE - PAD * 2);
  const progress = maxX === 0 ? 0 : dragX / maxX;

  // Measure track width
  useEffect(() => {
    if (!trackRef.current) return;
    const el = trackRef.current;
    const update = () => setTrackW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Safety: reset if stuck (timeout mechanism)
  useEffect(() => {
    if (!isDragging) return;
    const timeout = setTimeout(() => {
      if (isDraggingRef.current) {
        // Force reset if drag lasted too long (stuck detection)
        isDraggingRef.current = false;
        dragXRef.current = 0;
        setIsDragging(false);
        setDragX(0);
      }
    }, 10000); // 10 second safety timeout
    return () => clearTimeout(timeout);
  }, [isDragging]);

  // Update visual position using RAF for smoothness
  const updatePosition = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setDragX(dragXRef.current);
    });
  }, []);

  // Handle start (supports both mouse and touch)
  const handleStart = useCallback((clientX: number) => {
    if (completed) return;
    isDraggingRef.current = true;
    startXRef.current = clientX - dragXRef.current;
    setIsDragging(true);
  }, [completed]);

  // Handle move
  const handleMove = useCallback((clientX: number) => {
    if (!isDraggingRef.current || completed) return;
    const raw = clientX - startXRef.current;
    const clamped = Math.min(maxX, Math.max(0, raw));
    dragXRef.current = clamped;
    updatePosition();
  }, [maxX, completed, updatePosition]);

  // Handle end
  const handleEnd = useCallback(() => {
    if (!isDraggingRef.current || completed) return;
    
    isDraggingRef.current = false;
    setIsDragging(false);
    
    const progress = maxX === 0 ? 0 : dragXRef.current / maxX;
    
    if (progress >= THRESHOLD && maxX > 0) {
      // Success - snap to end then complete
      dragXRef.current = maxX;
      setDragX(maxX);
      onComplete();
      // Reset after completion (for next day)
      setTimeout(() => {
        dragXRef.current = 0;
        setDragX(0);
      }, 300);
    } else {
      // Failed - spring back
      dragXRef.current = 0;
      setDragX(0);
    }
  }, [maxX, completed, onComplete]);

  // Pointer events
  const onPointerDown = (e: React.PointerEvent) => {
    handleStart(e.clientX);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // setPointerCapture might fail on some browsers, ignore
    }
  };
  
  const onPointerMove = (e: React.PointerEvent) => {
    handleMove(e.clientX);
  };
  
  const onPointerUp = (e: React.PointerEvent) => {
    handleEnd();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // releasePointerCapture might fail, ignore
    }
  };

  // Touch events (fallback for mobile)
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX);
  };
  
  const onTouchEnd = () => {
    handleEnd();
  };

  // Click to complete (accessibility fallback)
  const onClick = () => {
    if (completed) {
      onComplete(); // Toggle off
    } else if (!isDraggingRef.current && dragXRef.current === 0) {
      // If user taps without dragging, complete immediately
      onComplete();
    }
  };

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      onClick={completed ? onClick : undefined}
      className={cn(
        "relative select-none",
        completed && "cursor-pointer active:scale-[0.98] transition-transform duration-150"
      )}
      style={{ touchAction: "pan-y" }} // Allow vertical scroll, handle horizontal
    >
      {/* Pill track */}
      <div
        ref={trackRef}
        className={cn(
          "relative w-full overflow-hidden rounded-full border-2 transition-all duration-300",
          "h-[64px]",
          completed 
            ? cn(c.fill, c.border, "shadow-lg") 
            : cn("bg-surface", c.border),
          isDragging && "scale-[1.02]"
        )}
        style={{ padding: PAD }}
      >
        {/* Progress fill background */}
        {!completed && (
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-150",
              c.softBg
            )}
            style={{ 
              width: `${progress * 100}%`,
              margin: PAD,
            }}
          />
        )}

        {/* Center label */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none",
            completed ? "flex items-center justify-between px-5" : "flex items-center justify-center px-20",
          )}
        >
          {completed ? (
            <>
              {/* Left: Habit info - inherits text color from parent c.fill */}
              <div className="min-w-0 flex-1 text-current">
                <div className="truncate text-[17px] font-bold tracking-tight">
                  {habit.name}
                </div>
                <div className="truncate text-[12px] font-medium opacity-80">
                  {category?.label} · Done today
                </div>
              </div>

              {/* Right: Gen Z Premium Streak */}
              <div className="shrink-0 flex flex-col items-end text-current">
                <div className="flex items-baseline gap-1">
                  <Flame 
                    className="h-5 w-5 opacity-90 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" 
                    strokeWidth={2.5} 
                    fill="currentColor"
                  />
                  <span className="text-[22px] font-bold tabular-nums leading-none">
                    {habit.streak}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70 mt-0.5">
                  {habit.streak === 1 ? "day streak" : "days"}
                </span>
              </div>
            </>
          ) : (
            <div className="min-w-0 text-center">
              <div
                className={cn(
                  "text-[14px] font-bold tracking-tight truncate transition-all duration-150",
                  c.text
                )}
                style={{ 
                  opacity: 1 - progress * 0.6,
                  transform: `translateX(${progress * 20}px)`
                }}
              >
                {habit.name}
              </div>
              <div
                className="text-[11px] font-medium text-muted-foreground truncate transition-all duration-150"
                style={{ 
                  opacity: 1 - progress,
                  transform: `translateX(${progress * 10}px)`
                }}
              >
                {progress > 0.5 ? "Release to complete" : "Slide to complete"}
              </div>
            </div>
          )}
        </div>

        {/* Streak indicator */}
        {!completed && (
          <div
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-bold transition-all duration-150",
              c.text
            )}
            style={{ 
              opacity: 1 - progress,
              transform: `translateX(${progress * 30}px)`
            }}
          >
            <Flame className="h-3.5 w-3.5" />
            <span className="tabular-nums">{habit.streak}</span>
          </div>
        )}

        {/* Draggable handle - hidden when completed, shown when not */}
        {!completed && (
          <button
            type="button"
            aria-label={`Slide to complete ${habit.name}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={onClick}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full flex items-center justify-center",
              "shadow-lg cursor-grab active:cursor-grabbing",
              isDragging ? "transition-none cursor-grabbing shadow-xl scale-110" : "transition-all duration-200",
              cn("bg-surface", c.text, "hover:shadow-xl")
            )}
            style={{
              width: HANDLE,
              height: HANDLE,
              left: PAD + dragX,
              touchAction: "none",
            }}
          >
            <ArrowRight 
              className={cn(
                "h-5 w-5 transition-transform duration-150",
                progress > 0.3 && "rotate-0",
                progress > 0.7 && "scale-110"
              )} 
              strokeWidth={2.25} 
            />
          </button>
        )}
      </div>
    </div>
  );
}
