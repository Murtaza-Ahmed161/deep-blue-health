import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Activity, Bell, LogOut, Users, TrendingUp, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PatientCard from "@/components/dashboard/PatientCard";
import VitalsChart from "@/components/dashboard/VitalsChart";

const DoctorDashboard = () => {
  const navigate = useNavigate();

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

  const alerts = [
    {
      id: 1,
      patient: "Maria Garcia",
      message: "Elevated heart rate detected",
      severity: "critical" as const,
      time: "2 min ago"
    },
    {
      id: 2,
      patient: "Robert Chen",
      message: "Blood pressure above normal range",
      severity: "warning" as const,
      time: "15 min ago"
    },
  ];

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
                {alerts.map((alert) => (
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
                {patients.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
    </div>
  );
};

export default DoctorDashboard;
