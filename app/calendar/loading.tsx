import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-6 h-7 w-40 animate-pulse rounded-md bg-zinc-200" />
      <Skeleton className="h-96" />
    </div>
  );
}
