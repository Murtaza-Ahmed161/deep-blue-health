import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bug, Lightbulb, Settings, MessageSquare } from "lucide-react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeedbackDialog = ({ open, onOpenChange }: FeedbackDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "bug",
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      };

      const { error } = await supabase.from("feedback").insert({
        user_id: user.id,
        type: formData.type,
        title: formData.title,
        description: formData.description,
        page_url: window.location.href,
        device_info: deviceInfo,
      });

      if (error) throw error;

      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping us improve NeuralTrace!",
      });

      setFormData({ type: "bug", title: "", description: "" });
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Submission Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <Bug className="h-4 w-4" />;
      case "feature":
        return <Lightbulb className="h-4 w-4" />;
      case "improvement":
        return <Settings className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve NeuralTrace by reporting bugs or suggesting features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Feedback Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  {getTypeIcon(formData.type)}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Bug Report
                  </div>
                </SelectItem>
                <SelectItem value="feature">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Feature Request
                  </div>
                </SelectItem>
                <SelectItem value="improvement">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Improvement
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Other
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Brief description"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide details about your feedback..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={6}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;