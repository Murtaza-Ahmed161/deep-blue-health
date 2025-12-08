import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ExternalLink } from "lucide-react";

interface Feedback {
  id: string;
  type: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
}

interface RecentFeedbackListProps {
  feedback: Feedback[];
  onViewAll?: () => void;
}

const RecentFeedbackList = ({ feedback, onViewAll }: RecentFeedbackListProps) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-success text-success-foreground">{status}</Badge>;
      case "in_progress":
        return <Badge className="bg-warning text-warning-foreground">in progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>Latest bug reports and feature requests</CardDescription>
        </div>
        {onViewAll && (
          <Button variant="outline" size="sm" onClick={onViewAll}>
            View All <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {feedback.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No feedback submitted yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-border bg-background hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline">{item.type}</Badge>
                      {getPriorityBadge(item.priority)}
                      {getStatusBadge(item.status)}
                    </div>
                    <h4 className="font-medium mb-1 truncate">{item.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>By: {item.profiles?.full_name || "Unknown"}</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentFeedbackList;
