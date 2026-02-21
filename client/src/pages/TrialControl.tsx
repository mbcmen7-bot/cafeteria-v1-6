import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMockState } from "@/contexts/MockStateContext";
import { useLocation } from "wouter";
import { ArrowLeft, Clock, Settings, Building2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TrialControl: React.FC = () => {
  const { 
    trialConfig, 
    updateTrialConfig, 
    cafeterias,
    updateCafeteriaTrialOverride
  } = useMockState();
  const [, setLocation] = useLocation();

  const [globalDays, setGlobalDays] = useState<string>(trialConfig.globalTrialDays.toString());
  const [selectedCafeId, setSelectedCafeId] = useState<string>('');
  const [overrideDays, setOverrideDays] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleUpdateGlobal = () => {
    const days = parseInt(globalDays);
    if (isNaN(days) || days < 0) {
      toast.error('Please enter a valid number of days');
      return;
    }
    updateTrialConfig({ globalTrialDays: days });
    toast.success(`Global trial period updated to ${days} days`);
  };

  const handleSetOverride = () => {
    if (!selectedCafeId) {
      toast.error('Please select a cafeteria');
      return;
    }

    const days = overrideDays === '' ? undefined : parseInt(overrideDays);
    if (days !== undefined && (isNaN(days) || days < 0)) {
      toast.error('Please enter a valid number of days');
      return;
    }

    updateCafeteriaTrialOverride(selectedCafeId, days);
    
    if (days === undefined) {
      toast.success('Override removed - using global trial period');
    } else {
      toast.success(`Trial override set to ${days} days`);
    }
    
    setSelectedCafeId('');
    setOverrideDays('');
    setIsDialogOpen(false);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/owner")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Trial Control
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Global Trial Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Global Trial Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="globalDays">Default Trial Days</Label>
                  <Input
                    id="globalDays"
                    type="number"
                    value={globalDays}
                    onChange={(e) => setGlobalDays(e.target.value)}
                    placeholder="Enter number of days"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This applies to all cafeterias unless overridden individually
                  </p>
                </div>
                <Button onClick={handleUpdateGlobal}>
                  Update Global Setting
                </Button>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm">
                  <strong>Current Global Trial Period:</strong> {trialConfig.globalTrialDays} days
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  New cafeterias will automatically receive this trial period unless a specific override is set.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per-Cafeteria Overrides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Per-Cafeteria Trial Overrides
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Set Override</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Trial Override</DialogTitle>
                    <DialogDescription>
                      Override the global trial period for a specific cafeteria. Leave empty to remove override.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="cafeteria">Cafeteria</Label>
                      <select
                        id="cafeteria"
                        className="w-full p-2 border rounded-md bg-background"
                        value={selectedCafeId}
                        onChange={(e) => setSelectedCafeId(e.target.value)}
                      >
                        <option value="">Select cafeteria</option>
                        {cafeterias.map(cafe => (
                          <option key={cafe.id} value={cafe.id}>
                            {cafe.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="overrideDays">Override Days (leave empty to remove)</Label>
                      <Input
                        id="overrideDays"
                        type="number"
                        placeholder="Enter days or leave empty"
                        value={overrideDays}
                        onChange={(e) => setOverrideDays(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSetOverride}>
                      Apply Override
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cafeterias.map(cafe => (
                <div key={cafe.id} className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {cafe.isTrialExpired && (
                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-bold">{cafe.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {cafe.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {cafe.trialDaysOverride !== undefined ? (
                      <div>
                        <p className="text-sm font-semibold text-primary">{cafe.trialDaysOverride} days (Override)</p>
                        <p className="text-xs text-muted-foreground">Custom trial period</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold">{trialConfig.globalTrialDays} days (Global)</p>
                        <p className="text-xs text-muted-foreground">Using default</p>
                      </div>
                    )}
                    {cafe.isTrialExpired && (
                      <p className="text-xs text-destructive font-bold mt-1">⚠️ EXPIRED</p>
                    )}
                  </div>
                </div>
              ))}
              {cafeterias.length === 0 && (
                <div className="py-10 text-center text-muted-foreground italic">
                  No cafeterias in the system yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trial Enforcement Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Trial Enforcement Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg bg-muted/30">
                <p className="font-semibold text-sm">🚫 Block New Orders</p>
                <p className="text-xs text-muted-foreground">
                  When trial expires, customers cannot create new orders until recharge is approved.
                </p>
              </div>
              <div className="p-3 border rounded-lg bg-muted/30">
                <p className="font-semibold text-sm">🚫 Block Payment Settlement</p>
                <p className="text-xs text-muted-foreground">
                  Existing orders can proceed through kitchen/waiter flow, but cannot be marked as PAID until recharge.
                </p>
              </div>
              <div className="p-3 border rounded-lg bg-muted/30">
                <p className="font-semibold text-sm">✅ Reset on Recharge</p>
                <p className="text-xs text-muted-foreground">
                  When a recharge is approved, the trial expired flag is automatically reset.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrialControl;
