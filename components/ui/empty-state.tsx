import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-12 text-center">
      <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-white text-zinc-400 shadow-sm [&_svg]:size-5">
        {icon}
      </div>
      <p className="text-sm font-medium text-zinc-900">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-zinc-500">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
