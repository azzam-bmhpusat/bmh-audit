import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingAdminPenilaianPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <Skeleton className="h-7 w-80" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-52" />
      </div>

      <div className="flex justify-between items-center gap-4">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-9 w-60" />
      </div>

      <Skeleton className="h-96 w-full rounded-md border" />
    </main>
  );
}
