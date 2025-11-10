import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Activity, Bell, LogOut, Users, TrendingUp, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PatientCard from "@/components/dashboard/PatientCard";
import VitalsChart from "@/components/dashboard/VitalsChart";
import AIInsights from "@/components/dashboard/AIInsights";
import EmergencyAlert from "@/components/dashboard/EmergencyAlert";
import { useVitalsStream } from "@/hooks/useVitalsStream";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [emergencyAlert, setEmergencyAlert] = useState<{ patient: string; message: string } | null>(null);

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

  // Generate AI insights based on vitals
  const aiInsights = Array.from(vitalsData.values()).flatMap((patientVitals) => {
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
  }).slice(0, 5);

  // Trigger emergency alert for critical conditions
  useEffect(() => {
    const criticalAlerts = streamAlerts.filter(a => a.severity === 'critical');
    if (criticalAlerts.length > 0 && !emergencyAlert) {
      setEmergencyAlert({
        patient: criticalAlerts[0].patient,
        message: criticalAlerts[0].message,
      });
    }
  }, [streamAlerts]);

  // Update patient vitals with real-time data
  const updatedPatients = patients.map(patient => {
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
  });

  return (
    <div className="min-h-screen bg-muted">
      {/* Top Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">NeuralTrace</span>
            </div>
            <div className="flex items-center gap-4">
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
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                  <p className="text-3xl font-bold text-foreground">24</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Monitors</p>
                  <p className="text-3xl font-bold text-foreground">18</p>
                </div>
                <Activity className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alerts Today</p>
                  <p className="text-3xl font-bold text-foreground">7</p>
                </div>
                <AlertCircle className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="text-3xl font-bold text-foreground">1.2m</p>
                </div>
                <TrendingUp className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
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
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Review
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
            {/* AI Insights */}
            <AIInsights insights={aiInsights} />
            
            {/* Vitals Chart */}
            <VitalsChart />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Add New Patient
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Activity className="mr-2 h-4 w-4" />
                  View All Reports
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Bell className="mr-2 h-4 w-4" />
                  Configure Alerts
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Emergency Alert Modal */}
      <EmergencyAlert
        open={!!emergencyAlert}
        onClose={() => setEmergencyAlert(null)}
        patient={emergencyAlert?.patient || ""}
        message={emergencyAlert?.message || ""}
      />
    </div>
  );
};

export default DoctorDashboard;
