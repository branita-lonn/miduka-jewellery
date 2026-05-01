// app/(store)/account/loyalty/page.tsx
// Customer loyalty points and transaction history page

import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getLoyaltyAccount } from "@/lib/loyalty";
import { Coins, History, TrendingUp, Gift } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Loyalty Points | MiDuka",
  description: "View your earned points and transaction history",
};

export default async function LoyaltyPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const account = await getLoyaltyAccount(session.user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Loyalty Points</h1>
        <p className="text-muted-foreground">
          Earn points on every purchase and redeem them for discounts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{account?.points || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available to redeem
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Lifetime Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{account?.lifetimePoints || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total points earned since joining
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Redemption Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">100 Pts = KES 1</div>
            <p className="text-xs text-muted-foreground mt-1">
              Redeem during checkout
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold">Transaction History</h2>
        </div>

        <div className="rounded-3xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!account?.transactions || account.transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No transactions yet. Start shopping to earn points!
                  </TableCell>
                </TableRow>
              ) : (
                account.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs">
                      {format(new Date(tx.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{tx.description}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "w-fit text-[10px] h-4 px-1 px-0.5 rounded mt-1",
                            tx.type === "EARN" ? "text-green-600 border-green-200 bg-green-50" : "text-amber-600 border-amber-200 bg-amber-50"
                          )}
                        >
                          {tx.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {tx.orderId ? `#${tx.orderId.slice(-6).toUpperCase()}` : "-"}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-bold",
                      tx.points > 0 ? "text-green-600" : "text-amber-600"
                    )}>
                      {tx.points > 0 ? "+" : ""}{tx.points}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
