import { Skeleton } from "@/components/ui/skeleton";

export default function NilaiAuditLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header skeleton */}
      <div className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-44 rounded-md" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-5 w-60" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
