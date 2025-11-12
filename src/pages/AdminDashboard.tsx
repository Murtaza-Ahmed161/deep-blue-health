import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, LogOut, Users, Activity, MessageSquare, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    totalFeedback: 0,
    pendingFeedback: 0,
    totalAlerts: 0,
    avgSessionDuration: 0,
  });

  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch total users count
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch active sessions (last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const { count: sessionsCount } = await supabase
        .from("user_sessions")
        .select("*", { count: "exact", head: true })
        .gte("session_start", twentyFourHoursAgo.toISOString());

      // Fetch feedback stats
      const { count: feedbackCount } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true });

      const { count: pendingCount } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
        .eq("status", "new");

      // Fetch alert count
      const { count: alertsCount } = await supabase
        .from("system_metrics")
        .select("*", { count: "exact", head: true })
        .eq("metric_type", "alert_triggered");

      // Fetch average session duration
      const { data: sessionData } = await supabase
        .from("user_sessions")
        .select("duration_seconds")
        .not("duration_seconds", "is", null);

      const avgDuration = sessionData && sessionData.length > 0
        ? sessionData.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessionData.length
        : 0;

      // Fetch recent feedback
      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("*, profiles!inner(full_name)")
        .order("created_at", { ascending: false })
        .limit(10);

      setStats({
        totalUsers: usersCount || 0,
        activeSessions: sessionsCount || 0,
        totalFeedback: feedbackCount || 0,
        pendingFeedback: pendingCount || 0,
        totalAlerts: alertsCount || 0,
        avgSessionDuration: Math.round(avgDuration),
      });

      setRecentFeedback(feedbackData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge variant="destructive">{priority}</Badge>;
      case "high":
        return <Badge variant="destructive">{priority}</Badge>;
      case "medium":
        return <Badge variant="default">{priority}</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Top Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">NeuralTrace Admin</span>
            </div>
            <div className="flex items-center gap-2">
              <FeedbackButton />
              <div className="text-right">
                <p className="text-sm font-medium">{profile?.full_name || "Admin"}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Sessions (24h)</p>
                  <p className="text-3xl font-bold text-foreground">{stats.activeSessions}</p>
                </div>
                <Activity className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Feedback</p>
                  <p className="text-3xl font-bold text-foreground">{stats.pendingFeedback}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Alerts</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalAlerts}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Session Duration</p>
                  <p className="text-3xl font-bold text-foreground">
                    {formatDuration(stats.avgSessionDuration)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">System Health</p>
                  <p className="text-3xl font-bold text-success">Healthy</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Latest bug reports and feature requests from users</CardDescription>
          </CardHeader>
          <CardContent>
            {recentFeedback.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No feedback submitted yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentFeedback.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="p-4 rounded-lg border border-border bg-background"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{feedback.type}</Badge>
                          {getPriorityBadge(feedback.priority)}
                          <Badge
                            variant={
                              feedback.status === "resolved" ? "success" : "secondary"
                            }
                          >
                            {feedback.status}
                          </Badge>
                        </div>
                        <h4 className="font-medium mb-1">{feedback.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {feedback.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>By: {feedback.profiles?.full_name || "Unknown"}</span>
                          <span>
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;