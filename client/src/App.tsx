import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { MockStateProvider } from "./contexts/MockStateContext";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import OrderStatus from "./pages/OrderStatus";
import WaiterBoard from "./pages/WaiterBoard";
import KitchenKDS from "./pages/KitchenKDS";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import LedgerView from "./pages/LedgerView";
import PayoutManagement from "./pages/PayoutManagement";
import MarketerDashboard from "./pages/MarketerDashboard";
import ReportsPage from "./pages/ReportsPage";
import TrialControl from "./pages/TrialControl";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/orders"} component={Orders} />
      <Route path={"/orders/:sessionId"} component={Orders} />
      <Route path={"/order-status/:orderId"} component={OrderStatus} />
      <Route path={"/waiter"} component={WaiterBoard} />
      <Route path={"/kitchen"} component={KitchenKDS} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/owner"} component={OwnerDashboard} />
      <Route path={"/ledger"} component={LedgerView} />
      <Route path={"/payouts"} component={PayoutManagement} />
      <Route path={"/marketer"} component={MarketerDashboard} />
      <Route path={"/reports"} component={ReportsPage} />
      <Route path={"/trial-control"} component={TrialControl} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <AuthProvider>
          <MockStateProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </MockStateProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
