import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, XCircle, Clock, Utensils, DollarSign, Package } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { type Order, type OrderStatus as MockOrderStatus } from "@/lib/shared_mock_state";
import { useMockState } from "@/contexts/MockStateContext";
import { toast } from "sonner";

const OrderStatusPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/order-status/:orderId");
  const orderId = params?.orderId;
  const { getOrderById, subscribe, updateOrderStatus } = useMockState();

  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const foundOrder = await getOrderById(orderId);
      setOrder(foundOrder);
      if (!foundOrder && !loading) {
        toast.error("Order not found.");
        setLocation("/");
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      toast.error("Order ID not provided.");
      setLocation("/");
      return;
    }

    fetchOrder();

    const unsubscribe = subscribe(() => {
      fetchOrder();
    });

    return () => {
      unsubscribe();
    };
  }, [orderId, setLocation]);

  const getStatusIcon = (status: MockOrderStatus) => {
    switch (status) {
      case "created":
        return <Package className="h-6 w-6 text-blue-500" />;
      case "sent_to_kitchen":
        return <Utensils className="h-6 w-6 text-yellow-500" />;
      case "preparing":
        return <Utensils className="h-6 w-6 text-orange-500" />;
      case "ready":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "served":
        return <CheckCircle className="h-6 w-6 text-purple-500" />;
      case "paid":
        return <DollarSign className="h-6 w-6 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-gray-500" />;
    }
  };

  const handlePay = async () => {
    if (!order) return;
    try {
      await updateOrderStatus(order.id, 'paid');
      toast.success("Order paid successfully!");
      fetchOrder();
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold">Loading Order...</h1>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold">Order Not Found</h1>
        <Button onClick={() => setLocation("/")} className="mt-4">Go to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Order Status</h1>
            <p className="text-sm text-muted-foreground">Order ID: {order.id}</p>
          </div>
        </div>
      </header>

      <main className="container py-6 flex-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Order #{(order.id || "").slice(-5)}</CardTitle>
            {getStatusIcon(order.status)}
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cafeteria: {order.cafeteriaId}</p>
                <p className="text-sm text-muted-foreground">Table: {order.table_number_display || order.tableNumber || "N/A"}</p>
                <p className="text-sm text-muted-foreground">Placed At: {new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Items:</h3>
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm mb-1">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <p className="text-xl font-bold">Total:</p>
                <p className="text-xl font-bold">${order.total.toFixed(2)}</p>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">Current Status:</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <p className="text-lg font-medium capitalize">{order.status.replace(/_/g, " ")}</p>
                  </div>
                  {order.status === 'served' && (
                    <Button onClick={handlePay} className="bg-green-600 hover:bg-green-700">
                      <DollarSign className="mr-2 h-4 w-4" /> Pay Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default OrderStatusPage;
