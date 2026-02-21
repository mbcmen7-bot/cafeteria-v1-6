import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockState, SecurityEvent } from "@/contexts/MockStateContext";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle, Eye, ShieldCheck, Wallet, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const OwnerDashboard: React.FC = () => {
  const { rechargeRequests, cafeterias, processRechargeRequest, getSecurityEvents, staff } = useMockState();
  const [, setLocation] = useLocation();
  const [showSecurityEvents, setShowSecurityEvents] = useState(false);
  const [filterBlockedOnly, setFilterBlockedOnly] = useState(true);
  const [filterByRole, setFilterByRole] = useState<string>('all');
  
  // State for security events
  const [allSecurityEvents, setAllSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(false);

  // Load security events asynchronously
  useEffect(() => {
    const fetchEvents = async () => {
      setIsEventsLoading(true);
      try {
        const events = await getSecurityEvents();
        if (Array.isArray(events)) {
          // Take the last 200 events
          setAllSecurityEvents(events.slice(-200));
        }
      } catch (error) {
        console.error("Failed to fetch security events:", error);
        toast.error("Failed to load security events log");
      } finally {
        setIsEventsLoading(false);
      }
    };

    fetchEvents();
  }, [getSecurityEvents]);

  const pendingRequests = rechargeRequests.filter(r => r.status === 'pending');
  
  // Filter security events
  const filteredSecurityEvents = allSecurityEvents
    .filter(e => !filterBlockedOnly || e.blocked)
    .filter(e => filterByRole === 'all' || e.role === filterByRole)
    .reverse(); // Most recent first

  const handleProcess = (id: string, status: 'approved' | 'rejected') => {
    processRechargeRequest(id, status);
    toast.success(`Request ${status} successfully`);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            System Owner Control
          </h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setLocation("/trial-control")}>
            <Clock className="h-4 w-4 mr-2" />
            Trial Control
          </Button>
          <Button onClick={() => setLocation("/payouts")}>
            <Wallet className="h-4 w-4 mr-2" />
            Payout Management
          </Button>
          <Button onClick={() => setShowSecurityEvents(!showSecurityEvents)} variant={showSecurityEvents ? "default" : "outline"}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Security Events
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Pending Recharge Approvals
              <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-1 rounded">
                {pendingRequests.length} Pending
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.map(req => {
                const cafe = cafeterias.find(c => c.id === req.cafeteriaId);
                return (
                  <div key={req.id} className="border rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                        <img src={req.proofImageUrl} alt="Proof" className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold">{cafe?.name || 'Unknown Cafeteria'}</p>
                        <p className="text-sm text-muted-foreground">Amount: <span className="text-foreground font-semibold">{req.amount.toLocaleString()} pts</span></p>
                        <p className="text-[10px] text-muted-foreground">Requested: {new Date(req.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 md:flex-none"
                        onClick={() => window.open(req.proofImageUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View Proof
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="flex-1 md:flex-none"
                        onClick={() => handleProcess(req.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 flex-1 md:flex-none"
                        onClick={() => handleProcess(req.id, 'approved')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                );
              })}
              {pendingRequests.length === 0 && (
                <div className="py-10 text-center text-muted-foreground italic">
                  No pending recharge requests at this time.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-xs text-muted-foreground uppercase font-bold">Total Cafeterias</p>
                <p className="text-2xl font-bold">{cafeterias.length}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-xs text-muted-foreground uppercase font-bold">Flagged Balances (Low)</p>
                <p className="text-2xl font-bold text-orange-500">
                  {cafeterias.filter(c => c.points < 10000).length}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-xs text-muted-foreground uppercase font-bold">Expired Trials</p>
                <p className="text-2xl font-bold text-destructive">
                  {cafeterias.filter(c => c.isTrialExpired).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {showSecurityEvents && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Security Events Log
                </span>
                <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-1 rounded">
                  {filteredSecurityEvents.length} Events
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-2 pb-4 border-b">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filterBlockedOnly}
                      onChange={(e) => setFilterBlockedOnly(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Blocked Only</span>
                  </label>
                  <select
                    value={filterByRole}
                    onChange={(e) => setFilterByRole(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="all">All Roles</option>
                    <option value="waiter">Waiter</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="customer">Customer</option>
                    <option value="system">System</option>
                  </select>
                </div>

                {/* Events List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {isEventsLoading ? (
                    <div className="py-10 flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <p className="text-sm">Loading security events...</p>
                    </div>
                  ) : filteredSecurityEvents.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground italic">
                      No security events to display
                    </div>
                  ) : (
                    filteredSecurityEvents.map(event => {
                      const actor = staff.find(s => s.id === event.actorId);
                      return (
                        <div key={event.id} className={`text-xs p-2 rounded border ${
                          event.blocked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-mono font-bold">
                                {event.blocked ? '❌' : '✓'} {event.attemptedAction}
                              </p>
                              <p className="text-muted-foreground">
                                Actor: {actor?.name || event.actorId} ({event.role})
                              </p>
                              {event.reason && (
                                <p className="text-red-600 font-semibold">{event.reason}</p>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
