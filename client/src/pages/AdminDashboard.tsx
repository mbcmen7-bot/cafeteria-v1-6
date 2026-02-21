import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMockState, CommissionConfig } from "@/contexts/MockStateContext";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Copy, Check, Settings2, Wallet, Upload, Clock, AlertTriangle, Table, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard: React.FC = () => {
  const { 
    menuCategories, 
    cafeterias, 
    orders, 
    ledgerEntries, 
    addMenuCategory,
    commissionConfig,
    getCommissionConfig,
    updateCommissionConfig,
    rechargeRequests,
    createRechargeRequest,
    waiterSections,
    waiterTables,
    kitchenCategories,
    addWaiterSection,
    addWaiterTable,
    addKitchenCategory,
    staff,
    updateStaffStatus,
    getWaiterTables
  } = useMockState();
  const [, setLocation] = useLocation();

  // State for forms
  const [newCatName, setNewCatName] = useState("");
  const [selectedCafe, setSelectedCafe] = useState(cafeterias[0]?.id || "");
  const [tableNum, setTableNum] = useState("");
  const [generatedPayload, setGeneratedPayload] = useState("");
  const [copied, setCopied] = useState(false);

  // Recharge State
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  // Commission Settings State
  const [editConfig, setEditConfig] = useState<CommissionConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(false);

  // Load commission config asynchronously
  useEffect(() => {
    const fetchConfig = async () => {
      setIsConfigLoading(true);
      try {
        const config = await getCommissionConfig();
        setEditConfig(config);
      } catch (error) {
        console.error("Failed to fetch commission config:", error);
      } finally {
        setIsConfigLoading(false);
      }
    };
    fetchConfig();
  }, [getCommissionConfig]);

  // Waiter Sections State
  const [newSectionName, setNewSectionName] = useState("");

  // Kitchen Categories State
  const [newKitchenCatName, setNewKitchenCatName] = useState("");

  // Table Management State
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableSection, setNewTableSection] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("");

  // Staff Management
  const handleToggleStaffStatus = (staffId: string, currentStatus: boolean) => {
    updateStaffStatus(staffId, !currentStatus);
    toast.success(`Staff ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
  };

  // Reset Sandbox Data
  const handleResetSandbox = () => {
    if (window.confirm('Are you sure you want to reset all sandbox data? This will clear all orders, staff changes, and return to initial state. This action cannot be undone.')) {
      // Clear localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('cafeteria_sandbox_state_v0.6.3');
        localStorage.removeItem('cafeteria_sandbox_state_v0.6.2');
      }
      // Reload the page to reinitialize with seed data
      window.location.reload();
    }
  };

  // Stats derived from ledger entries
  const currentCafe = cafeterias.find(c => c.id === selectedCafe) || cafeterias[0];
  const totalSales = orders.filter(o => o.status === 'paid' && o.cafeteriaId === selectedCafe).reduce((sum, o) => sum + o.total, 0);
  
  const pointsConsumed = ledgerEntries
    .filter(e => e.type === 'order_debit' && e.cafeteriaId === selectedCafe)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCommissions = ledgerEntries
    .filter(e => e.type === 'commission_credit')
    .reduce((sum, e) => sum + e.amount, 0);

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    addMenuCategory(newCatName);
    setNewCatName("");
    toast.success("Category added successfully");
  };

  const handleAddWaiterSection = () => {
    if (!newSectionName.trim()) {
      toast.error("Please enter a section name");
      return;
    }
    addWaiterSection(selectedCafe, newSectionName);
    setNewSectionName("");
    toast.success("Waiter section added successfully");
  };

  const handleAddKitchenCategory = () => {
    if (!newKitchenCatName.trim()) {
      toast.error("Please enter a kitchen category name");
      return;
    }
    addKitchenCategory(selectedCafe, newKitchenCatName);
    setNewKitchenCatName("");
    toast.success("Kitchen category added successfully");
  };

  const handleAddTable = () => {
    if (!newTableNumber.trim() || !newTableSection || !newTableCapacity) {
      toast.error("Please fill all table fields");
      return;
    }
    addWaiterTable(selectedCafe, newTableSection, newTableNumber, Number(newTableCapacity));
    setNewTableNumber("");
    setNewTableSection("");
    setNewTableCapacity("");
    toast.success("Table created successfully");
  };

  const handleGenerateQR = () => {
    if (!tableNum.trim()) {
      toast.error("Please enter a table number");
      return;
    }
    const payload = `${window.location.origin}/orders/guest-${Date.now()}?cafeteriaId=${selectedCafe}&tableNumber=${encodeURIComponent(tableNum)}`;
    setGeneratedPayload(payload);
    toast.success("QR Payload generated");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const copyQRPayload = (table: any) => {
    const cafe = cafeterias.find(c => c.id === table.cafeteriaId);
    const payload = JSON.stringify({
      cafeteria_code: cafe?.code || "",
      table_code: table.referenceCode,
      table_number_display: table.tableNumber,
      version: "v1"
    }, null, 2);
    
    navigator.clipboard.writeText(payload);
    toast.success(`QR Payload copied for Table ${table.referenceCode}`);
  };

  const copyQRLink = (table: any) => {
    const cafe = cafeterias.find(c => c.id === table.cafeteriaId);
    const payload = {
      cafeteria_code: cafe?.code || "",
      table_code: table.referenceCode,
      table_number_display: table.tableNumber,
      version: "v1"
    };
    
    const encodedPayload = btoa(JSON.stringify(payload));
    const link = `${window.location.origin}/scan?payload=${encodedPayload}`;
    
    navigator.clipboard.writeText(link);
    toast.success(`QR Link copied for Table ${table.referenceCode}`);
  };

  const handleSaveCommissionConfig = () => {
    if (!editConfig) return;

    const total = Number(editConfig.rate_direct_parent_percent) + 
                  Number(editConfig.rate_grandparent_percent) + 
                  Number(editConfig.rate_owner_percent);
    
    if (total !== 100) {
      toast.error(`Total must be 100%. Current total: ${total}%`);
      return;
    }

    updateCommissionConfig({
      rate_direct_parent_percent: Number(editConfig.rate_direct_parent_percent),
      rate_grandparent_percent: Number(editConfig.rate_grandparent_percent),
      rate_owner_percent: Number(editConfig.rate_owner_percent)
    });
    toast.success("Commission configuration updated");
  };

  const handleRechargeRequest = () => {
    if (!rechargeAmount || Number(rechargeAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!proofUrl) {
      toast.error("Please provide a proof image URL (Mock)");
      return;
    }

    createRechargeRequest(selectedCafe, Number(rechargeAmount), proofUrl);
    setRechargeAmount("");
    setProofUrl("");
    toast.success("Recharge request submitted for approval");
  };

  // We need to handle the fact that getWaiterTables might be async in Supabase
  // For now, let's keep it as is if it's not causing a crash, but in Supabase mode it likely returns a promise.
  // Actually, in shared_mock_state.ts, getWaiterTables is async.
  // This is likely another bug.
  
  const [cafeTables, setCafeTables] = useState<any[]>([]);
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const tables = await getWaiterTables(selectedCafe);
        setCafeTables(tables);
      } catch (error) {
        console.error("Failed to fetch tables:", error);
      }
    };
    fetchTables();
  }, [getWaiterTables, selectedCafe]);

  const cafeSections = waiterSections.filter(s => s.cafeteriaId === selectedCafe);

  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/ledger")}>View Ledger</Button>
          <Button variant="outline" onClick={() => setLocation("/waiter")}>Waiter Board</Button>
          <Button variant="outline" onClick={() => setLocation("/kitchen")}>Kitchen KDS</Button>
          <Button variant="destructive" size="sm" onClick={handleResetSandbox}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Sandbox
          </Button>
        </div>
      </div>

      {/* Point Balance Alerts */}
      {currentCafe && (currentCafe.points <= 0 || currentCafe.isTrialExpired) && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-center gap-3 text-destructive">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <p className="font-bold">Operational Block Active</p>
            <p className="text-sm">
              {currentCafe.points <= 0 ? "Your balance is empty." : "Your trial has expired."} New orders are blocked. Please recharge immediately.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className={currentCafe && currentCafe.points < 5000 ? "border-orange-500 bg-orange-50/50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Cafeteria Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(currentCafe?.points || 0).toLocaleString()} pts</div>
            <p className="text-xs text-muted-foreground mt-1">
              ≈ ${( (currentCafe?.points || 0) * 0.003 ).toFixed(2)} USD
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sales (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Points Consumed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pointsConsumed.toLocaleString()} pts</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommissions.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Commission & Payout Settings
              <Settings2 className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {isConfigLoading ? (
                <div className="py-10 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm">Loading configuration...</p>
                </div>
              ) : editConfig ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Direct Parent (%)</Label>
                    <Input 
                      type="number" 
                      value={editConfig.rate_direct_parent_percent}
                      onChange={(e) => setEditConfig({...editConfig, rate_direct_parent_percent: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grandparent (%)</Label>
                    <Input 
                      type="number" 
                      value={editConfig.rate_grandparent_percent}
                      onChange={(e) => setEditConfig({...editConfig, rate_grandparent_percent: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>System Owner (%)</Label>
                    <Input 
                      type="number" 
                      value={editConfig.rate_owner_percent}
                      onChange={(e) => setEditConfig({...editConfig, rate_owner_percent: Number(e.target.value)})}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Button className="w-full" onClick={handleSaveCommissionConfig}>Save Configuration</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Configuration unavailable</p>
              )}

              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Recharge Point Balance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (Points)</Label>
                    <Input 
                      type="number" 
                      placeholder="e.g. 50000" 
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Proof Image URL (Mock)</Label>
                    <Input 
                      placeholder="https://..." 
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button variant="outline" className="w-full" onClick={handleRechargeRequest}>
                      <Upload className="h-4 w-4 mr-2" /> Submit Recharge Request
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              QR Code Management
              <Table className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Cafeteria</Label>
                <select 
                  className="w-full p-2 border rounded-md bg-background"
                  value={selectedCafe}
                  onChange={(e) => setSelectedCafe(e.target.value)}
                >
                  {cafeterias.map(cafe => (
                    <option key={cafe.id} value={cafe.id}>{cafe.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <h4 className="text-sm font-semibold mb-2">Active Tables ({cafeTables.length})</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {cafeTables.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No tables found</p>
                  ) : (
                    cafeTables.map(table => (
                      <div key={table.id} className="p-2 border rounded text-xs flex items-center justify-between bg-muted/30">
                        <div>
                          <p className="font-bold">Table {table.tableNumber}</p>
                          <p className="text-[10px] text-muted-foreground">Code: {table.referenceCode}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyQRLink(table)} title="Copy QR Link">
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyQRPayload(table)} title="Copy QR Payload">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Create Menu Category</h3>
              <div className="flex gap-2">
                <Input 
                  placeholder="Category Name" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <Button size="sm" onClick={handleAddCategory}><Plus className="h-4 w-4" /> Add</Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Create Waiter Section</h3>
              <div className="flex gap-2">
                <Input 
                  placeholder="Section Name (e.g., A, B, C)" 
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                />
                <Button size="sm" onClick={handleAddWaiterSection}><Plus className="h-4 w-4" /> Add</Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Create Kitchen Category</h3>
              <div className="flex gap-2">
                <Input 
                  placeholder="Kitchen Category (e.g., Hot, Cold, Drinks)" 
                  value={newKitchenCatName}
                  onChange={(e) => setNewKitchenCatName(e.target.value)}
                />
                <Button size="sm" onClick={handleAddKitchenCategory}><Plus className="h-4 w-4" /> Add</Button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Marketer Payouts</h3>
              <div className="flex gap-2">
                <Button size="sm" className="w-full" onClick={() => setLocation("/payouts")}>
                  <Wallet className="h-4 w-4 mr-2" /> Manage Payouts
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">Settle commission balances with marketers.</p>
            </div>
          </CardContent>
        </Card>

        {/* Waiter Sections Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Waiter Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cafeSections.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No sections created yet</p>
              ) : (
                cafeSections.map(section => (
                  <div key={section.id} className="p-2 bg-muted rounded text-sm">
                    <span className="font-semibold">{section.name}</span>
                    {section.description && <p className="text-xs text-muted-foreground">{section.description}</p>}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Kitchen Categories Display */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Kitchen Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {kitchenCategories.filter(k => k.cafeteriaId === selectedCafe).length === 0 ? (
                <p className="text-xs text-muted-foreground italic col-span-2">No kitchen categories created yet</p>
              ) : (
                kitchenCategories.filter(k => k.cafeteriaId === selectedCafe).map(cat => (
                  <div key={cat.id} className="p-2 bg-muted rounded text-sm">
                    <span className="font-semibold">{cat.name}</span>
                    {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Staff Access Control */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Staff Access Control</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staff.filter(s => s.cafeteriaId === selectedCafe).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No staff members</p>
              ) : (
                staff.filter(s => s.cafeteriaId === selectedCafe).map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${member.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {member.isActive ? 'Active' : 'Disabled'}
                      </span>
                      <Button
                        size="sm"
                        variant={member.isActive ? "destructive" : "default"}
                        onClick={() => handleToggleStaffStatus(member.id, member.isActive)}
                      >
                        {member.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
