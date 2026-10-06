"use client";

import { FormEvent, useState } from "react";
import { Check, Plus, User } from "lucide-react";
import { Task, TaskCategory, getCategoryStyle } from "@/lib/types";
import { getAssigneeStyle } from "@/lib/assignee";

export const SHOPPING_CATEGORIES: TaskCategory[] = [
  "קניות לצילומים",
  "קניות לחלאקה",
  "מתנות",
];

interface ShoppingListProps {
  tasks: Task[];
  category: TaskCategory;
  onCategoryChange: (category: TaskCategory) => void;
  onToggle: (taskId: string, done: boolean) => void;
  onQuickAdd: (title: string, category: TaskCategory) => Promise<boolean>;
}

export default function ShoppingList({
  tasks,
  category,
  onCategoryChange,
  onToggle,
  onQuickAdd,
}: ShoppingListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const items = tasks
    .filter((t) => t.category === category)
    // Open items first, bought items sink to the bottom
    .sort((a, b) => Number(a.status === "done") - Number(b.status === "done"));
  const doneCount = items.filter((t) => t.status === "done").length;
  const percent = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || isAdding) return;
    setIsAdding(true);
    const ok = await onQuickAdd(title, category);
    setIsAdding(false);
    if (ok) setNewTitle("");
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <nav aria-label="בחירת רשימת קניות" className="flex gap-2 overflow-x-auto">
        {SHOPPING_CATEGORIES.map((c) => {
          const categoryStyle = getCategoryStyle(c);
          const isActive = c === category;
          const count = tasks.filter((t) => t.category === c).length;
          return (
            <button
              key={c}
              onClick={() => onCategoryChange(c)}
              aria-pressed={isActive}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${
                isActive ? categoryStyle.active : `${categoryStyle.badge} hover:opacity-80`
              }`}
            >
              {categoryStyle.emoji} {c} ({count})
            </button>
          );
        })}
      </nav>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {doneCount}/{items.length} פריטים נקנו
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700"
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="הוסף פריט לקניות..."
          aria-label="הוסף פריט לקניות"
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-700"
        />
        <button
          type="submit"
          disabled={!newTitle.trim() || isAdding}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-transform active:scale-95 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">הוסף</span>
        </button>
      </form>

      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-400">אין עדיין פריטים ברשימה הזו</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const isDone = item.status === "done";
            const assigneeStyle = item.assignee_name
              ? getAssigneeStyle(item.assignee_name)
              : null;
            return (
              <li key={item.id}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-800/70 ${
                    isDone ? "opacity-60" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={(e) => onToggle(item.id, e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-300 ${
                      isDone
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-zinc-300 dark:border-zinc-600"
                    }`}
                  >
                    {isDone && <Check size={14} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block break-words text-sm font-semibold ${
                        isDone
                          ? "text-zinc-400 line-through dark:text-zinc-500"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.description && (
                      <span className="mt-0.5 block whitespace-pre-wrap break-words text-xs text-zinc-500 dark:text-zinc-400">
                        {item.description}
                      </span>
                    )}
                  </span>
                  {item.assignee_name && assigneeStyle && (
                    <span
                      className={`inline-flex max-w-[40%] shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${assigneeStyle.bg} ${assigneeStyle.text} ${assigneeStyle.ring}`}
                    >
                      <User size={11} className="shrink-0" />
                      <span className="truncate">{item.assignee_name}</span>
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
