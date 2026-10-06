export type TaskStatus =
  | "todo"
  | "in_progress"
  | "ready_for_print"
  | "in_print"
  | "done";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  category: TaskCategory;
  assignee_name: string | null;
  waiting_for: string[];
  approved_by: string[];
  created_at: string;
}

export interface FamilyMember {
  id: string;
  name: string;
}

export const STATUS_ORDER: TaskStatus[] = [
  "todo",
  "in_progress",
  "ready_for_print",
  "in_print",
  "done",
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "לביצוע",
  in_progress: "בתהליך",
  ready_for_print: "להדפסה",
  in_print: "בהדפסה",
  done: "הושלם",
};

export const STATUS_STYLES: Record<
  TaskStatus,
  { accent: string; dot: string; header: string; chip: string }
> = {
  todo: {
    accent: "border-t-slate-400",
    dot: "bg-slate-400",
    header: "text-slate-600 dark:text-slate-300",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  in_progress: {
    accent: "border-t-blue-500",
    dot: "bg-blue-500",
    header: "text-blue-700 dark:text-blue-300",
    chip: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  },
  ready_for_print: {
    accent: "border-t-amber-500",
    dot: "bg-amber-500",
    header: "text-amber-700 dark:text-amber-300",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  },
  in_print: {
    accent: "border-t-purple-500",
    dot: "bg-purple-500",
    header: "text-purple-700 dark:text-purple-300",
    chip: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  },
  done: {
    accent: "border-t-emerald-500",
    dot: "bg-emerald-500",
    header: "text-emerald-700 dark:text-emerald-300",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
};

export const CATEGORIES = [
  "מתנות",
  "קניות לצילומים",
  "קניות לחלאקה",
  "אוכל",
  "לחיים בטקס עצמו",
  "גרפיקה",
] as const;

export type TaskCategory = (typeof CATEGORIES)[number];

export const DEFAULT_CATEGORY: TaskCategory = "גרפיקה";

export const CATEGORY_STYLES: Record<
  TaskCategory,
  { emoji: string; badge: string; active: string }
> = {
  "מתנות": {
    emoji: "🎁",
    badge: "bg-pink-100 text-pink-700 ring-pink-200 dark:bg-pink-900/40 dark:text-pink-300 dark:ring-pink-800",
    active: "bg-pink-500 text-white ring-pink-500",
  },
  "קניות לצילומים": {
    emoji: "📸",
    badge: "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-900/40 dark:text-sky-300 dark:ring-sky-800",
    active: "bg-sky-500 text-white ring-sky-500",
  },
  "קניות לחלאקה": {
    emoji: "🛍️",
    badge: "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:ring-violet-800",
    active: "bg-violet-500 text-white ring-violet-500",
  },
  "אוכל": {
    emoji: "🍰",
    badge: "bg-orange-100 text-orange-700 ring-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:ring-orange-800",
    active: "bg-orange-500 text-white ring-orange-500",
  },
  "לחיים בטקס עצמו": {
    emoji: "🥂",
    badge: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-800",
    active: "bg-amber-500 text-white ring-amber-500",
  },
  "גרפיקה": {
    emoji: "🎨",
    badge: "bg-teal-100 text-teal-700 ring-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:ring-teal-800",
    active: "bg-teal-500 text-white ring-teal-500",
  },
};

export function getCategoryStyle(category: string | null | undefined) {
  return (
    CATEGORY_STYLES[category as TaskCategory] ?? CATEGORY_STYLES[DEFAULT_CATEGORY]
  );
}
