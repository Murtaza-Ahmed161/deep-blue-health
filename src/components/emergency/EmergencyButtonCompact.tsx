import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import EmergencyButton from "./EmergencyButton";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EmergencyButtonCompactProps {
  variant?: "navbar" | "full";
}

const EmergencyButtonCompact = ({ variant = "navbar" }: EmergencyButtonCompactProps) => {
  if (variant === "full") {
    return <EmergencyButton />;
  }

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white animate-pulse-subtle btn-press"
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Emergency
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Emergency Alert - Click to notify emergency contact</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center gap-4 py-4">
          <EmergencyButton />
          
          {/* Pakistan Emergency Services */}
          <div className="w-full mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-sm mb-3 text-center">Pakistan Emergency Services</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-background rounded">
                <span className="text-sm">🚑 Ambulance (Edhi)</span>
                <span className="font-mono font-bold">115</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-background rounded">
                <span className="text-sm">🚒 Rescue 1122</span>
                <span className="font-mono font-bold">1122</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-background rounded">
                <span className="text-sm">👮 Police Emergency</span>
                <span className="font-mono font-bold">15</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              For life-threatening emergencies, call these numbers directly
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyButtonCompact;
