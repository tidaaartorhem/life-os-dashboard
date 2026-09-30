"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Calendar,
  BarChart3,
  Layers,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {NAV.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              active
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900">
          <span className="flex size-7 items-center justify-center rounded-md bg-indigo-600 text-white">
            <Layers className="size-4" aria-hidden="true" />
          </span>
          Life OS
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close navigation" : "Open navigation"}
          className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {open ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-zinc-950/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-zinc-950 p-4">
            <span className="mb-4 flex items-center gap-2 px-2 font-semibold tracking-tight text-white">
              <span className="flex size-7 items-center justify-center rounded-md bg-indigo-600 text-white">
                <Layers className="size-4" aria-hidden="true" />
              </span>
              Life OS
            </span>
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-zinc-950 p-4 lg:flex">
        <span className="mb-6 flex items-center gap-2 px-2 pt-2 font-semibold tracking-tight text-white">
          <span className="flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
            <Layers className="size-4" aria-hidden="true" />
          </span>
          Life OS
        </span>
        <NavLinks />
        <div className="mt-auto rounded-md border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-medium text-white">Demo workspace</p>
          <p className="mt-0.5 text-xs text-zinc-400">
            Signed in as demo@lifeos.app
          </p>
        </div>
      </aside>
    </>
  );
}
