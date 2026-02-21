import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockState } from "@/contexts/MockStateContext";
import { useLocation } from "wouter";
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserRole = 'owner' | 'admin' | 'manager' | 'marketer' | 'waiter' | 'kitchen';

const ReportsPage: React.FC = () => {
  const { ledgerEntries, orders, cafeterias } = useMockState();
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [selectedCafeteria, setSelectedCafeteria] = useState<string>('all');

  // Calculate totals from ledger
  const totals = useMemo(() => {
    const filtered = selectedCafeteria === 'all' 
      ? ledgerEntries 
      : ledgerEntries.filter(e => e.cafeteriaId === selectedCafeteria);

    return {
      totalPointsConsumed: filtered
        .filter(e => e.type === 'order_debit')
        .reduce((sum, e) => sum + e.amount, 0),
      totalCommissions: filtered
        .filter(e => e.type === 'commission_credit')
        .reduce((sum, e) => sum + e.amount, 0),
      totalRecharges: filtered
        .filter(e => e.type === 'recharge_credit')
        .reduce((sum, e) => sum + e.amount, 0),
      totalPayouts: filtered
        .filter(e => e.type === 'payout_debit')
        .reduce((sum, e) => sum + e.amount, 0),
    };
  }, [ledgerEntries, selectedCafeteria]);

  // Calculate daily/monthly breakdown
  const periodBreakdown = useMemo(() => {
    const filtered = selectedCafeteria === 'all' 
      ? ledgerEntries 
      : ledgerEntries.filter(e => e.cafeteriaId === selectedCafeteria);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailyPoints = filtered
      .filter(e => e.type === 'order_debit' && new Date(e.timestamp) >= today)
      .reduce((sum, e) => sum + e.amount, 0);

    const monthlyPoints = filtered
      .filter(e => e.type === 'order_debit' && new Date(e.timestamp) >= thisMonth)
      .reduce((sum, e) => sum + e.amount, 0);

    return { dailyPoints, monthlyPoints };
  }, [ledgerEntries, selectedCafeteria]);

  // Marketer-specific calculations
  const marketerStats = useMemo(() => {
    // Mock marketer ID - in real app from auth
    const marketerId = 'marketer-001';
    const commissions = ledgerEntries.filter(e => e.marketerId === marketerId && e.type === 'commission_credit');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailyCommissions = commissions
      .filter(e => new Date(e.timestamp) >= today)
      .reduce((sum, e) => sum + e.amount, 0);

    const monthlyCommissions = commissions
      .filter(e => new Date(e.timestamp) >= thisMonth)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalCommissions = commissions.reduce((sum, e) => sum + e.amount, 0);

    const managedCafeterias = cafeterias.filter(c => c.marketerId === marketerId);

    return {
      dailyCommissions,
      monthlyCommissions,
      totalCommissions,
      cafeteriaCount: managedCafeterias.length
    };
  }, [ledgerEntries, cafeterias]);

  // Waiter/Kitchen basic summaries
  const orderStats = useMemo(() => {
    const filteredOrders = selectedCafeteria === 'all'
      ? orders
      : orders.filter(o => o.cafeteriaId === selectedCafeteria);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayOrders = filteredOrders.filter(o => new Date(o.createdAt) >= today);
    const paidOrders = filteredOrders.filter(o => o.status === 'paid');
    const todayPaidOrders = todayOrders.filter(o => o.status === 'paid');

    return {
      totalOrders: filteredOrders.length,
      todayOrders: todayOrders.length,
      paidOrders: paidOrders.length,
      todayPaidOrders: todayPaidOrders.length,
      todayRevenue: todayPaidOrders.reduce((sum, o) => sum + o.total, 0)
    };
  }, [orders, selectedCafeteria]);

  const renderOwnerReport = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Total Points Consumed</p>
              <p className="text-2xl font-bold">{totals.totalPointsConsumed.toLocaleString()}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Total Commissions</p>
              <p className="text-2xl font-bold">{totals.totalCommissions.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Total Recharges</p>
              <p className="text-2xl font-bold">{totals.totalRecharges.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Total Payouts</p>
              <p className="text-2xl font-bold">{totals.totalPayouts.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAdminManagerReport = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Daily Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Points Consumed:</span>
                <span className="font-bold">{periodBreakdown.dailyPoints.toLocaleString()} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders Today:</span>
                <span className="font-bold">{orderStats.todayOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid Today:</span>
                <span className="font-bold">{orderStats.todayPaidOrders}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Points Consumed:</span>
                <span className="font-bold">{periodBreakdown.monthlyPoints.toLocaleString()} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Orders:</span>
                <span className="font-bold">{orderStats.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Paid:</span>
                <span className="font-bold">{orderStats.paidOrders}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All-Time Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Points Consumed</p>
              <p className="text-xl font-bold">{totals.totalPointsConsumed.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recharges</p>
              <p className="text-xl font-bold">{totals.totalRecharges.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-xl font-bold">{orderStats.totalOrders}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid Orders</p>
              <p className="text-xl font-bold">{orderStats.paidOrders}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMarketerReport = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Today's Commissions</p>
              <p className="text-2xl font-bold text-green-600">{marketerStats.dailyCommissions.toLocaleString()} pts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">This Month</p>
              <p className="text-2xl font-bold text-blue-600">{marketerStats.monthlyCommissions.toLocaleString()} pts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">All-Time Total</p>
              <p className="text-2xl font-bold text-purple-600">{marketerStats.totalCommissions.toLocaleString()} pts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Cafeterias</p>
              <p className="text-2xl font-bold">{marketerStats.cafeteriaCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderWaiterKitchenReport = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Today's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Orders Today</p>
              <p className="text-2xl font-bold">{orderStats.todayOrders}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid Today</p>
              <p className="text-2xl font-bold">{orderStats.todayPaidOrders}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Today Revenue</p>
              <p className="text-2xl font-bold">${orderStats.todayRevenue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Reports Dashboard
          </h1>
        </div>
      </div>

      {/* Role Selector */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-2 block">View As Role</Label>
          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">System Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="marketer">Marketer</SelectItem>
              <SelectItem value="waiter">Waiter</SelectItem>
              <SelectItem value="kitchen">Kitchen</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(selectedRole === 'admin' || selectedRole === 'manager' || selectedRole === 'waiter' || selectedRole === 'kitchen') && (
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-2 block">Filter by Cafeteria</Label>
            <Select value={selectedCafeteria} onValueChange={setSelectedCafeteria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cafeterias</SelectItem>
                {cafeterias.map(cafe => (
                  <SelectItem key={cafe.id} value={cafe.id}>{cafe.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Render role-specific reports */}
      {selectedRole === 'owner' && renderOwnerReport()}
      {(selectedRole === 'admin' || selectedRole === 'manager') && renderAdminManagerReport()}
      {selectedRole === 'marketer' && renderMarketerReport()}
      {(selectedRole === 'waiter' || selectedRole === 'kitchen') && renderWaiterKitchenReport()}
    </div>
  );
};

// Missing Label import
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}

export default ReportsPage;
