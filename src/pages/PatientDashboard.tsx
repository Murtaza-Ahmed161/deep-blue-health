import { useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Activity, Thermometer, Droplet, LogOut, Settings, User, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AIInsights from "@/components/dashboard/AIInsights";
import ReportUpload from "@/components/patient/ReportUpload";
import ConsultationRequest from "@/components/patient/ConsultationRequest";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import { SkeletonVitalsCard, SkeletonCard } from "@/components/ui/skeleton-card";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  // Track user session
  useSessionTracking();

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
      {/* Header - Responsive */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold truncate">Welcome, {profile?.full_name || 'Patient'}</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Your Health Dashboard</p>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <FeedbackButton />
              <Button variant="outline" onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <FeedbackButton variant="outline" size="default" />
                  <Button variant="outline" onClick={() => navigate('/settings')} className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Desktop View */}
        <div className="hidden md:grid gap-6">
          <Suspense fallback={<SkeletonVitalsCard />}>
          <Card>
            <CardHeader>
              <CardTitle>Current Vitals</CardTitle>
              <CardDescription>Live from your connected devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted touch-target">
                  <Heart className="h-8 w-8 text-destructive mb-2" />
                  <p className="text-2xl font-bold">{currentVitals.heartRate}</p>
                  <p className="text-xs text-muted-foreground">bpm</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted touch-target">
                  <Activity className="h-8 w-8 text-primary mb-2" />
                  <p className="text-2xl font-bold">{currentVitals.bloodPressure}</p>
                  <p className="text-xs text-muted-foreground">mmHg</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted touch-target">
                  <Thermometer className="h-8 w-8 text-warning mb-2" />
                  <p className="text-2xl font-bold">{currentVitals.temperature}</p>
                  <p className="text-xs text-muted-foreground">°F</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-lg bg-muted touch-target">
                  <Droplet className="h-8 w-8 text-secondary mb-2" />
                  <p className="text-2xl font-bold">{currentVitals.oxygen}</p>
                  <p className="text-xs text-muted-foreground">%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </Suspense>

          <Suspense fallback={<SkeletonCard />}>
          <Card>
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
              <CardDescription>Smartwatch and wearable status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${deviceConnected ? 'bg-success' : 'bg-muted-foreground'}`}></div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">
                        {deviceConnected ? 'Google Fit Connected' : 'No devices connected'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
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
                    className="shrink-0"
                  >
                    {deviceConnected ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          </Suspense>

          <AIInsights insights={aiInsights} />

          <div className="grid lg:grid-cols-2 gap-6">
            <ReportUpload />
            <ConsultationRequest />
          </div>

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

        {/* Mobile Tabbed View */}
        <Tabs defaultValue="vitals" className="md:hidden">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="vitals" className="text-xs">Vitals</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="vitals" className="space-y-4 mt-0">
            <Suspense fallback={<SkeletonVitalsCard />}>
            <Card className="touch-pan-y">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Vitals</CardTitle>
                <CardDescription className="text-xs">Live from your devices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center p-5 rounded-lg bg-muted touch-target min-h-[120px] justify-center">
                    <Heart className="h-7 w-7 text-destructive mb-2" />
                    <p className="text-2xl font-bold">{currentVitals.heartRate}</p>
                    <p className="text-xs text-muted-foreground">bpm</p>
                  </div>
                  <div className="flex flex-col items-center p-5 rounded-lg bg-muted touch-target min-h-[120px] justify-center">
                    <Activity className="h-7 w-7 text-primary mb-2" />
                    <p className="text-xl font-bold">{currentVitals.bloodPressure}</p>
                    <p className="text-xs text-muted-foreground">mmHg</p>
                  </div>
                  <div className="flex flex-col items-center p-5 rounded-lg bg-muted touch-target min-h-[120px] justify-center">
                    <Thermometer className="h-7 w-7 text-warning mb-2" />
                    <p className="text-2xl font-bold">{currentVitals.temperature}</p>
                    <p className="text-xs text-muted-foreground">°F</p>
                  </div>
                  <div className="flex flex-col items-center p-5 rounded-lg bg-muted touch-target min-h-[120px] justify-center">
                    <Droplet className="h-7 w-7 text-secondary mb-2" />
                    <p className="text-2xl font-bold">{currentVitals.oxygen}</p>
                    <p className="text-xs text-muted-foreground">%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            </Suspense>

            <Suspense fallback={<SkeletonCard />}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Connected Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 p-4 rounded-lg border border-border touch-target">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${deviceConnected ? 'bg-success' : 'bg-muted-foreground'}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {deviceConnected ? 'Google Fit Connected' : 'No devices connected'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {deviceConnected && lastSync 
                          ? `Synced: ${lastSync.toLocaleTimeString()}`
                          : 'Connect to start monitoring'
                        }
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="default"
                    variant={deviceConnected ? "destructive" : "outline"}
                    onClick={handleConnectDevice}
                    className="w-full touch-target"
                  >
                    {deviceConnected ? 'Disconnect Device' : 'Connect Device'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            </Suspense>

            <AIInsights insights={aiInsights} />
          </TabsContent>

          <TabsContent value="actions" className="space-y-4 mt-0">
            <ReportUpload />
            <ConsultationRequest />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="font-medium break-all">{profile?.email}</p>
                </div>
                {profile?.phone && (
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                )}
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground mb-2">Monitoring Mode</p>
                  <Badge variant="secondary">AI Assistant Only</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
