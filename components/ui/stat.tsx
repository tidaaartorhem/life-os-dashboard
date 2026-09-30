import type { ReactNode } from "react";
import { Card, CardContent } from "./card";

interface StatProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  hint?: string;
}

export function Stat({ label, value, icon, hint }: StatProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 [&_svg]:size-5">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {label}
          </p>
          <p className="truncate text-xl font-semibold tracking-tight text-zinc-900">
            {value}
          </p>
          {hint && <p className="truncate text-xs text-zinc-500">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
