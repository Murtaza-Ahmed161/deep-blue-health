import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Brain, Activity, Bell, LogOut, Users, TrendingUp, AlertCircle, Menu, Info, HelpCircle, Inbox } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PatientCard from "@/components/dashboard/PatientCard";
import VitalsChart from "@/components/dashboard/VitalsChart";
import AIInsights from "@/components/dashboard/AIInsights";
import EmergencyAlert from "@/components/dashboard/EmergencyAlert";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonCard, SkeletonChart } from "@/components/ui/skeleton-card";
import { useDoctorPatients } from "@/hooks/useDoctorPatients";
import { useDoctorAlerts } from "@/hooks/useDoctorAlerts";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signOut, role, loading: authLoading } = useAuth();
  const [emergencyAlert, setEmergencyAlert] = useState<{ patient: string; message: string } | null>(null);
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
        console.error('CRITICAL: Doctor dashboard accessed without profile', { userId: user.id });
        return;
      }
      if (role !== 'doctor') {
        console.error('CRITICAL: Non-doctor accessed doctor dashboard', { userId: user.id, role });
        navigate('/');
        return;
      }
      setProfileError(null);
    }
  }, [user, profile, role, authLoading, navigate]);
  
  // Fetch real data from database
  const { patients, loading: patientsLoading } = useDoctorPatients();
  const { alerts, loading: alertsLoading, acknowledgeAlert } = useDoctorAlerts();
  
  // Track user session
  useSessionTracking();

  // Clear all state on logout or role change
  useEffect(() => {
    if (!user || role !== 'doctor') {
      setEmergencyAlert(null);
    }
  }, [user, role]);

  // Trigger emergency alert for critical conditions
  useEffect(() => {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
    if (criticalAlerts.length > 0 && !emergencyAlert) {
      setEmergencyAlert({
        patient: criticalAlerts[0].patientName,
        message: criticalAlerts[0].message,
      });
    }
  }, [alerts, emergencyAlert]);

  // Get AI insights from database (ai_screening_results)
  const aiInsights = alerts
    .filter(a => !a.acknowledged)
    .slice(0, 5)
    .map(alert => ({
      id: alert.id,
      type: alert.severity === 'critical' ? 'anomaly' as const : 'trend' as const,
      message: `${alert.patientName}: ${alert.message}`,
      severity: alert.severity,
      timestamp: alert.time,
    }));

  const handleLogout = async () => {
    // Clear all state before logout
    setEmergencyAlert(null);
    await signOut();
    navigate("/");
  };

  const handleAcknowledgeAlert = async (alertId: string, patientName: string) => {
    await acknowledgeAlert(alertId);
    toast({
      title: "Alert Reviewed",
      description: `${patientName}'s alert has been marked as reviewed.`,
    });
  };

  // Calculate stats from real data
  const totalPatients = patients.length;
  const activePatients = patients.filter(p => p.status !== 'normal').length;
  const totalAlerts = alerts.filter(a => !a.acknowledged).length;
  const criticalAlertsCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;

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
  if (authLoading || patientsLoading || alertsLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Final guard - should never reach here without profile, but double-check
  if (!profile || role !== 'doctor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Top Navigation - Responsive */}
      <nav className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-6 md:h-8 w-6 md:w-8 text-primary" />
              <span className="text-lg md:text-2xl font-bold text-primary">NeuralTrace</span>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <ThemeToggle />
              <FeedbackButton />
              <Button variant="ghost" size="sm" onClick={() => navigate('/about')}>
                <Info className="mr-2 h-4 w-4" />
                About
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/support')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Support
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {criticalAlertsCount > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-destructive rounded-full" />
                )}
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.full_name || 'Doctor'}</p>
                <p className="text-xs text-muted-foreground">{profile?.specialty || 'Medical Professional'}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="relative">
                  <Menu className="h-5 w-5" />
                  {criticalAlertsCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div>
                      <p className="font-medium">{profile?.full_name || 'Doctor'}</p>
                      <p className="text-sm text-muted-foreground">{profile?.specialty || 'Medical Professional'}</p>
                    </div>
                    <ThemeToggle />
                  </div>
                  <FeedbackButton variant="outline" size="default" />
                  <Button variant="outline" onClick={() => navigate('/about')} className="w-full justify-start">
                    <Info className="mr-2 h-4 w-4" />
                    About
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/support')} className="w-full justify-start">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start relative">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                    {criticalAlertsCount > 0 && (
                      <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full" />
                    )}
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
      </nav>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Stats Overview - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card className="touch-target">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Patients</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{totalPatients}</p>
                </div>
                <Users className="h-6 md:h-8 w-6 md:w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="touch-target">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{activePatients}</p>
                </div>
                <Activity className="h-6 md:h-8 w-6 md:w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="touch-target">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Alerts</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{totalAlerts}</p>
                </div>
                <AlertCircle className="h-6 md:h-8 w-6 md:w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="touch-target">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Critical</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{criticalAlertsCount}</p>
                </div>
                <TrendingUp className="h-6 md:h-8 w-6 md:w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Active Alerts
                </CardTitle>
                <CardDescription>Patients requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {alerts.filter(a => !a.acknowledged).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No alerts</p>
                    <p className="text-xs mt-1">All patients are stable</p>
                  </div>
                ) : (
                  alerts
                    .filter(a => !a.acknowledged)
                    .slice(0, 5)
                    .map((alert) => (
                      <div 
                        key={alert.id} 
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-background"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{alert.patientName}</p>
                            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAcknowledgeAlert(alert.id, alert.patientName)}
                        >
                          Mark Reviewed
                        </Button>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            {/* Patients List */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Overview</CardTitle>
                <CardDescription>Real-time monitoring status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {patients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No patients assigned</p>
                    <p className="text-xs mt-1">Patients will appear here once assigned to you</p>
                  </div>
                ) : (
                  patients.map((patient) => (
                    <PatientCard 
                      key={patient.id} 
                      patient={{
                        id: Number(patient.id.slice(0, 8).replace(/-/g, ''), 16) % 1000000, // Convert UUID to number for PatientCard
                        name: patient.name,
                        age: patient.age || 0,
                        condition: patient.condition || '',
                        status: patient.status,
                        lastReading: patient.lastReading,
                        vitals: patient.vitals,
                      }}
                      onClick={() => navigate(`/patient/${patient.id}`)}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Suspense fallback={<SkeletonCard />}>
              <AIInsights insights={aiInsights} />
            </Suspense>
            
            <Suspense fallback={<SkeletonChart />}>
              <VitalsChart />
            </Suspense>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => toast({ title: "Feature Coming Soon", description: "Add new patient functionality will be available soon." })}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Add New Patient
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => toast({ title: "Feature Coming Soon", description: "View all reports functionality will be available soon." })}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  View All Reports
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => toast({ title: "Feature Coming Soon", description: "Configure alerts functionality will be available soon." })}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Configure Alerts
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile & Tablet Tabbed Layout */}
        <Tabs defaultValue="patients" className="lg:hidden">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="alerts" className="text-xs">Alerts</TabsTrigger>
            <TabsTrigger value="patients" className="text-xs">Patients</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-3 mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.filter(a => !a.acknowledged).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No alerts</p>
                  </div>
                ) : (
                  alerts
                    .filter(a => !a.acknowledged)
                    .slice(0, 5)
                    .map((alert) => (
                      <div 
                        key={alert.id} 
                        className="p-4 rounded-lg border border-border bg-background touch-target space-y-3"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <p className="font-medium">{alert.patientName}</p>
                            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="default"
                          className="w-full touch-target"
                          onClick={() => handleAcknowledgeAlert(alert.id, alert.patientName)}
                        >
                          Mark Reviewed
                        </Button>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-3 mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Patient Overview</CardTitle>
                <CardDescription className="text-xs">Real-time monitoring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 touch-pan-y overflow-y-auto max-h-[calc(100vh-300px)]">
                {patients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No patients assigned</p>
                  </div>
                ) : (
                  patients.map((patient) => (
                    <div key={patient.id} className="touch-target">
                      <PatientCard 
                        patient={{
                          id: Number(patient.id.slice(0, 8).replace(/-/g, ''), 16) % 1000000,
                          name: patient.name,
                          age: patient.age || 0,
                          condition: patient.condition || '',
                          status: patient.status,
                          lastReading: patient.lastReading,
                          vitals: patient.vitals,
                        }}
                        onClick={() => navigate(`/patient/${patient.id}`)}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-3 mt-0">
            <Suspense fallback={<SkeletonCard />}>
              <AIInsights insights={aiInsights} />
            </Suspense>
            
            <Suspense fallback={<SkeletonChart />}>
              <div className="touch-pan-x overflow-x-auto">
                <VitalsChart />
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="actions" className="space-y-3 mt-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start touch-target" 
                  variant="outline"
                  size="lg"
                  onClick={() => toast({ title: "Feature Coming Soon", description: "Add new patient functionality will be available soon." })}
                >
                  <Users className="mr-2 h-5 w-5" />
                  Add New Patient
                </Button>
                <Button 
                  className="w-full justify-start touch-target" 
                  variant="outline"
                  size="lg"
                  onClick={() => toast({ title: "Feature Coming Soon", description: "View all reports functionality will be available soon." })}
                >
                  <Activity className="mr-2 h-5 w-5" />
                  View All Reports
                </Button>
                <Button 
                  className="w-full justify-start touch-target" 
                  variant="outline"
                  size="lg"
                  onClick={() => toast({ title: "Feature Coming Soon", description: "Configure alerts functionality will be available soon." })}
                >
                  <Bell className="mr-2 h-5 w-5" />
                  Configure Alerts
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Emergency Alert Modal */}
      <EmergencyAlert
        open={!!emergencyAlert}
        onClose={() => {
          const criticalAlert = alerts.find(a => a.severity === 'critical' && a.patientName === emergencyAlert?.patient);
          if (criticalAlert) {
            handleAcknowledgeAlert(criticalAlert.id, criticalAlert.patientName);
          }
          setEmergencyAlert(null);
        }}
        patient={emergencyAlert?.patient || ""}
        message={emergencyAlert?.message || ""}
      />
    </div>
  );
};

export default DoctorDashboard;
