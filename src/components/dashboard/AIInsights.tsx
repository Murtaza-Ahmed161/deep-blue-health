import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AIInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'normal';
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  explanation?: string;
}

interface AIInsightsProps {
  insights: AIInsight[];
}

const AIInsights = ({ insights }: AIInsightsProps) => {
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);

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
                <div className="flex items-center gap-2">
                  <Badge variant={getSeverityVariant(insight.severity)} className="text-xs">
                    {insight.severity}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setSelectedInsight(insight)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Explanation Dialog */}
      <Dialog open={!!selectedInsight} onOpenChange={() => setSelectedInsight(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Insight Explanation</DialogTitle>
            <DialogDescription>
              Detailed analysis from the AI screening engine
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{selectedInsight?.message}</p>
              <p className="text-xs text-muted-foreground">{selectedInsight?.timestamp}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm">
                {selectedInsight?.explanation || 
                  "This AI insight was generated based on pattern analysis of your vital signs. The AI detected a variation from your baseline readings and flagged it for review. For specific medical advice, please consult with your healthcare provider."}
              </p>
            </div>
            <Button onClick={() => setSelectedInsight(null)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AIInsights;
