"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { resetDemoDataAction } from "@/app/actions/demo";

/**
 * One-click demo refresh. Wipes the demo user's data and re-seeds it
 * anchored to today, so the live demo never shows stale dates.
 * Destructive for the demo workspace only — asks for confirmation first.
 */
export function ResetDemoButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      try {
        await resetDemoDataAction();
        setOpen(false);
      } catch {
        setError("Could not reset the demo data. Please try again.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Reset demo data
      </button>

      <Dialog
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Reset demo data?"
        description="This wipes the demo workspace and re-seeds it with fresh dates anchored to today. Anything you changed in the demo will be lost."
      >
        {error && (
          <p role="alert" className="mb-3 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Resetting…" : "Reset demo data"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
