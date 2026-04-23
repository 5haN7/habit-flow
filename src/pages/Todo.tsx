import { useMemo, useState } from "react";
import MobileShell from "@/components/MobileShell";
import BottomNav from "@/components/BottomNav";
import { useApp } from "@/store/useAppStore";
import { Plus, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { todayISO } from "@/lib/habits";

export default function Todo() {
  const { todos, addTodo, toggleTodo, removeTodo } = useApp();
  const [text, setText] = useState("");

  const today = todayISO();
  const todayList = useMemo(() => todos.filter((t) => t.date === today), [todos, today]);
  const earlier = useMemo(() => todos.filter((t) => t.date !== today).slice(0, 12), [todos, today]);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    []
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addTodo(text);
    setText("");
  };

  const doneCount = todayList.filter((t) => t.done).length;

  return (
    <MobileShell>
      <header className="px-6 pt-10 pb-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {dateLabel}
        </div>
        <h1 className="mt-2 text-[32px] leading-[1.05] font-bold tracking-tight text-foreground">
          Today's plan.
          <br />
          <span className="italic font-medium text-muted-foreground">
            {todayList.length === 0
              ? "A clear page."
              : `${doneCount} of ${todayList.length} done.`}
          </span>
        </h1>
      </header>

      <form onSubmit={submit} className="px-6">
        <div className="flex items-stretch gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a task…"
            className="flex-1 bg-surface border-2 border-todo/40 focus:border-todo text-foreground placeholder:text-muted-foreground rounded-md px-4 py-3.5 text-[15px] font-medium outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="shrink-0 bg-todo text-todo-foreground rounded-md px-4 font-bold disabled:opacity-30"
            aria-label="Add task"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </form>

      <section className="px-6 mt-8 space-y-2.5">
        {todayList.length === 0 && (
          <div className="border-2 border-dashed border-border rounded-md py-12 text-center text-[13px] font-medium text-muted-foreground">
            Nothing yet. Write your first task above.
          </div>
        )}
        {todayList.map((t) => (
          <TodoBox key={t.id} text={t.text} done={t.done} onToggle={() => toggleTodo(t.id)} onRemove={() => removeTodo(t.id)} />
        ))}
      </section>

      {earlier.length > 0 && (
        <section className="px-6 mt-10">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground mb-3">
            Earlier
          </div>
          <div className="space-y-2.5 opacity-70">
            {earlier.map((t) => (
              <TodoBox
                key={t.id}
                text={t.text}
                done={t.done}
                onToggle={() => toggleTodo(t.id)}
                onRemove={() => removeTodo(t.id)}
              />
            ))}
          </div>
        </section>
      )}

      <BottomNav />
    </MobileShell>
  );
}

function TodoBox({
  text,
  done,
  onToggle,
  onRemove,
}: {
  text: string;
  done: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-md border-2 px-4 py-3.5 flex items-center gap-3 transition-colors duration-300",
        done ? "bg-todo border-todo text-todo-foreground" : "bg-surface border-todo text-todo"
      )}
    >
      <button
        onClick={onToggle}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "shrink-0 h-6 w-6 rounded-sm border-2 flex items-center justify-center transition-colors",
          done ? "bg-todo-foreground border-todo-foreground text-todo" : "border-todo"
        )}
      >
        {done && <Check className="h-4 w-4" strokeWidth={3} />}
      </button>
      <span
        className={cn(
          "flex-1 text-[15px] font-medium leading-snug truncate",
          done && "line-through opacity-90"
        )}
      >
        {text}
      </span>
      <button
        onClick={onRemove}
        aria-label="Remove"
        className={cn(
          "opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity",
          done ? "text-todo-foreground" : "text-todo"
        )}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
