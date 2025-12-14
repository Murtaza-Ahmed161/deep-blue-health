import { useState, useEffect, useMemo, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Brain, Activity, Bell, LogOut, Users, TrendingUp, AlertCircle, Menu, Info, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import PatientCard from "@/components/dashboard/PatientCard";
import VitalsChart from "@/components/dashboard/VitalsChart";
import AIInsights from "@/components/dashboard/AIInsights";
import EmergencyAlert from "@/components/dashboard/EmergencyAlert";
import { useVitalsStream } from "@/hooks/useVitalsStream";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import { SkeletonCard, SkeletonChart } from "@/components/ui/skeleton-card";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [emergencyAlert, setEmergencyAlert] = useState<{ patient: string; message: string } | null>(null);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  
  // Track user session
  useSessionTracking();

  const patients = [
    {
      id: 1,
      name: "Sarah Johnson",
      age: 68,
      condition: "Hypertension",
      status: "normal" as const,
      lastReading: "2 hours ago",
      vitals: {
        heartRate: 72,
        bloodPressure: "120/80",
        temperature: 98.6,
        oxygen: 98,
      }
    },
    {
      id: 2,
      name: "Robert Chen",
      age: 75,
      condition: "Diabetes Type 2",
      status: "warning" as const,
      lastReading: "15 min ago",
      vitals: {
        heartRate: 88,
        bloodPressure: "145/92",
        temperature: 99.1,
        oxygen: 96,
      }
    },
    {
      id: 3,
      name: "Maria Garcia",
      age: 62,
      condition: "Post-Surgery",
      status: "critical" as const,
      lastReading: "Just now",
      vitals: {
        heartRate: 105,
        bloodPressure: "160/95",
        temperature: 100.4,
        oxygen: 93,
      }
    },
  ];

  // Real-time vitals streaming
  const { vitalsData, alerts: streamAlerts } = useVitalsStream(patients);

  // Generate AI insights based on vitals - memoized to prevent recalculation
  const aiInsights = useMemo(() => 
    Array.from(vitalsData.values()).flatMap((patientVitals) => {
      const patient = patients.find(p => p.id === patientVitals.patientId);
      if (!patient) return [];

      const latest = patientVitals.readings[patientVitals.readings.length - 1];
      const insights = [];

      if (latest.heartRate > 100) {
        insights.push({
          id: `${patient.id}-hr-trend`,
          type: 'trend' as const,
          message: `${patient.name}: Heart rate elevated (${latest.heartRate} bpm) - possible stress episode`,
          severity: latest.heartRate > 120 ? 'critical' as const : 'warning' as const,
          timestamp: '2 min ago',
        });
      }

      if (latest.bloodPressure.systolic > 140) {
        insights.push({
          id: `${patient.id}-bp-anomaly`,
          type: 'anomaly' as const,
          message: `${patient.name}: Blood pressure spike detected (${latest.bloodPressure.systolic}/${latest.bloodPressure.diastolic})`,
          severity: latest.bloodPressure.systolic > 160 ? 'critical' as const : 'warning' as const,
          timestamp: 'Just now',
        });
      }

      return insights;
    }).slice(0, 5)
  , [vitalsData, patients]);

  // Trigger emergency alert for critical conditions
  useEffect(() => {
    const criticalAlerts = streamAlerts.filter(a => a.severity === 'critical' && !acknowledgedAlerts.has(a.id));
    if (criticalAlerts.length > 0 && !emergencyAlert) {
      setEmergencyAlert({
        patient: criticalAlerts[0].patient,
        message: criticalAlerts[0].message,
      });
    }
  }, [streamAlerts, acknowledgedAlerts, emergencyAlert]);

  // Update patient vitals with real-time data - memoized
  const updatedPatients = useMemo(() =>
    patients.map(patient => {
      const vitals = vitalsData.get(patient.id);
      if (!vitals) return patient;

      const latest = vitals.readings[vitals.readings.length - 1];
      return {
        ...patient,
        status: vitals.status,
        lastReading: 'Just now',
        vitals: {
          heartRate: latest.heartRate,
          bloodPressure: `${latest.bloodPressure.systolic}/${latest.bloodPressure.diastolic}`,
          temperature: latest.temperature,
          oxygen: latest.oxygen,
        },
      };
    })
  , [vitalsData, patients]);

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
                <span className="absolute top-0 right-0 h-2 w-2 bg-destructive rounded-full" />
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium">Dr. John Smith</p>
                <p className="text-xs text-muted-foreground">Cardiology</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="relative">
                  <Menu className="h-5 w-5" />
                  <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="font-medium">Dr. John Smith</p>
                    <p className="text-sm text-muted-foreground">Cardiology</p>
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
                    <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full" />
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/')} className="w-full justify-start">
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
                  <p className="text-2xl md:text-3xl font-bold text-foreground">24</p>
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
                  <p className="text-2xl md:text-3xl font-bold text-foreground">18</p>
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
                  <p className="text-2xl md:text-3xl font-bold text-foreground">7</p>
                </div>
                <AlertCircle className="h-6 md:h-8 w-6 md:w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="touch-target">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Response</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">1.2m</p>
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
                {streamAlerts.slice(0, 5).map((alert) => (
                  <div 
                    key={alert.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-background"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{alert.patient}</p>
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                          {alert.severity}
                        </Badge>
                        {acknowledgedAlerts.has(alert.id) && (
                          <Badge variant="success" className="text-xs">
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setAcknowledgedAlerts(prev => new Set(prev).add(alert.id));
                        toast({
                          title: "Alert Reviewed",
                          description: `${alert.patient}'s alert has been marked as reviewed.`,
                        });
                      }}
                    >
                      Mark Reviewed
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Patients List */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Overview</CardTitle>
                <CardDescription>Real-time monitoring status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {updatedPatients.map((patient) => (
                  <PatientCard 
                    key={patient.id} 
                    patient={patient}
                    onClick={() => navigate(`/patient/${patient.id}`)}
                  />
                ))}
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
                {streamAlerts.slice(0, 5).map((alert) => (
                  <div 
                    key={alert.id} 
                    className="p-4 rounded-lg border border-border bg-background touch-target space-y-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <p className="font-medium">{alert.patient}</p>
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                          {alert.severity}
                        </Badge>
                        {acknowledgedAlerts.has(alert.id) && (
                          <Badge variant="success" className="text-xs">
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="default"
                      className="w-full touch-target"
                      onClick={() => {
                        setAcknowledgedAlerts(prev => new Set(prev).add(alert.id));
                        toast({
                          title: "Alert Reviewed",
                          description: `${alert.patient}'s alert has been marked as reviewed.`,
                        });
                      }}
                    >
                      Mark Reviewed
                    </Button>
                  </div>
                ))}
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
                {updatedPatients.map((patient) => (
                  <div key={patient.id} className="touch-target">
                    <PatientCard 
                      patient={patient}
                      onClick={() => navigate(`/patient/${patient.id}`)}
                    />
                  </div>
                ))}
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
          const criticalAlert = streamAlerts.find(a => a.severity === 'critical' && a.patient === emergencyAlert?.patient);
          if (criticalAlert) {
            setAcknowledgedAlerts(prev => new Set(prev).add(criticalAlert.id));
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
