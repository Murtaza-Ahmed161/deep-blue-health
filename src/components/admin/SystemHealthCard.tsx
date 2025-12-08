import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthMetric {
  name: string;
  status: "healthy" | "warning" | "critical";
  value: number;
  description: string;
}

interface SystemHealthCardProps {
  metrics: HealthMetric[];
}

const SystemHealthCard = ({ metrics }: SystemHealthCardProps) => {
  const getStatusIcon = (status: HealthMetric["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case "critical":
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getProgressColor = (status: HealthMetric["status"]) => {
    switch (status) {
      case "healthy":
        return "bg-success";
      case "warning":
        return "bg-warning";
      case "critical":
        return "bg-destructive";
    }
  };

  const overallHealth = metrics.every(m => m.status === "healthy")
    ? "All Systems Operational"
    : metrics.some(m => m.status === "critical")
    ? "System Issues Detected"
    : "Minor Issues";

  const overallStatus = metrics.every(m => m.status === "healthy")
    ? "healthy"
    : metrics.some(m => m.status === "critical")
    ? "critical"
    : "warning";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Real-time system status monitoring</CardDescription>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
            overallStatus === "healthy" && "bg-success/10 text-success",
            overallStatus === "warning" && "bg-warning/10 text-warning",
            overallStatus === "critical" && "bg-destructive/10 text-destructive"
          )}>
            {getStatusIcon(overallStatus)}
            {overallHealth}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(metric.status)}
                <span className="font-medium">{metric.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">{metric.value}%</span>
            </div>
            <Progress 
              value={metric.value} 
              className="h-2"
              indicatorClassName={getProgressColor(metric.status)}
            />
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default SystemHealthCard;
