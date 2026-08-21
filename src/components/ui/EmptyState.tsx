import React from "react";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryText?: string;
  onSecondaryAction?: () => void;
  secondaryHref?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  secondaryText,
  onSecondaryAction,
  secondaryHref
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs max-w-lg mx-auto space-y-4 my-6">
      <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-inner">
        <Icon className="w-8 h-8 stroke-[1.8]" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          {description}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full justify-center">
        {actionText && (
          actionHref ? (
            <Link
              href={actionHref}
              className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 text-center"
            >
              {actionText}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 text-center"
            >
              {actionText}
            </button>
          )
        )}

        {secondaryText && (
          secondaryHref ? (
            <Link
              href={secondaryHref}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-xl transition-all text-center"
            >
              {secondaryText}
            </Link>
          ) : (
            <button
              onClick={onSecondaryAction}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-xl transition-all text-center"
            >
              {secondaryText}
            </button>
          )
        )}
      </div>
    </div>
  );
};
