// app/dashboard/orders/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OrdersLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-muted/30 p-4 rounded-3xl border border-border/50">
        <Skeleton className="h-10 flex-1 min-w-[240px] rounded-2xl" />
        <Skeleton className="h-10 w-[160px] rounded-2xl" />
        <Skeleton className="h-10 w-[160px] rounded-2xl" />
        <Skeleton className="h-10 w-[140px] rounded-2xl" />
      </div>

      <Card className="rounded-3xl border-border/50 bg-card/50 overflow-hidden shadow-sm">
        <div className="p-0">
          <div className="h-12 bg-muted/30 border-b border-border/50 flex items-center px-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-4 flex-1" />)}
          </div>
          {[1, 2, 3, 4, 5].map(row => (
            <div key={row} className="h-16 border-b border-border/10 flex items-center px-4 gap-4">
               {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-4 flex-1" />)}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
