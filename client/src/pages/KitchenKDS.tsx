import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockState } from "@/contexts/MockStateContext";
import { useLocation } from "wouter";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { type Order, type MenuItem } from "@/lib/shared_mock_state";

const KitchenKDS: React.FC = () => {
  const { updateOrderStatus, getOrders, kitchenCategories, staff, getMenuItemById, subscribe } = useMockState();
  const [, setLocation] = useLocation();
  const [currentChefId, setCurrentChefId] = useState<string>("staff-003");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [menuItemsMap, setMenuItemsMap] = useState<Record<string, MenuItem>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const ordersData = await getOrders();
      setAllOrders(ordersData);
      
      // Pre-load menu items for filtering
      const itemsMap: Record<string, MenuItem> = {};
      for (const order of ordersData) {
        for (const item of order.items) {
          if (!itemsMap[item.menuItemId]) {
            const menuItem = await getMenuItemById(item.menuItemId);
            if (menuItem) itemsMap[item.menuItemId] = menuItem;
          }
        }
      }
      setMenuItemsMap(itemsMap);
    } catch (err) {
      console.error("Failed to load kitchen data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // Get current chef
  const currentChef = staff.find(s => s.id === currentChefId && s.role === 'kitchen');
  
  // Kitchen staff must ONLY see orders/items for their assigned kitchen_category_id
  const selectedCategory = currentChef?.kitchenCategoryId || "all";

  // Check if chef is disabled
  if (currentChef && !currentChef.isActive) {
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
              <p className="font-semibold text-red-900">{currentChef.name}</p>
              <p className="text-sm text-red-700 mt-1">Your account has been disabled by the administrator.</p>
            </div>
            <p className="text-xs text-red-600">You do not have access to the Kitchen Display System. Please contact your manager for assistance.</p>
            <Button className="w-full" onClick={() => setLocation("/")} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kitchenOrders = allOrders.filter(o => ['sent_to_kitchen', 'preparing', 'ready'].includes(o.status));

  // Filter orders by selected kitchen category
  const filteredOrders = selectedCategory === "all"
    ? kitchenOrders
    : kitchenOrders.filter(order => {
        return order.items.some(item => {
          const menuItem = menuItemsMap[item.menuItemId];
          return menuItem?.kitchenCategoryId === selectedCategory;
        });
      });

  const handleUpdateStatus = async (orderId: string, status: any) => {
    try {
      await updateOrderStatus(orderId, status, currentChefId, 'kitchen');
      loadData();
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
            <h1 className="text-2xl font-bold">Kitchen Display System (KDS)</h1>
            {currentChef && <p className="text-sm text-muted-foreground">Logged in as: {currentChef.name}</p>}
          </div>
        </div>
        <select 
          className="bg-background border rounded p-2 text-sm"
          value={currentChefId}
          onChange={(e) => setCurrentChefId(e.target.value)}
        >
          {staff.filter(s => s.role === 'kitchen').map(chef => (
            <option key={chef.id} value={chef.id}>
              {chef.name} {chef.isActive ? '(Active)' : '(Disabled)'}
            </option>
          ))}
        </select>
      </div>

      {/* Kitchen Category Info */}
      <div className="mb-6">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          Assigned Category: {kitchenCategories.find(c => c.id === selectedCategory)?.name || "All"}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p>Loading kitchen orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <p>No orders for {selectedCategory === "all" ? "the kitchen" : "this category"}</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <Card key={order.id} className={order.status === 'ready' ? 'opacity-60' : ''}>
              <CardHeader>
                <CardTitle className="text-sm">Order #{(order.id || "").slice(-5)}</CardTitle>
                {order.table_code && (
                  <div className="text-xs text-muted-foreground space-y-1 mt-2">
                    <p className="font-mono font-bold text-primary">Table: {order.table_code}</p>
                  </div>
                )}
                {!order.table_code && order.tableNumber && (
                  <p className="text-xs text-muted-foreground mt-2">Table: {order.tableNumber}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {order.items.map((item, idx) => {
                    const menuItem = menuItemsMap[item.menuItemId];
                    const shouldShowItem = selectedCategory === "all" || menuItem?.kitchenCategoryId === selectedCategory;
                    if (!shouldShowItem) return null;
                    return (
                      <div key={idx} className="flex justify-between border-b pb-1">
                        <span className="text-sm">{item.quantity}x {item.name}</span>
                        {item.notes && <span className="text-xs text-orange-400 italic">{item.notes}</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex gap-2">
                  {order.status === 'sent_to_kitchen' && (
                    <Button className="w-full" onClick={() => handleUpdateStatus(order.id, 'preparing')}>Start Preparing</Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button className="w-full" variant="secondary" onClick={() => handleUpdateStatus(order.id, 'ready')}>Mark Ready</Button>
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

export default KitchenKDS;
