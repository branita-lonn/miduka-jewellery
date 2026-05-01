// app/dashboard/orders/[orderId]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrderDetailLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-44 rounded-full" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[300px] w-full rounded-3xl" />
          <Skeleton className="h-[200px] w-full rounded-3xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[150px] w-full rounded-3xl" />
          <Skeleton className="h-[180px] w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
