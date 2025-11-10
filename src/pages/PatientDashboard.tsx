import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Activity, Thermometer, Droplet, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AIInsights from "@/components/dashboard/AIInsights";
import ReportUpload from "@/components/patient/ReportUpload";
import ConsultationRequest from "@/components/patient/ConsultationRequest";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  // Mock data - will be replaced with real data from smartwatch integration
  const currentVitals = {
    heartRate: 72,
    bloodPressure: "120/80",
    temperature: 98.6,
    oxygen: 98,
  };

  const aiInsights = [
    {
      id: "1",
      type: "normal" as const,
      message: "All vitals are within normal range. Keep up the good work!",
      severity: "info" as const,
      timestamp: "2 min ago",
    },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleConnectDevice = () => {
    if (deviceConnected) {
      setDeviceConnected(false);
      setLastSync(null);
      toast({
        title: "Device Disconnected",
        description: "Your smartwatch has been disconnected.",
      });
    } else {
      setShowConnectDialog(true);
    }
  };

  const confirmConnection = () => {
    setDeviceConnected(true);
    setLastSync(new Date());
    setShowConnectDialog(false);
    toast({
      title: "Device Connected Successfully",
      description: "Google Fit mock data stream started. Vitals will update automatically.",
    });
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || 'Patient'}</h1>
              <p className="text-muted-foreground">Your Health Dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Current Vitals */}
          <Card>
            <CardHeader>
              <CardTitle>Current Vitals</CardTitle>
              <CardDescription>Live from your connected devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted">
                  <Heart className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-2xl font-bold">{currentVitals.heartRate}</p>
                  <p className="text-xs text-muted-foreground">bpm</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted">
                  <Activity className="h-8 w-8 text-primary mb-2" />
                  <p className="text-2xl font-bold">{currentVitals.bloodPressure}</p>
                  <p className="text-xs text-muted-foreground">mmHg</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted">
                  <Thermometer className="h-8 w-8 text-warning mb-2" />
                  <p className="text-2xl font-bold">{currentVitals.temperature}</p>
                  <p className="text-xs text-muted-foreground">°F</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted">
                  <Droplet className="h-8 w-8 text-secondary mb-2" />
                  <p className="text-2xl font-bold">{currentVitals.oxygen}</p>
                  <p className="text-xs text-muted-foreground">%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
              <CardDescription>Smartwatch and wearable status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${deviceConnected ? 'bg-success' : 'bg-muted-foreground'}`}></div>
                    <div>
                      <p className="font-medium text-sm">
                        {deviceConnected ? 'Google Fit Connected' : 'No devices connected'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {deviceConnected && lastSync 
                          ? `Last synced: ${lastSync.toLocaleTimeString()}`
                          : 'Connect your smartwatch to start monitoring'
                        }
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant={deviceConnected ? "destructive" : "outline"}
                    onClick={handleConnectDevice}
                  >
                    {deviceConnected ? 'Disconnect' : 'Connect Device'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <AIInsights insights={aiInsights} />

          {/* Report Upload and Consultation */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ReportUpload />
            <ConsultationRequest />
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
              {profile?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Monitoring Mode</p>
                <Badge variant="secondary">AI Assistant Only</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connect Device Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Smart Device</DialogTitle>
            <DialogDescription>
              Connect your smartwatch to enable continuous health monitoring.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              This will simulate a connection to Google Fit for demonstration purposes. 
              In production, you'll authenticate with your actual device.
            </p>
            <div className="flex gap-2">
              <Button onClick={confirmConnection} className="flex-1">
                Connect Google Fit
              </Button>
              <Button variant="outline" onClick={() => setShowConnectDialog(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientDashboard;
