import { ReactNode } from "react";
import { CATEGORY_CLASSES, CategoryId } from "@/lib/habits";
import { cn } from "@/lib/utils";

interface CategoryHeaderProps {
  category: CategoryId;
  label: string;
  count: number;
  done: number;
  children?: ReactNode;
}

export default function CategoryHeader({ category, label, count, done }: CategoryHeaderProps) {
  const c = CATEGORY_CLASSES[category];
  const pct = count === 0 ? 0 : Math.round((done / count) * 100);
  return (
    <div className="flex items-end justify-between mb-3 px-1">
      <div className="flex items-center gap-2.5">
        <span className={cn("h-2.5 w-2.5 rounded-sm", c.dot)} aria-hidden />
        <h2 className="text-[20px] font-bold tracking-tight text-foreground">{label}</h2>
      </div>
      <div className="text-[11px] font-medium text-muted-foreground tabular-nums">
        {done}/{count} · {pct}%
      </div>
    </div>
  );
}
