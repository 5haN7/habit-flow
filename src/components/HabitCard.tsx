import { useEffect, useRef, useState, useCallback } from "react";
import { Habit, CATEGORY_CLASSES } from "@/lib/habits";
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
      className="relative select-none"
      style={{ touchAction: "pan-y" }} // Allow vertical scroll, handle horizontal
    >
      {/* Pill track */}
      <div
        ref={trackRef}
        className={cn(
          "relative w-full overflow-hidden rounded-full border-2 transition-all duration-300",
          "h-[64px]",
          completed ? cn(c.fill, c.border) : cn("bg-surface", c.border),
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

        {/* Draggable handle with both pointer and touch support */}
        <button
          type="button"
          aria-label={completed ? `Tap to undo ${habit.name}` : `Slide to complete ${habit.name}`}
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
            completed
              ? "bg-white/20 text-current"
              : cn("bg-surface", c.text, "hover:shadow-xl")
          )}
          style={{
            width: HANDLE,
            height: HANDLE,
            left: completed ? `calc(100% - ${HANDLE + PAD}px)` : PAD + dragX,
            touchAction: "none",
          }}
        >
          {completed ? (
            <Check className="h-5 w-5" strokeWidth={3} />
          ) : (
            <ArrowRight 
              className={cn(
                "h-5 w-5 transition-transform duration-150",
                progress > 0.3 && "rotate-0",
                progress > 0.7 && "scale-110"
              )} 
              strokeWidth={2.25} 
            />
          )}
        </button>
      </div>
    </div>
  );
}
