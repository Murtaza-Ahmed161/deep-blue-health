import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Shield,
  Bell,
  Activity,
  FileText,
  Users,
  CheckCircle2,
} from "lucide-react";

const CURRENT_VERSION = "1.0.0-beta";
const STORAGE_KEY = "neuraltrace_last_seen_version";

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  tag?: "new" | "improved" | "security";
}

const features: Feature[] = [
  {
    icon: Shield,
    title: "Two-Factor Authentication",
    description: "Enhanced security with TOTP authenticator app support for doctors and admins.",
    tag: "security",
  },
  {
    icon: Activity,
    title: "Real-Time Vitals Streaming",
    description: "Live heart rate, blood pressure, and SpO₂ monitoring with instant updates.",
    tag: "new",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Customizable push notifications for critical alerts and doctor messages.",
    tag: "improved",
  },
  {
    icon: FileText,
    title: "AI Report Analysis",
    description: "Upload medical reports and get AI-powered summaries and insights.",
    tag: "new",
  },
  {
    icon: Users,
    title: "Beta Invite System",
    description: "Invite colleagues with secure beta access codes.",
    tag: "new",
  },
];

const tagColors = {
  new: "bg-success/10 text-success border-success/20",
  improved: "bg-secondary/10 text-secondary border-secondary/20",
  security: "bg-primary/10 text-primary border-primary/20",
};

const WhatsNewDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem(STORAGE_KEY);
    if (lastSeenVersion !== CURRENT_VERSION) {
      // Delay to show after splash screen
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="outline" className="text-xs">
              v{CURRENT_VERSION}
            </Badge>
          </div>
          <DialogTitle className="text-2xl">What's New in NeuralTrace</DialogTitle>
          <DialogDescription>
            Check out the latest features and improvements in this release.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2" />

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="shrink-0 p-2 rounded-lg bg-background border border-border">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-foreground">{feature.title}</h4>
                  {feature.tag && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${tagColors[feature.tag]}`}
                    >
                      {feature.tag.toUpperCase()}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-2" />

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>All systems operational</span>
          </div>
          <Button onClick={handleClose}>Got it!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsNewDialog;
