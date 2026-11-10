import { Skeleton } from "@/components/ui/skeleton";

export default function AuditLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4 max-w-md" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-60" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </main>
  );
}
