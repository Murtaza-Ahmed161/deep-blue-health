import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface AIInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'normal';
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
}

interface AIInsightsProps {
  insights: AIInsight[];
}

const AIInsights = ({ insights }: AIInsightsProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'trend':
        return <TrendingUp className="h-4 w-4 text-warning" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'success';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-accent" />
          AI Health Insights
        </CardTitle>
        <CardDescription>Real-time pattern analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All vitals within normal range</p>
          </div>
        ) : (
          insights.map((insight) => (
            <div
              key={insight.id}
              className="p-3 rounded-lg border border-border bg-background space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  {getIcon(insight.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{insight.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{insight.timestamp}</p>
                  </div>
                </div>
                <Badge variant={getSeverityVariant(insight.severity)} className="text-xs">
                  {insight.severity}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsights;
