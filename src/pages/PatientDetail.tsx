import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Activity, Thermometer, Droplet, Save, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"pending" | "reviewed" | "followup">("pending");

  // Mock patient data - in real app this would come from API
  const patient = {
    id: Number(id),
    name: id === "1" ? "Sarah Johnson" : id === "2" ? "Robert Chen" : "Maria Garcia",
    age: id === "1" ? 68 : id === "2" ? 75 : 62,
    condition: id === "1" ? "Hypertension" : id === "2" ? "Diabetes Type 2" : "Post-Surgery",
    status: id === "1" ? "normal" : id === "2" ? "warning" : "critical",
  };

  // Mock 24h vitals data
  const vitalsData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    heartRate: 72 + Math.sin(i / 3) * 10 + (Math.random() - 0.5) * 5,
    bp: 120 + Math.sin(i / 4) * 8 + (Math.random() - 0.5) * 4,
    temp: 98.6 + (Math.random() - 0.5) * 0.4,
    oxygen: 98 - Math.abs(Math.sin(i / 5)) * 2,
  }));

  const currentVitals = {
    heartRate: Math.round(vitalsData[vitalsData.length - 1].heartRate),
    bloodPressure: `${Math.round(vitalsData[vitalsData.length - 1].bp)}/80`,
    temperature: vitalsData[vitalsData.length - 1].temp.toFixed(1),
    oxygen: Math.round(vitalsData[vitalsData.length - 1].oxygen),
  };

  const handleSaveNotes = () => {
    toast({
      title: "Notes saved",
      description: "Patient notes have been updated successfully.",
    });
  };

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
              <h1 className="text-3xl font-bold">{patient.name}</h1>
              <p className="text-muted-foreground">
                {patient.age} years • {patient.condition}
              </p>
            </div>
            <Badge variant={statusColors[patient.status as keyof typeof statusColors]}>
              {patient.status}
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

            {/* 24h Trends */}
            <Card>
              <CardHeader>
                <CardTitle>24-Hour Vitals Trend</CardTitle>
                <CardDescription>Continuous monitoring data</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={vitalsData}>
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
                    />
                    <Line
                      type="monotone"
                      dataKey="bp"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Blood Pressure"
                    />
                    <Line
                      type="monotone"
                      dataKey="oxygen"
                      stroke="hsl(var(--secondary))"
                      strokeWidth={2}
                      name="SpO2"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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

            {/* Doctor's Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Doctor's Notes</CardTitle>
                <CardDescription>Clinical observations and plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter clinical notes, observations, and treatment plan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={8}
                />
                <Button onClick={handleSaveNotes} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Notes
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
