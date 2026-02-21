import { useEffect, useRef, useState } from "react";
import { MapView } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, Star, Clock, LogOut, LogIn, QrCode, Settings, ShieldCheck, LayoutDashboard } from "lucide-react";
import { generateSessionId } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useMockState } from "@/contexts/MockStateContext";

export default function Home() {
  const { isLoggedIn, userId, userEmail, role, logout, isLoading: authLoading } = useAuth();
  const { cafeterias } = useMockState();
  const [, setLocation] = useLocation();
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCafeteria, setSelectedCafeteria] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Request user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setUserLocation({ lat: 37.7749, lng: -122.4194 });
          setLoading(false);
          toast.error("Unable to get your location. Using default location.");
        }
      );
    }
  }, []);

  // Update markers when cafeterias or map is ready
  useEffect(() => {
    if (mapRef.current && cafeterias.length > 0) {
      addMarkersToMap(cafeterias);
    }
  }, [cafeterias]);

  const addMarkersToMap = (cafes: any[]) => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current = [];

    // Add new markers
    cafes.forEach((cafe) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: cafe.latitude, lng: cafe.longitude },
        title: cafe.name,
      });

      marker.addListener("click", () => {
        setSelectedCafeteria(cafe);
      });

      markersRef.current.push(marker);
    });
  };

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    if (userLocation) {
      map.setCenter(userLocation);
      map.setZoom(14);
    }
    if (cafeterias.length > 0) {
      addMarkersToMap(cafeterias);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      setIsProcessing(true);
      let result;
      if (authMode === "login") {
        result = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
      } else {
        result = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
      }

      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success(`${authMode === "login" ? "Logged in" : "Signed up"} successfully!`);
        setShowAuthDialog(false);
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderDashboardLink = () => {
    if (!isLoggedIn) return null;

    let path = "/";
    let label = "Dashboard";
    let icon = <LayoutDashboard className="h-4 w-4 mr-2" />;

    switch (role) {
      case 'owner':
        path = "/owner";
        label = "System Owner";
        icon = <ShieldCheck className="h-4 w-4 mr-2" />;
        break;
      case 'marketer':
        path = "/marketer";
        label = "Marketer Portal";
        break;
      case 'cafe_admin':
      case 'manager':
        path = "/admin";
        label = "Cafe Admin";
        break;
      case 'waiter':
        path = "/waiter";
        label = "Waiter Board";
        break;
      case 'kitchen':
        path = "/kitchen";
        label = "Kitchen KDS";
        break;
    }

    return (
      <Button variant="outline" size="sm" onClick={() => setLocation(path)} className="gap-2">
        {icon}
        {label}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Cafeteria Map</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const sessionId = generateSessionId();
                const payload = {
                  cafeteria_code: "1001AB",
                  table_code: "1001ABT01",
                  table_number_display: "A-01",
                  version: "v1"
                };
                const encodedPayload = btoa(JSON.stringify(payload));
                setLocation(`/orders/${sessionId}?cafeteriaId=100101&payload=${encodedPayload}`);
              }}
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              Scan QR (Demo)
            </Button>
            
            {renderDashboardLink()}

            {isLoggedIn ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-medium leading-none">{userEmail}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{role}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setShowAuthDialog(true);
                  setAuthMode("login");
                }}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Nearby Cafeterias</CardTitle>
              <CardDescription>
                {loading ? "Loading..." : `Found ${cafeterias.length} cafeterias near you`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MapView
                initialCenter={userLocation || { lat: 37.7749, lng: -122.4194 }}
                initialZoom={14}
                onMapReady={handleMapReady}
                className="w-full h-[400px] rounded-lg"
              />
            </CardContent>
          </Card>
        </div>

        {/* Cafeteria List Section */}
        <div className="lg:col-span-1">
          <Card className="h-full overflow-hidden flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Cafeterias</CardTitle>
              <CardDescription>Tap to view details</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading cafeterias...</p>
                </div>
              ) : cafeterias.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">No cafeterias found nearby.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cafeterias.map((cafe) => (
                    <button
                      key={cafe.id}
                      onClick={() => setSelectedCafeteria(cafe)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <h3 className="font-semibold text-sm">{cafe.name}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {cafe.rating.toFixed(1)}
                        </div>
                        <span>({cafe.reviewCount})</span>
                        {cafe.isOpen && (
                          <span className="text-green-500 font-semibold">Open</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Cafeteria Details Dialog */}
      {selectedCafeteria && (
        <Dialog open={!!selectedCafeteria} onOpenChange={() => setSelectedCafeteria(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedCafeteria.name}</DialogTitle>
              <DialogDescription>{selectedCafeteria.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold">{selectedCafeteria.rating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({selectedCafeteria.reviewCount} reviews)
                </span>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Address</Label>
                <p className="text-sm">{selectedCafeteria.address}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <p className="text-sm">{selectedCafeteria.phone}</p>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className={selectedCafeteria.isOpen ? "text-green-500" : "text-red-500"}>
                  {selectedCafeteria.isOpen ? "Open now" : "Closed"}
                </span>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedCafeteria(null)}>
                  Close
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={() => {
                    const sessionId = generateSessionId();
                    setLocation(`/orders/${sessionId}?cafeteriaId=${selectedCafeteria.id}&tableNumber=Table%201`);
                  }}
                >
                  Order Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{authMode === "login" ? "Login" : "Sign Up"}</DialogTitle>
            <DialogDescription>
              {authMode === "login"
                ? "Enter your credentials to access your account."
                : "Create a new account to start ordering."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAuth} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing ? "Processing..." : authMode === "login" ? "Login" : "Sign Up"}
            </Button>
          </form>
          <div className="text-center text-sm">
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
            >
              {authMode === "login"
                ? "Don't have an account? Sign Up"
                : "Already have an account? Login"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
