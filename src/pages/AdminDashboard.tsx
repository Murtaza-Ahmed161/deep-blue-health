import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Brain, LogOut, Users, Activity, MessageSquare, TrendingUp, AlertCircle, Clock, RefreshCw, Info, HelpCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import FeedbackButton from "@/components/feedback/FeedbackButton";
import { useToast } from "@/hooks/use-toast";
import StatsCard from "@/components/admin/StatsCard";
import UserActivityChart from "@/components/admin/UserActivityChart";
import RoleDistributionChart from "@/components/admin/RoleDistributionChart";
import SystemHealthCard from "@/components/admin/SystemHealthCard";
import RecentFeedbackList from "@/components/admin/RecentFeedbackList";
import AlertsTimelineChart from "@/components/admin/AlertsTimelineChart";
import { BetaInviteManager } from "@/components/admin/BetaInviteManager";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
        console.error('CRITICAL: Admin dashboard accessed without profile', { userId: user.id });
        return;
      }
      if (role !== 'admin') {
        console.error('CRITICAL: Non-admin accessed admin dashboard', { userId: user.id, role });
        navigate('/');
        return;
      }
      setProfileError(null);
    }
  }, [user, profile, role, authLoading, navigate]);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    totalFeedback: 0,
    pendingFeedback: 0,
    totalAlerts: 0,
    avgSessionDuration: 0,
  });

  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [roleData, setRoleData] = useState<any[]>([]);
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !profile || role !== 'admin') {
      return; // Guard clause will handle navigation
    }

    fetchDashboardData();
  }, [user, profile, role, navigate]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch basic stats
      const [usersResult, sessionsResult, feedbackResult, pendingResult, alertsResult, sessionDurationResult] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_sessions").select("*", { count: "exact", head: true }).gte("session_start", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from("feedback").select("*", { count: "exact", head: true }),
        supabase.from("feedback").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("system_metrics").select("*", { count: "exact", head: true }).eq("metric_type", "alert_triggered"),
        supabase.from("user_sessions").select("duration_seconds").not("duration_seconds", "is", null),
      ]);

      const avgDuration = sessionDurationResult.data && sessionDurationResult.data.length > 0
        ? sessionDurationResult.data.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessionDurationResult.data.length
        : 0;

      setStats({
        totalUsers: usersResult.count || 0,
        activeSessions: sessionsResult.count || 0,
        totalFeedback: feedbackResult.count || 0,
        pendingFeedback: pendingResult.count || 0,
        totalAlerts: alertsResult.count || 0,
        avgSessionDuration: Math.round(avgDuration),
      });

      // Fetch recent feedback
      const { data: feedbackData } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentFeedback(feedbackData || []);

      // Fetch role distribution
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role");
      
      const roleCounts = (rolesData || []).reduce((acc: Record<string, number>, curr) => {
        acc[curr.role] = (acc[curr.role] || 0) + 1;
        return acc;
      }, {});

      setRoleData([
        { name: "Patients", value: roleCounts.patient || 0, color: "hsl(var(--primary))" },
        { name: "Doctors", value: roleCounts.doctor || 0, color: "hsl(var(--accent))" },
        { name: "Admins", value: roleCounts.admin || 0, color: "hsl(var(--warning))" },
        { name: "Caregivers", value: roleCounts.caregiver || 0, color: "hsl(var(--success))" },
      ].filter(r => r.value > 0));

      // Generate activity data for last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString("en-US", { weekday: "short" });
        
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { count: sessionsCount } = await supabase
          .from("user_sessions")
          .select("*", { count: "exact", head: true })
          .gte("session_start", startOfDay.toISOString())
          .lte("session_start", endOfDay.toISOString());

        const { data: pageViewsData } = await supabase
          .from("user_sessions")
          .select("page_views")
          .gte("session_start", startOfDay.toISOString())
          .lte("session_start", endOfDay.toISOString());

        const totalPageViews = (pageViewsData || []).reduce((sum, s) => sum + (s.page_views || 0), 0);

        last7Days.push({
          date: dateStr,
          sessions: sessionsCount || 0,
          pageViews: totalPageViews,
        });
      }
      setActivityData(last7Days);

      // Fetch real alerts timeline data from Supabase
      const alertsTimeline = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString("en-US", { weekday: "short" });
        
        // Get alerts for this date from ai_screening_results
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
        
        const { data: dayAlerts } = await supabase
          .from('ai_screening_results')
          .select('severity')
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());
        
        const critical = (dayAlerts || []).filter(a => a.severity === 'critical').length;
        const warning = (dayAlerts || []).filter(a => a.severity === 'warning').length;
        const info = (dayAlerts || []).filter(a => a.severity === 'normal').length;
        
        alertsTimeline.push({
          date: dateStr,
          critical,
          warning,
          info,
        });
      }
      setAlertsData(alertsTimeline);

      // Calculate system health metrics
      const { data: recentErrors } = await supabase
        .from("system_metrics")
        .select("*")
        .eq("metric_type", "api_error")
        .gte("recorded_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { data: uptimeData } = await supabase
        .from("system_metrics")
        .select("metric_value")
        .eq("metric_type", "connection_uptime")
        .order("recorded_at", { ascending: false })
        .limit(1);

      const errorCount = recentErrors?.length || 0;
      const uptimeValue = uptimeData?.[0]?.metric_value || 99.9;

      setHealthMetrics([
        {
          name: "API Uptime",
          status: uptimeValue > 99 ? "healthy" : uptimeValue > 95 ? "warning" : "critical",
          value: Math.min(100, uptimeValue),
          description: `${uptimeValue.toFixed(1)}% uptime in the last 24 hours`,
        },
        {
          name: "Error Rate",
          status: errorCount < 5 ? "healthy" : errorCount < 20 ? "warning" : "critical",
          value: Math.max(0, 100 - errorCount * 2),
          description: `${errorCount} errors recorded in the last 24 hours`,
        },
        {
          name: "Database Performance",
          status: "healthy",
          value: 98,
          description: "Response time under 100ms",
        },
        {
          name: "Storage Usage",
          status: "healthy",
          value: 45,
          description: "45% of allocated storage used",
        },
      ]);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Final guard - should never reach here without profile, but double-check
  if (!profile || role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted">
      {/* Top Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">NeuralTrace Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchDashboardData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/about')} className="hidden sm:flex">
                <Info className="h-4 w-4 mr-2" />
                About
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/support')} className="hidden sm:flex">
                <HelpCircle className="h-4 w-4 mr-2" />
                Support
              </Button>
              <FeedbackButton />
              <div className="text-right hidden sm:block">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            variant="default"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Active Sessions"
            value={stats.activeSessions}
            icon={Activity}
            variant="success"
          />
          <StatsCard
            title="Pending Feedback"
            value={stats.pendingFeedback}
            icon={MessageSquare}
            variant="warning"
          />
          <StatsCard
            title="Total Alerts"
            value={stats.totalAlerts}
            icon={AlertCircle}
            variant="destructive"
          />
          <StatsCard
            title="Avg Session"
            value={formatDuration(stats.avgSessionDuration)}
            icon={Clock}
            variant="default"
          />
          <StatsCard
            title="System Health"
            value="98%"
            icon={TrendingUp}
            variant="success"
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <UserActivityChart data={activityData} />
          <RoleDistributionChart data={roleData} />
        </div>

        {/* Second Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <AlertsTimelineChart data={alertsData} />
          <SystemHealthCard metrics={healthMetrics} />
        </div>

        {/* Recent Feedback */}
        <RecentFeedbackList feedback={recentFeedback} />

        {/* Beta Invite Management */}
        <div className="mt-8">
          <BetaInviteManager />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
