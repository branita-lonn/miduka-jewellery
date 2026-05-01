// app/(store)/gift-cards/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function GiftCardsLoading() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-16 space-y-12">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <Skeleton className="h-6 w-32" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
          </div>
        </div>
        <div className="space-y-8">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
          <Skeleton className="h-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}
