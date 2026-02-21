import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMockState } from "@/contexts/MockStateContext";
import { useLocation } from "wouter";
import { ArrowLeft, DollarSign, History, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PayoutManagement: React.FC = () => {
  const { 
    getAllMarketerIds, 
    getMarketerBalance, 
    createPayout, 
    getPayoutRecords,
    ledgerEntries 
  } = useMockState();
  const [, setLocation] = useLocation();

  const [selectedMarketerId, setSelectedMarketerId] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutNote, setPayoutNote] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const marketerIds = getAllMarketerIds();
  const payoutRecords = getPayoutRecords();

  // Calculate marketer balances
  const marketerBalances = marketerIds.map(id => ({
    marketerId: id,
    balance: getMarketerBalance(id),
    commissionCount: ledgerEntries.filter(e => e.marketerId === id && e.type === 'commission_credit').length,
    payoutCount: payoutRecords.filter(p => p.marketerId === id).length
  }));

  const handleCreatePayout = () => {
    if (!selectedMarketerId) {
      toast.error('Please select a marketer');
      return;
    }

    const amount = parseInt(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      createPayout(selectedMarketerId, amount, payoutNote || undefined);
      toast.success(`Payout of ${amount.toLocaleString()} pts created successfully`);
      setSelectedMarketerId('');
      setPayoutAmount('');
      setPayoutNote('');
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create payout');
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/owner")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Payout Management
          </h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <DollarSign className="h-4 w-4 mr-2" />
              Create Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Marketer Payout</DialogTitle>
              <DialogDescription>
                Select a marketer and enter the payout amount. The marketer must have sufficient balance.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="marketer">Marketer</Label>
                <Select value={selectedMarketerId} onValueChange={setSelectedMarketerId}>
                  <SelectTrigger id="marketer">
                    <SelectValue placeholder="Select marketer" />
                  </SelectTrigger>
                  <SelectContent>
                    {marketerBalances.map(mb => (
                      <SelectItem key={mb.marketerId} value={mb.marketerId}>
                        {mb.marketerId} (Balance: {mb.balance.toLocaleString()} pts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (points)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                />
                {selectedMarketerId && (
                  <p className="text-xs text-muted-foreground">
                    Available balance: {getMarketerBalance(selectedMarketerId).toLocaleString()} pts
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Note / Reference (optional)</Label>
                <Textarea
                  id="note"
                  placeholder="Enter payout note or reference"
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePayout}>
                Confirm Payout
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Marketer Balances */}
        <Card>
          <CardHeader>
            <CardTitle>Marketer Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketerBalances.map(mb => (
                <div key={mb.marketerId} className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold">{mb.marketerId}</p>
                    <p className="text-sm text-muted-foreground">
                      {mb.commissionCount} commission{mb.commissionCount !== 1 ? 's' : ''} · {mb.payoutCount} payout{mb.payoutCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{mb.balance.toLocaleString()} pts</p>
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                  </div>
                </div>
              ))}
              {marketerBalances.length === 0 && (
                <div className="py-10 text-center text-muted-foreground italic">
                  No marketer data available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Payout History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payoutRecords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(record => (
                <div key={record.id} className="border rounded-lg p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{record.marketerId}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(record.createdAt).toLocaleString()}
                    </p>
                    {record.note && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{record.note}"</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-destructive">-{record.amount.toLocaleString()} pts</p>
                    <p className="text-[10px] text-muted-foreground">ID: {record.id.slice(-8)}</p>
                  </div>
                </div>
              ))}
              {payoutRecords.length === 0 && (
                <div className="py-10 text-center text-muted-foreground italic">
                  No payout records yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PayoutManagement;
