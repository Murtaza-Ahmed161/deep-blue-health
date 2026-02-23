import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Activity, Thermometer, Droplet, CheckCircle, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DoctorNotesSection from "@/components/doctor/DoctorNotesSection";
import DailyReportCard from "@/components/patient/DailyReportCard";

interface PatientProfile {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
}

interface VitalReading {
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  temperature: number | null;
  oxygen_saturation: number | null;
  created_at: string;
}

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [reviewStatus, setReviewStatus] = useState<"pending" | "reviewed" | "followup">("pending");
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [vitalsData, setVitalsData] = useState<VitalReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"normal" | "warning" | "critical">("normal");
  
  const isDoctor = role === 'doctor';

  // Fetch real patient data from Supabase
  useEffect(() => {
    if (!id) {
      navigate("/dashboard");
      return;
    }

    const fetchPatientData = async () => {
      try {
        setLoading(true);

        // Fetch patient profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email, created_at')
          .eq('id', id)
          .single();

        if (profileError || !profile) {
          toast({
            title: "Patient not found",
            description: "This patient does not exist in the database.",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }

        setPatient(profile);

        // Fetch last 24 hours of vitals
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: vitals, error: vitalsError } = await supabase
          .from('vitals')
          .select('*')
          .eq('user_id', id)
          .gte('created_at', twentyFourHoursAgo)
          .order('created_at', { ascending: true });

        if (vitalsError) {
          console.error('Error fetching vitals:', vitalsError);
        } else {
          setVitalsData(vitals || []);
        }

        // Fetch latest AI screening result for status
        const { data: latestScreening } = await supabase
          .from('ai_screening_results')
          .select('severity')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestScreening?.severity) {
          setStatus(latestScreening.severity as 'normal' | 'warning' | 'critical');
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
        toast({
          title: "Error",
          description: "Failed to load patient data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id, navigate, toast]);

  // Get current vitals from latest reading
  const latestVital = vitalsData.length > 0 ? vitalsData[vitalsData.length - 1] : null;
  const currentVitals = latestVital ? {
    heartRate: latestVital.heart_rate,
    bloodPressure: latestVital.blood_pressure_systolic && latestVital.blood_pressure_diastolic
      ? `${latestVital.blood_pressure_systolic}/${latestVital.blood_pressure_diastolic}`
      : 'N/A',
    temperature: latestVital.temperature ? latestVital.temperature.toFixed(1) : 'N/A',
    oxygen: latestVital.oxygen_saturation,
  } : {
    heartRate: null,
    bloodPressure: 'N/A',
    temperature: 'N/A',
    oxygen: null,
  };

  // Format vitals for chart (last 24 hours, grouped by hour)
  const chartData = vitalsData.length > 0
    ? vitalsData.map(v => ({
        hour: new Date(v.created_at).toLocaleTimeString('en-US', { hour: 'numeric' }),
        heartRate: v.heart_rate,
        bp: v.blood_pressure_systolic,
        temp: v.temperature,
        oxygen: v.oxygen_saturation,
      }))
    : [];

  // Calculate approximate age from created_at
  const age = patient?.created_at
    ? Math.floor((Date.now() - new Date(patient.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null;

  const handleUpdateStatus = (status: typeof reviewStatus) => {
    setReviewStatus(status);
    toast({
      title: "Status updated",
      description: `Patient marked as ${status === "reviewed" ? "reviewed" : "needs follow-up"}.`,
    });
  };

  const statusColors = {
    normal: "success",
    warning: "default",
    critical: "destructive",
  } as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Patient Not Found</CardTitle>
            <CardDescription>This patient does not exist in the database.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{patient.full_name || 'Unknown Patient'}</h1>
              <p className="text-muted-foreground">
                {age ? `${age} years` : 'Age not available'} • {patient.email}
              </p>
            </div>
            <Badge variant={statusColors[status]}>
              {status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Vitals */}
            <Card>
              <CardHeader>
                <CardTitle>Current Vitals</CardTitle>
                <CardDescription>Real-time measurements</CardDescription>
              </CardHeader>
              <CardContent>
                {vitalsData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No vitals data available</p>
                    <p className="text-xs mt-1">Vitals will appear here once recorded</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col items-center p-4 rounded-lg bg-muted">
                      <Heart className="h-8 w-8 text-destructive mb-2" />
                      <p className="text-2xl font-bold">{currentVitals.heartRate ?? 'N/A'}</p>
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
                      <p className="text-2xl font-bold">{currentVitals.oxygen ?? 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">%</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 24h Trends */}
            <Card>
              <CardHeader>
                <CardTitle>24-Hour Vitals Trend</CardTitle>
                <CardDescription>Continuous monitoring data</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No 24-hour trend data available</p>
                    <p className="text-xs mt-1">Chart will display once vitals are recorded</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        stroke="hsl(var(--border))"
                      />
                      <YAxis
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                        stroke="hsl(var(--border))"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="heartRate"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={2}
                        name="Heart Rate"
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="bp"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Blood Pressure"
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="oxygen"
                        stroke="hsl(var(--secondary))"
                        strokeWidth={2}
                        name="SpO2"
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Doctor Notes Section */}
            {id && <DoctorNotesSection patientId={id} isDoctor={isDoctor} />}

            {/* Daily report (doctor: generate for this patient) */}
            {id && isDoctor && (
              <DailyReportCard patientId={id} compact />
            )}

            {/* Review Status */}
            <Card>
              <CardHeader>
                <CardTitle>Review Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={reviewStatus === "reviewed" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => handleUpdateStatus("reviewed")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Reviewed
                </Button>
                <Button
                  variant={reviewStatus === "followup" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => handleUpdateStatus("followup")}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Needs Follow-up
                </Button>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
