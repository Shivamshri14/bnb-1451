"use client";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: "blue" | "emerald" | "amber" | "rose" | "indigo" | "neutral" | "brand" | "accent";
}

const colorClasses = {
  blue: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20",
  emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  rose: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  indigo: "text-teal-700 dark:text-teal-300 bg-teal-500/10 border-teal-500/20",
  brand: "text-brand bg-brand-soft border-brand/20",
  accent: "text-accent bg-accent-soft border-accent/20",
  neutral: "text-muted bg-surface-muted border-border",
};

export default function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  color = "neutral",
}: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{title}</span>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorClasses[color]}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">{value}</h3>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              trend.positive
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-rose-500/10 text-rose-600"
            }`}
          >
            {trend.value}
          </span>
          <span className="text-[10px] text-muted">vs last month</span>
        </div>
      )}
    </div>
  );
}
