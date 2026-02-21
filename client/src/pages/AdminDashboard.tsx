import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMockState } from "@/contexts/MockStateContext";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Copy, Check, Settings2, Wallet, Upload, Clock, AlertTriangle, Table, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const AdminDashboard: React.FC = () => {
  const { 
    menuCategories, 
    cafeterias, 
    orders, 
    ledgerEntries, 
    addMenuCategory,
    commissionConfig,
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
  const [editConfig, setEditConfig] = useState(commissionConfig);

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

  const cafeTables = getWaiterTables(selectedCafe);
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
            <div className="text-2xl font-bold">{totalCommissions.toLocaleString()} pts</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharge Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Recharge Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Points Amount</Label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 50000" 
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground italic">50,000 pts ≈ $150.00 USD</p>
                </div>
                <div className="space-y-2">
                  <Label>Proof of Payment (Image URL)</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://example.com/proof.jpg" 
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                    />
                    <Button size="icon" variant="outline" onClick={() => setProofUrl("https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400")}>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={handleRechargeRequest}>Submit Recharge Request</Button>
              </div>

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Requests
                </Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left font-medium">Amount</th>
                        <th className="p-2 text-left font-medium">Status</th>
                        <th className="p-2 text-left font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rechargeRequests.filter(r => r.cafeteriaId === selectedCafe).slice(0, 5).map(req => (
                        <tr key={req.id}>
                          <td className="p-2">{req.amount.toLocaleString()}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                              req.status === 'approved' ? 'bg-green-100 text-green-700' : 
                              req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-2 text-xs text-muted-foreground">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {rechargeRequests.filter(r => r.cafeteriaId === selectedCafe).length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-muted-foreground italic">No requests found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Settings Section */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings2 className="h-4 w-4 text-primary" />
              Commission Config (Owner)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Direct Parent (%)</Label>
              <Input 
                type="number" 
                className="h-8 text-sm"
                value={editConfig.rate_direct_parent_percent}
                onChange={(e) => setEditConfig({...editConfig, rate_direct_parent_percent: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Grandparent (%)</Label>
              <Input 
                type="number" 
                className="h-8 text-sm"
                value={editConfig.rate_grandparent_percent}
                onChange={(e) => setEditConfig({...editConfig, rate_grandparent_percent: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Owner (%)</Label>
              <Input 
                type="number" 
                className="h-8 text-sm"
                value={editConfig.rate_owner_percent}
                onChange={(e) => setEditConfig({...editConfig, rate_owner_percent: Number(e.target.value)})}
              />
            </div>
            <div className="pt-2">
              <p className="text-[10px] text-muted-foreground mb-2">
                Total: {Number(editConfig.rate_direct_parent_percent) + Number(editConfig.rate_grandparent_percent) + Number(editConfig.rate_owner_percent)}%
              </p>
              <Button size="sm" className="w-full" onClick={handleSaveCommissionConfig}>Save Config</Button>
            </div>
          </CardContent>
        </Card>

        {/* Table Management Section */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5 text-primary" />
              Table Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create New Table */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Create New Table</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Table Number</Label>
                    <Input 
                      placeholder="e.g., A-01" 
                      value={newTableNumber}
                      onChange={(e) => setNewTableNumber(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Section</Label>
                    <select 
                      className="w-full bg-background border rounded p-2 h-9 text-sm"
                      value={newTableSection}
                      onChange={(e) => setNewTableSection(e.target.value)}
                    >
                      <option value="">Select Section</option>
                      {cafeSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Capacity</Label>
                    <Input 
                      type="number" 
                      placeholder="e.g., 4" 
                      value={newTableCapacity}
                      onChange={(e) => setNewTableCapacity(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <Button className="w-full" onClick={handleAddTable}>
                    <Plus className="h-4 w-4 mr-2" /> Create Table
                  </Button>
                </div>
              </div>

              {/* Existing Tables with QR Payload */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Existing Tables</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {cafeTables.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No tables created yet</p>
                  ) : (
                    cafeTables.map(table => (
                      <div key={table.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{table.tableNumber}</p>
                            <p className="text-xs text-muted-foreground">Capacity: {table.capacity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono font-bold text-primary">{table.referenceCode}</p>
                            <p className="text-[10px] text-muted-foreground">Reference Code</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => copyQRPayload(table)}
                          >
                            <Copy className="h-3 w-3 mr-1" /> JSON
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => copyQRLink(table)}
                          >
                            <Copy className="h-3 w-3 mr-1" /> Link
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
