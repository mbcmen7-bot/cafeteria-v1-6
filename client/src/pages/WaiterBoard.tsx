import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockState } from "@/contexts/MockStateContext";
import { useLocation } from "wouter";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { type Order } from "@/lib/shared_mock_state";

const WaiterBoard: React.FC = () => {
  const { updateOrderStatus, getOrders, waiterSections, waiterTables, staff, subscribe } = useMockState();
  const [, setLocation] = useLocation();
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [currentWaiterId, setCurrentWaiterId] = useState<string>("staff-001");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setAllOrders(data);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const unsubscribe = subscribe(() => {
      loadOrders();
    });
    return () => unsubscribe();
  }, []);

  // Get current waiter
  const currentWaiter = staff.find(s => s.id === currentWaiterId && s.role === 'waiter');

  // Check if waiter is disabled
  if (currentWaiter && !currentWaiter.isActive) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="w-full max-w-md border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Access Disabled
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-red-900">{currentWaiter.name}</p>
              <p className="text-sm text-red-700 mt-1">Your account has been disabled by the administrator.</p>
            </div>
            <p className="text-xs text-red-600">You do not have access to the Waiter Board. Please contact your manager for assistance.</p>
            <Button className="w-full" onClick={() => setLocation("/")} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter orders by selected section
  const filteredOrders = selectedSection === "all" 
    ? allOrders 
    : allOrders.filter(order => {
        // Try to match by table_code first, then fall back to tableNumber
        const table = order.table_code 
          ? waiterTables.find(t => t.referenceCode === order.table_code)
          : waiterTables.find(t => t.tableNumber === order.tableNumber);
        return table?.sectionId === selectedSection;
      });

  const handleUpdateStatus = async (orderId: string, status: any) => {
    try {
      await updateOrderStatus(orderId, status, currentWaiterId, 'waiter');
      loadOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Waiter Board</h1>
            {currentWaiter && <p className="text-sm text-muted-foreground">Logged in as: {currentWaiter.name}</p>}
          </div>
        </div>
        <select 
          className="bg-background border rounded p-2 text-sm"
          value={currentWaiterId}
          onChange={(e) => setCurrentWaiterId(e.target.value)}
        >
          {staff.filter(s => s.role === 'waiter').map(waiter => (
            <option key={waiter.id} value={waiter.id}>
              {waiter.name} {waiter.isActive ? '(Active)' : '(Disabled)'}
            </option>
          ))}
        </select>
      </div>

      {/* Section Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button 
          variant={selectedSection === "all" ? "default" : "outline"}
          onClick={() => setSelectedSection("all")}
          size="sm"
        >
          All Orders
        </Button>
        {waiterSections.map(section => (
          <Button
            key={section.id}
            variant={selectedSection === section.id ? "default" : "outline"}
            onClick={() => setSelectedSection(section.id)}
            size="sm"
          >
            Section {section.name}
          </Button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p>No orders in {selectedSection === "all" ? "this cafeteria" : "this section"}</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle className="text-sm">Order #{(order.id || "").slice(-5)}</CardTitle>
                {order.table_code && (
                  <div className="text-xs text-muted-foreground space-y-1 mt-2">
                    <p className="font-mono font-bold text-primary">Table: {order.table_code}</p>
                    <p>Display: {order.table_number_display || order.tableNumber}</p>
                  </div>
                )}
                {!order.table_code && order.tableNumber && (
                  <p className="text-xs text-muted-foreground mt-2">Table: {order.tableNumber}</p>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm">Status: <span className="capitalize font-semibold">{order.status.replace(/_/g, ' ')}</span></p>
                <p className="text-sm">Total: ${order.total.toFixed(2)}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {order.status === 'created' && (
                    <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'sent_to_kitchen')}>Confirm</Button>
                  )}
                  {order.status === 'ready' && (
                    <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'served')}>Serve</Button>
                  )}
                  {order.status === 'served' && (
                    <Button size="sm" onClick={() => handleUpdateStatus(order.id, 'paid')}>Mark Paid</Button>
                  )}
                  {['created', 'sent_to_kitchen', 'preparing'].includes(order.status) && (
                    <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(order.id, 'cancelled')}>Cancel</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WaiterBoard;
