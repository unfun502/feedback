export const APPS = [
  { id: "1", name: "Arsenal Report", slug: "arsenal-report", accent: "#ef4444", emoji: "📊" },
  { id: "2", name: "FLW Map", slug: "flwmap", accent: "#10b981", emoji: "🗺️" },
  { id: "3", name: "Countdown", slug: "countdown", accent: "#f59e0b", emoji: "⏱️" },
];

export const STATUSES = ["new", "reviewing", "planned", "in_progress", "done", "declined"];
export const STATUS_COLORS = {
  new: "#3b82f6",
  reviewing: "#f59e0b",
  planned: "#8b5cf6",
  in_progress: "#f97316",
  done: "#10b981",
  declined: "#94a3b8",
};
export const STATUS_LABELS = {
  new: "New",
  reviewing: "Reviewing",
  planned: "Planned",
  in_progress: "In Progress",
  done: "Done",
  declined: "Declined",
};
export const TYPE_COLORS = { bug: "#ef4444", feature: "#8b5cf6", general: "#3b82f6" };
export const TYPE_LABELS = { bug: "Bug", feature: "Feature", general: "General" };
