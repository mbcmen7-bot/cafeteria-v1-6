import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMockState } from "@/contexts/MockStateContext";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

const LedgerView: React.FC = () => {
  const { ledgerEntries } = useMockState();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Immutable Ledger View</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Entity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.timestamp.toLocaleString()}</TableCell>
                  <TableCell className="capitalize">
                    <span className={entry.type === 'order_debit' || entry.type === 'payout_debit' ? 'text-red-400' : 'text-green-400'}>
                      {entry.type}
                    </span>
                  </TableCell>
                  <TableCell>${entry.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-xs font-mono">{entry.orderId?.slice(-8) || 'N/A'}</TableCell>
                  <TableCell className="text-xs">{entry.cafeteriaId || entry.marketerId || 'System'}</TableCell>
                </TableRow>
              ))}
              {ledgerEntries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No ledger entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LedgerView;
