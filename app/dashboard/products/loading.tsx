// app/dashboard/products/loading.tsx
// Loading skeleton for products page

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[150px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>

      <Skeleton className="h-10 w-[300px]" />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><Skeleton className="h-4 w-4 rounded" /></TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Completeness</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4 rounded" /></TableCell>
                <TableCell><Skeleton className="h-12 w-12 rounded-xl" /></TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[150px] mb-2" />
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-2 w-full" /></TableCell>
                <TableCell><Skeleton className="h-6 w-[36px] rounded-full" /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
