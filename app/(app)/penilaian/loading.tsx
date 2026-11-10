import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingPenilaianPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-9 w-56" />
      </div>

      {/* Skeleton Predikat Table */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-48 w-full rounded-md border" />
      </div>

      {/* Skeleton Rekap */}
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-md border" />
        <Skeleton className="h-80 w-full rounded-md border" />
      </div>
    </main>
  );
}
