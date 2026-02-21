import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Star, Send, Plus, Minus, ShoppingCart, XCircle } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { type Order, type OrderItem as MockOrderItem, type OrderStatus } from "@/lib/mockData";
import { useMockState } from "@/contexts/MockStateContext";
import { useAuth } from "@/contexts/AuthContext";


interface CartItem extends MockOrderItem {
  id?: string;  // Add id property for compatibility
  notes?: string;
}

export default function Orders() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/orders/:sessionId");
  const { guestSessionId } = useAuth();

  const sessionId = params?.sessionId || guestSessionId;

  const urlParams = new URLSearchParams(window.location.search);
  const cafeteriaId = urlParams.get("cafeteriaId") || "100101";
  
  // Parse canonical QR payload
  const encodedPayload = urlParams.get("payload");
  let qrPayload = {
    cafeteria_code: "",
    table_code: "",
    table_number_display: "",
    version: "v1"
  };
  
  if (encodedPayload) {
    try {
      qrPayload = JSON.parse(atob(encodedPayload));
    } catch (e) {
      console.error("Failed to parse QR payload:", e);
    }
  }
  
  // Legacy URL parameters fallback
  const tableNumber = urlParams.get("tableNumber") || qrPayload.table_number_display || "Guest Order";
  const cafeteriaCode = urlParams.get("cafeteriaCode") || qrPayload.cafeteria_code || "";
  const tableCode = urlParams.get("tableCode") || qrPayload.table_code || "";
  const tableNumberDisplay = urlParams.get("tableNumberDisplay") || qrPayload.table_number_display || tableNumber;

  const { getCafeteriaById, getMenuCategories, getMenuItemsByCategoryId, createOrder, getOrderById, subscribe } = useMockState();

  const [cafeteria, setCafeteria] = useState(getCafeteriaById(cafeteriaId));
  const [menu, setMenu] = useState(() => {
    const categories = getMenuCategories();
    const items = categories.flatMap(cat => getMenuItemsByCategoryId(cat.id));
    return { categories, items };
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null | undefined>(null);
  const [loading, setLoading] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<CartItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState("");

  const [showConfirmation, setShowConfirmation] = useState(!!encodedPayload);
  const [confirmedPayload, setConfirmedPayload] = useState(!!encodedPayload);
  useEffect(() => {
    if (!cafeteria) {
      toast.error("Cafeteria not found.");
      setLocation("/");
      return;
    }
    // Load existing order if any
    const existingOrder = getOrderById(sessionId);
    if (existingOrder) {
      setCurrentOrder(existingOrder);
      // If order exists, populate cart with its items
      setCart(existingOrder.items.map(item => ({...item, notes: item.notes || ''})));
    }

    const unsubscribe = subscribe(() => {
      const order = getOrderById(sessionId);
      if (order) {
        setCurrentOrder(order);
      }
    });

    return () => unsubscribe();
  }, [sessionId, cafeteriaId, cafeteria, setLocation]);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleAddToCart = (menuItem: typeof menu.items[0]) => {
    setSelectedMenuItem({ ...menuItem, menuItemId: menuItem.id, quantity: 1, notes: "" });
    setItemQuantity(1);
    setItemNotes("");
    setShowNotesDialog(true);
  };

  const confirmAddToCart = () => {
    if (!selectedMenuItem) return;

    const existingItemIndex = cart.findIndex(
      (item) => item.menuItemId === selectedMenuItem.menuItemId && item.notes === itemNotes
    );

    if (existingItemIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += itemQuantity;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          menuItemId: selectedMenuItem.menuItemId,
          name: selectedMenuItem.name,
          price: selectedMenuItem.price,
          quantity: itemQuantity,
          notes: itemNotes,
        },
      ]);
    }
    toast.success(`${itemQuantity} x ${selectedMenuItem.name} added to cart.`);
    setShowNotesDialog(false);
  };

  const handleRemoveFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
    toast.info("Item removed from cart.");
  };

  const handleUpdateCartQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQuantity;
    setCart(updatedCart);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    setLoading(true);
    try {
      const orderItemsForCreation: MockOrderItem[] = cart.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
      }));
      const newOrder = await createOrder(sessionId, cafeteriaId, orderItemsForCreation, {
        cafeteria_code: cafeteriaCode || "",
        table_code: tableCode || "",
        table_number_display: tableNumberDisplay || tableNumber,
        version: "v1"
      });
      setCurrentOrder(newOrder);
      toast.success("Order placed successfully!");
      setLocation(`/order-status/${newOrder.id}`);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!cafeteria) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold">Cafeteria Not Found</h1>
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
            <h1 className="text-xl font-bold">Order at {tableNumber}</h1>
            <p className="text-sm text-muted-foreground">Cafeteria {cafeteria.name}</p>
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" className="relative">
              <ShoppingCart className="h-4 w-4" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-xs">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>


      {showConfirmation && (
        <div className="border-b border-border bg-blue-50 dark:bg-blue-950 p-4">
          <div className="container">
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg">Confirm Table & Cafeteria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cafeteria Code</p>
                    <p className="font-mono font-bold text-lg">{qrPayload.cafeteria_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Table Number</p>
                    <p className="font-mono font-bold text-lg">{qrPayload.table_number_display}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Table Code</p>
                  <p className="font-mono font-bold">{qrPayload.table_code}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => setShowConfirmation(false)}
                  >
                    Start Ordering
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setLocation("/")}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <main className="container py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 pb-24 lg:pb-6">
        {/* Menu Section */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Menu</CardTitle>
              <CardDescription>Select items to add to your order</CardDescription>
            </CardHeader>
            <CardContent>
              {menu.categories.map((category) => (
                <div key={category.id} className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">{category.name}</h2>
                  <div className="grid gap-4">
                    {menu.items
                      .filter((item) => item.categoryId === category.id)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <p className="text-sm font-semibold">${item.price.toFixed(2)}</p>
                          </div>
                          <Button size="sm" onClick={() => handleAddToCart(item)}>
                            <Plus className="h-4 w-4" /> Add
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary / Cart Section */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 hidden lg:block">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your items before placing order</CardDescription>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-muted-foreground">No items added yet.</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.notes && <p className="text-xs text-muted-foreground">Notes: {item.notes}</p>}
                        <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateCartQuantity(index, item.quantity - 1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-medium">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleUpdateCartQuantity(index, item.quantity + 1)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveFromCart(index)}>
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-lg font-bold">Total:</p>
                    <p className="text-lg font-bold">${totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              )}
              <Button
                onClick={handlePlaceOrder}
                className="w-full mt-4"
                disabled={cart.length === 0 || loading || (currentOrder !== null && currentOrder !== undefined && currentOrder.status !== 'created')}
              >
                {loading ? "Placing Order..." : currentOrder ? `Order ${currentOrder.status}` : "Place Order"}
              </Button>
              {currentOrder && currentOrder !== undefined && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">Order ID: {currentOrder.id}</p>
                  <p className="text-sm text-muted-foreground">Status: {currentOrder.status}</p>
                  <Button variant="link" onClick={() => setLocation(`/order-status/${currentOrder.id}`)}>
                    View Order Status
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notes for {selectedMenuItem?.name}</DialogTitle>
            <DialogDescription>Specify any special requests or dietary needs.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <Textarea
                id="notes"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                placeholder="e.g., no onions, extra sauce, allergy info"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>Cancel</Button>
            <Button onClick={confirmAddToCart}>Add to Cart</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Sticky Footer for Order Summary */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50">
        <div className="container flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              {cart.length === 0 ? "No items" : `${cart.reduce((sum, item) => sum + item.quantity, 0)} items`}
            </p>
            <p className="text-lg font-bold">${totalAmount.toFixed(2)}</p>
          </div>
          <Button
            onClick={handlePlaceOrder}
            className="flex-1"
            disabled={cart.length === 0 || loading || (currentOrder !== null && currentOrder !== undefined && currentOrder.status !== 'created')}
            size="lg"
          >
            {loading ? "Placing..." : currentOrder && currentOrder !== undefined ? `Order ${currentOrder.status}` : "Place Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
