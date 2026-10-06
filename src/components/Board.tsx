"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanSquare, Plus, Scissors } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  CATEGORIES,
  FamilyMember,
  STATUS_ORDER,
  Task,
  TaskCategory,
  TaskStatus,
  getCategoryStyle,
} from "@/lib/types";
import Column from "./Column";
import NewTaskModal from "./NewTaskModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ShoppingList from "./ShoppingList";

const COLUMN_ORDER = [...STATUS_ORDER].reverse();

type View = "board" | "shopping";

export default function Board() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | "all">("all");
  const [view, setView] = useState<View>("board");
  const [shoppingCategory, setShoppingCategory] = useState<TaskCategory>("קניות לצילומים");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && view === "board") {
      scrollerRef.current?.scrollTo({ left: -9999 });
    }
  }, [isLoading, view]);

  useEffect(() => {
    let active = true;

    async function load() {
      const [tasksResult, familyResult] = await Promise.all([
        supabase.from("chalaka_tasks").select("*").order("created_at", { ascending: true }),
        supabase.from("family_members").select("*").order("name", { ascending: true }),
      ]);

      if (!active) return;
      if (tasksResult.error) {
        toast.error("שגיאה בטעינת המשימות");
      } else {
        setTasks((tasksResult.data as Task[]) ?? []);
      }
      if (familyResult.error) {
        toast.error("שגיאה בטעינת רשימת האנשים");
      } else {
        setFamilyMembers((familyResult.data as FamilyMember[]) ?? []);
      }
      setIsLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const handleStatusChange = useCallback(
    async (taskId: string, status: TaskStatus, { silent = false } = {}) => {
      let previousStatus: TaskStatus | undefined;
      setTasks((current) =>
        current.map((t) => {
          if (t.id === taskId) {
            previousStatus = t.status;
            return { ...t, status };
          }
          return t;
        })
      );

      const { error } = await supabase
        .from("chalaka_tasks")
        .update({ status })
        .eq("id", taskId);

      if (error) {
        setTasks((current) =>
          current.map((t) =>
            t.id === taskId && previousStatus
              ? { ...t, status: previousStatus }
              : t
          )
        );
        toast.error("עדכון הסטטוס נכשל");
      } else if (!silent) {
        toast.success("הסטטוס עודכן בהצלחה");
      }
    },
    []
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }
      handleStatusChange(draggableId, destination.droppableId as TaskStatus);
    },
    [handleStatusChange]
  );

  const handleCreate = useCallback(
    async (data: {
      title: string;
      description: string;
      category: TaskCategory;
      assignee_name: string;
      waiting_for: string[];
    }) => {
      const { data: inserted, error } = await supabase
        .from("chalaka_tasks")
        .insert({
          title: data.title,
          description: data.description || null,
          category: data.category,
          assignee_name: data.assignee_name || null,
          waiting_for: data.waiting_for,
          status: "todo",
        })
        .select()
        .single();

      if (error || !inserted) {
        toast.error("יצירת המשימה נכשלה");
        return false;
      }
      setTasks((current) => [...current, inserted as Task]);
      toast.success("המשימה נוצרה בהצלחה");
      return true;
    },
    []
  );

  const handleShoppingToggle = useCallback(
    (taskId: string, done: boolean) =>
      handleStatusChange(taskId, done ? "done" : "todo", { silent: true }),
    [handleStatusChange]
  );

  const handleQuickAdd = useCallback(
    (title: string, category: TaskCategory) =>
      handleCreate({ title, description: "", category, assignee_name: "", waiting_for: [] }),
    [handleCreate]
  );

  const updateApprovalFields = useCallback(
    async (
      taskId: string,
      compute: (task: Task) => Pick<Task, "waiting_for" | "approved_by">
    ): Promise<boolean> => {
      const target = tasks.find((t) => t.id === taskId);
      if (!target) return false;

      const previous: Pick<Task, "waiting_for" | "approved_by"> = {
        waiting_for: target.waiting_for,
        approved_by: target.approved_by,
      };
      const next = compute(target);

      setTasks((current) =>
        current.map((t) => (t.id === taskId ? { ...t, ...next } : t))
      );

      const { error } = await supabase.from("chalaka_tasks").update(next).eq("id", taskId);

      if (error) {
        setTasks((current) =>
          current.map((t) => (t.id === taskId ? { ...t, ...previous } : t))
        );
        return false;
      }
      return true;
    },
    [tasks]
  );

  const handleApprove = useCallback(
    async (taskId: string, person: string) => {
      const ok = await updateApprovalFields(taskId, (task) => ({
        waiting_for: task.waiting_for.filter((p) => p !== person),
        approved_by: task.approved_by.includes(person)
          ? task.approved_by
          : [...task.approved_by, person],
      }));
      toast[ok ? "success" : "error"](
        ok ? `האישור של ${person} נרשם` : "עדכון האישור נכשל"
      );
    },
    [updateApprovalFields]
  );

  const handleRemoveWaiting = useCallback(
    async (taskId: string, person: string) => {
      const ok = await updateApprovalFields(taskId, (task) => ({
        waiting_for: task.waiting_for.filter((p) => p !== person),
        approved_by: task.approved_by,
      }));
      if (!ok) toast.error("ההסרה נכשלה");
    },
    [updateApprovalFields]
  );

  const handleAddWaiting = useCallback(
    async (taskId: string, person: string) => {
      const ok = await updateApprovalFields(taskId, (task) => ({
        waiting_for: task.waiting_for.includes(person)
          ? task.waiting_for
          : [...task.waiting_for, person],
        approved_by: task.approved_by,
      }));
      if (!ok) toast.error("ההוספה נכשלה");
    },
    [updateApprovalFields]
  );

  const addFamilyMember = useCallback(async (name: string) => {
    const { data, error } = await supabase
      .from("family_members")
      .insert({ name })
      .select()
      .single();

    if (error || !data) {
      toast.error("הוספת האדם נכשלה");
      return null;
    }

    const created = data as FamilyMember;
    setFamilyMembers((current) =>
      [...current, created].sort((a, b) => a.name.localeCompare(b.name, "he"))
    );
    toast.success("האדם נוסף בהצלחה");
    return created;
  }, []);

  const requestDelete = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId) ?? null;
      setDeleteTarget(task);
    },
    [tasks]
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setTasks((current) => current.filter((t) => t.id !== target.id));

    const { error } = await supabase
      .from("chalaka_tasks")
      .delete()
      .eq("id", target.id);

    if (error) {
      setTasks((current) => [...current, target]);
      toast.error("מחיקת המשימה נכשלה");
    } else {
      toast.success("המשימה נמחקה");
    }
  }, [deleteTarget]);

  const visibleTasks =
    categoryFilter === "all"
      ? tasks
      : tasks.filter((t) => t.category === categoryFilter);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white/80 px-4 py-3.5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 text-white">
            <Scissors size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-zinc-900 dark:text-zinc-100">
              החלאקה של אבי ✂️🎉
            </h1>
            <p className="text-xs text-zinc-400">
              {categoryFilter === "all"
                ? `${tasks.length} משימות בלוח`
                : `${visibleTasks.length} מתוך ${tasks.length} משימות`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsNewTaskOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-transform active:scale-95 hover:opacity-90 dark:bg-white dark:text-zinc-900"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">משימה חדשה</span>
        </button>
      </header>

      <div
        role="tablist"
        aria-label="בחירת תצוגה"
        className="flex gap-1 border-b border-zinc-200 bg-white/60 px-4 pt-2 dark:border-zinc-800 dark:bg-zinc-950/60 sm:px-6"
      >
        {(
          [
            { id: "board", label: "לוח משימות", icon: <KanbanSquare size={15} /> },
            { id: "shopping", label: "רשימת קניות", icon: <span aria-hidden>🛒</span> },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={view === tab.id}
            onClick={() => setView(tab.id)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
              view === tab.id
                ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {view === "board" && (
        <nav
          aria-label="סינון לפי קטגוריה"
          className="flex gap-2 overflow-x-auto border-b border-zinc-200 bg-white/60 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/60 sm:px-6"
        >
          <button
            onClick={() => setCategoryFilter("all")}
            aria-pressed={categoryFilter === "all"}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${
              categoryFilter === "all"
                ? "bg-zinc-900 text-white ring-zinc-900 dark:bg-white dark:text-zinc-900 dark:ring-white"
                : "bg-white text-zinc-600 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700"
            }`}
          >
            הכל ({tasks.length})
          </button>
          {CATEGORIES.map((category) => {
            const categoryStyle = getCategoryStyle(category);
            const isActive = categoryFilter === category;
            const count = tasks.filter((t) => t.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                aria-pressed={isActive}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${
                  isActive ? categoryStyle.active : `${categoryStyle.badge} hover:opacity-80`
                }`}
              >
                {categoryStyle.emoji} {category} ({count})
              </button>
            );
          })}
        </nav>
      )}

      <div
        ref={scrollerRef}
        className={`min-h-0 flex-1 px-4 py-4 sm:px-6 ${
          view === "board" ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto"
        }`}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            טוען משימות...
          </div>
        ) : view === "shopping" ? (
          <ShoppingList
            tasks={tasks}
            category={shoppingCategory}
            onCategoryChange={setShoppingCategory}
            onToggle={handleShoppingToggle}
            onQuickAdd={handleQuickAdd}
          />
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-4">
              {COLUMN_ORDER.map((status) => (
                <Column
                  key={status}
                  status={status}
                  tasks={visibleTasks.filter((t) => t.status === status)}
                  familyMembers={familyMembers}
                  onStatusChange={handleStatusChange}
                  onDelete={requestDelete}
                  onApprove={handleApprove}
                  onRemoveWaiting={handleRemoveWaiting}
                  onAddWaiting={handleAddWaiting}
                />
              ))}
            </div>
          </DragDropContext>
        )}
      </div>

      <NewTaskModal
        open={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        familyMembers={familyMembers}
        onAddFamilyMember={addFamilyMember}
        onCreate={handleCreate}
      />
      <ConfirmDeleteModal
        open={!!deleteTarget}
        taskTitle={deleteTarget?.title ?? null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
