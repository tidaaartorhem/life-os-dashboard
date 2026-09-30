import { ListSkeleton } from "@/components/ui/loading-skeletons";

export default function Loading() {
  return (
    <div>
      <div className="mb-6 h-7 w-40 animate-pulse rounded-md bg-zinc-200" />
      <ListSkeleton rows={3} />
    </div>
  );
}
