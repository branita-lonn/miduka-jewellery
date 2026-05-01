// app/dashboard/products/import/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="md:col-span-1 h-64 rounded-3xl" />
        <Skeleton className="md:col-span-2 h-64 rounded-3xl" />
      </div>

      <Skeleton className="h-96 rounded-3xl" />
    </div>
  );
}
