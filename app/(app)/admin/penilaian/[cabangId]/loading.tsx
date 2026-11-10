import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingAdminDetailPenilaianPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <Skeleton className="h-7 w-96" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-48" />
      </div>

      {/* Bagian 1: Predikat */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-60" />
        <Skeleton className="h-44 w-full rounded-md border" />
      </div>

      {/* Bagian 2: 2 Blok */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-72 w-full rounded-md border" />
        <Skeleton className="h-72 w-full rounded-md border" />
      </div>

      {/* Bagian 3: Matriks */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-96 w-full rounded-md border" />
      </div>
    </main>
  );
}
