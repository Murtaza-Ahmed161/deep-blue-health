import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Settings, User, Menu, Info, HelpCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AIInsights from "@/components/dashboard/AIInsights";
import ReportUpload from "@/components/patient/ReportUpload";
import ConsultationRequest from "@/components/patient/ConsultationRequest";
import VitalsInputSection from "@/components/patient/VitalsInputSection";
import VitalsHistory from "@/components/patient/VitalsHistory";
import MedicationReminders from "@/components/patient/MedicationReminders";
import DailyReportCard from "@/components/patient/DailyReportCard";
import DailyTaskManager from "@/components/patient/DailyTaskManager";
import MemoryJournal from "@/components/patient/MemoryJournal";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import { SkeletonVitalsCard, SkeletonCard } from "@/components/ui/skeleton-card";
import OfflineIndicator from "@/components/OfflineIndicator";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useRetryLogic } from "@/hooks/useRetryLogic";
import { useUptimeMonitoring } from "@/hooks/useUptimeMonitoring";
import { useNotifications } from "@/hooks/useNotifications";
import { useVitals } from "@/hooks/useVitals";
import EmergencyButton from "@/components/emergency/EmergencyButton";
import EmergencyButtonCompact from "@/components/emergency/EmergencyButtonCompact";
import DemoModeControl from "@/components/patient/DemoModeControl";
import CoreSystemTest from "@/components/debug/CoreSystemTest";
import { useDemoMode } from "@/hooks/useDemoMode";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, role, loading: authLoading } = useAuth();
  const [profileError, setProfileError] = useState<string | null>(null);

  // CRITICAL: Guard clause - block access without valid profile
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      if (!profile) {
        setProfileError('User profile missing — DB sync failed. Please contact support.');
        console.error('CRITICAL: Patient dashboard accessed without profile', { userId: user.id });
        return;
      }
      if (role !== 'patient') {
        console.error('CRITICAL: Non-patient accessed patient dashboard', { userId: user.id, role });
        navigate('/');
        return;
      }
      setProfileError(null);
    }
  }, [user, profile, role, authLoading, navigate]);
  
  // Unified vitals management
  const {
    currentVitals,
    saving,
    saveVitals,
    connectionStatus,
    connectedDevice,
    connectDevice,
    disconnectDevice,
  } = useVitals();

  // Demo Mode
  const demoMode = useDemoMode({
    updateInterval: 10000, // 10 seconds
    scenario: 'mixed'
  });

  // Auto-save vitals when demo mode updates
  useEffect(() => {
    if (demoMode.isActive && demoMode.updateCount > 0) {
      const vitals = {
        heartRate: demoMode.currentVitals.heartRate,
        bloodPressureSystolic: demoMode.currentVitals.bloodPressureSystolic,
        bloodPressureDiastolic: demoMode.currentVitals.bloodPressureDiastolic,
        oxygenSaturation: demoMode.currentVitals.oxygenSaturation,
        temperature: demoMode.currentVitals.temperature,
        respiratoryRate: demoMode.currentVitals.respiratoryRate
      };
      
      console.log('🎬 Demo Mode: Auto-saving vitals...', vitals);
      saveVitals(vitals, 'wearable'); // Mark as wearable to differentiate from manual
    }
  }, [demoMode.updateCount, demoMode.isActive]);

  // Reliability features
  const { isOnline } = useOnlineStatus();
  const { processOfflineQueue } = useRetryLogic();
  const { sendNotification } = useNotifications();
  
  // Track user session
  useSessionTracking();
  
  // Monitor uptime
  useUptimeMonitoring();

  // Process offline queue when connection restored
  useEffect(() => {
    if (isOnline) {
      processOfflineQueue();
    }
  }, [isOnline, processOfflineQueue]);

  // Send notification for critical vitals
  useEffect(() => {
    if (currentVitals) {
      const hr = currentVitals.heartRate || 0;
      const o2 = currentVitals.oxygenSaturation || 100;
      if (hr > 100 || o2 < 95) {
        sendNotification('Health Alert', {
          body: `Heart rate: ${hr} bpm, Oxygen: ${o2}%`,
          tag: 'vitals-warning',
        });
      }
    }
  }, [currentVitals, sendNotification]);

  // Fetch real AI insights from database
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchAIInsights = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('ai_screening_results')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (data) {
          const insights = data.map(result => ({
            id: result.id,
            type: result.severity === 'critical' ? 'anomaly' as const : result.severity === 'warning' ? 'trend' as const : 'normal' as const,
            message: result.explanation,
            severity: result.severity === 'critical' ? 'critical' as const : result.severity === 'warning' ? 'warning' as const : 'info' as const,
            timestamp: new Date(result.created_at).toLocaleString(),
          }));
          setAiInsights(insights);
        }
      } catch (error) {
        console.error('Error fetching AI insights:', error);
      }
    };
    
    fetchAIInsights();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleSaveManualVitals = async (vitals: Parameters<typeof saveVitals>[0]) => {
    return await saveVitals(vitals, 'manual');
  };

  // Show error state if profile is missing
  if (profileError) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Profile Missing</CardTitle>
            <CardDescription>{profileError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6 animate-fade-in">
            <div className="h-32 bg-muted-foreground/10 rounded-lg skeleton-shimmer" />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="h-64 bg-muted-foreground/10 rounded-lg skeleton-shimmer" />
              <div className="h-64 bg-muted-foreground/10 rounded-lg skeleton-shimmer" />
            </div>
            <div className="h-96 bg-muted-foreground/10 rounded-lg skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  // Final guard - should never reach here without profile, but double-check
  if (!profile || role !== 'patient') {
    return null;
  }

  return (
    <>
      <OfflineIndicator />
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
                <EmergencyButtonCompact variant="navbar" />
                <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                  <Settings className="h-5 w-5" />
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
                    {/* Emergency Button - Most Important */}
                    <EmergencyButtonCompact variant="full" />
                    <div className="flex justify-end mb-2">
                      <ThemeToggle />
                    </div>
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
            {/* Welcome Card */}
            <WelcomeCard 
              latestVitals={currentVitals}
            />

            {/* Demo Mode Control */}
            <DemoModeControl
              isActive={demoMode.isActive}
              updateCount={demoMode.updateCount}
              scenario={demoMode.scenario}
              onToggle={demoMode.toggleDemo}
            />

            <Suspense fallback={<SkeletonVitalsCard />}>
              <VitalsInputSection
                currentVitals={currentVitals}
                saving={saving}
                onSaveManualVitals={handleSaveManualVitals}
                connectionStatus={connectionStatus}
                connectedDevice={connectedDevice}
                onConnectDevice={connectDevice}
                onDisconnectDevice={disconnectDevice}
              />
            </Suspense>

            <Suspense fallback={<SkeletonCard />}>
              <AIInsights insights={aiInsights} />
            </Suspense>

            {/* Vitals History */}
            <Suspense fallback={<SkeletonCard />}>
              <VitalsHistory />
            </Suspense>

            {/* Medication Reminders */}
            <Suspense fallback={<SkeletonCard />}>
              <MedicationReminders />
            </Suspense>

            {/* Daily Task Manager */}
            <Suspense fallback={<SkeletonCard />}>
              <DailyTaskManager />
            </Suspense>

            {/* Memory Journal */}
            <Suspense fallback={<SkeletonCard />}>
              <MemoryJournal />
            </Suspense>

            <Suspense fallback={<SkeletonCard />}>
              <DailyReportCard />
            </Suspense>

            <div className="grid lg:grid-cols-2 gap-6">
              <ReportUpload />
              <ConsultationRequest />
            </div>

            {/* Core System Test - Hidden (only shows with ?debug=true in URL) */}
            {process.env.NODE_ENV === 'development' && new URLSearchParams(window.location.search).get('debug') === 'true' && <CoreSystemTest />}

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Summary
                </CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="font-medium">{profile?.email}</p>
                </div>
                {profile?.phone ? (
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-muted/50 border border-dashed">
                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-primary"
                      onClick={() => navigate('/settings')}
                    >
                      Add phone number →
                    </Button>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground mb-2">Monitoring Mode</p>
                  <Badge variant={connectedDevice ? "default" : "secondary"}>
                    {connectedDevice ? 'Wearable Connected' : 'AI Assistant Only'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Tabbed View */}
          <Tabs defaultValue="vitals" className="md:hidden">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="demo" className="text-xs">Demo</TabsTrigger>
              <TabsTrigger value="vitals" className="text-xs">Vitals</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
              <TabsTrigger value="emergency" className="text-xs">SOS</TabsTrigger>
              <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="demo" className="space-y-4 mt-0">
              <DemoModeControl
                isActive={demoMode.isActive}
                updateCount={demoMode.updateCount}
                scenario={demoMode.scenario}
                onToggle={demoMode.toggleDemo}
              />
            </TabsContent>

            <TabsContent value="vitals" className="space-y-4 mt-0">
              {/* Welcome Card - Mobile */}
              <WelcomeCard 
                latestVitals={currentVitals}
              />

              <Suspense fallback={<SkeletonVitalsCard />}>
                <VitalsInputSection
                  currentVitals={currentVitals}
                  saving={saving}
                  onSaveManualVitals={handleSaveManualVitals}
                  connectionStatus={connectionStatus}
                  connectedDevice={connectedDevice}
                  onConnectDevice={connectDevice}
                  onDisconnectDevice={disconnectDevice}
                />
              </Suspense>

              <AIInsights insights={aiInsights} />
            </TabsContent>

            <TabsContent value="actions" className="space-y-4 mt-0">
              <DailyTaskManager />
              <MemoryJournal />
              <DailyReportCard />
              <ReportUpload />
              <ConsultationRequest />
            </TabsContent>

            <TabsContent value="emergency" className="space-y-4 mt-0">
              <Card className="border-muted bg-muted/50">
                <CardHeader>
                  <CardTitle>Emergency Button</CardTitle>
                  <CardDescription>
                    The emergency button is now in the top menu for quick access. Tap the menu icon to find it.
                  </CardDescription>
                </CardHeader>
              </Card>
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
                    <Badge variant={connectedDevice ? "default" : "secondary"}>
                      {connectedDevice ? 'Wearable Connected' : 'AI Assistant Only'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default PatientDashboard;
