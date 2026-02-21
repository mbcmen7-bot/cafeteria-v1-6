import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockState } from "@/contexts/MockStateContext";
import { useLocation } from "wouter";
import { ArrowLeft, Wallet, TrendingUp, History, DollarSign } from "lucide-react";

// Mock marketer ID - in real app this would come from auth context
const CURRENT_MARKETER_ID = 'marketer-001';

const MarketerDashboard: React.FC = () => {
  const { 
    getMarketerBalance, 
    getMarketerCommissionHistory,
    getPayoutRecordsByMarketerId,
    cafeterias
  } = useMockState();
  const [, setLocation] = useLocation();

  const balance = getMarketerBalance(CURRENT_MARKETER_ID);
  const commissionHistory = getMarketerCommissionHistory(CURRENT_MARKETER_ID);
  const payoutHistory = getPayoutRecordsByMarketerId(CURRENT_MARKETER_ID);

  // Calculate total commissions earned
  const totalCommissionsEarned = commissionHistory.reduce((sum, entry) => sum + entry.amount, 0);
  const totalPayoutsReceived = payoutHistory.reduce((sum, payout) => sum + payout.amount, 0);

  // Get cafeterias managed by this marketer
  const managedCafeterias = cafeterias.filter(c => c.marketerId === CURRENT_MARKETER_ID);

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Marketer Dashboard
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Balance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Current Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-primary">{balance.toLocaleString()} pts</p>
                <p className="text-sm text-muted-foreground mt-1">Available for payout</p>
              </div>
              <Wallet className="h-16 w-16 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Total Earned</p>
                  <p className="text-2xl font-bold">{totalCommissionsEarned.toLocaleString()} pts</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Total Withdrawn</p>
                  <p className="text-2xl font-bold">{totalPayoutsReceived.toLocaleString()} pts</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Cafeterias</p>
                  <p className="text-2xl font-bold">{managedCafeterias.length}</p>
                </div>
                <History className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commission History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Commission History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(Array.isArray(commissionHistory) ? commissionHistory : []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20).map(entry => (
                <div key={entry.id} className="border rounded-lg p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                    {entry.orderId && (
                      <p className="text-[10px] text-muted-foreground">Order: {(entry.orderId || "").slice(-8)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">+{entry.amount.toLocaleString()} pts</p>
                  </div>
                </div>
              ))}
              {commissionHistory.length === 0 && (
                <div className="py-10 text-center text-muted-foreground italic">
                  No commission history yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payout History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payoutHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(payout => (
                <div key={payout.id} className="border rounded-lg p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">Payout Received</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payout.createdAt).toLocaleString()}
                    </p>
                    {payout.note && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{payout.note}"</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-destructive">-{payout.amount.toLocaleString()} pts</p>
                    <p className="text-[10px] text-muted-foreground">ID: {(payout.id || "").slice(-8)}</p>
                  </div>
                </div>
              ))}
              {payoutHistory.length === 0 && (
                <div className="py-10 text-center text-muted-foreground italic">
                  No payout history yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketerDashboard;
