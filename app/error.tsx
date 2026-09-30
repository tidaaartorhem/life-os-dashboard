"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold text-zinc-900">
            Something went wrong
          </h2>
          <p className="text-sm text-zinc-500">
            {error.message ||
              "An unexpected error occurred while loading this page."}
          </p>
          <Button onClick={reset} className="mt-1">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
