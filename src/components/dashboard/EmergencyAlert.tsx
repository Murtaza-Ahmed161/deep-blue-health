import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Phone, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EmergencyAlertProps {
  open: boolean;
  onClose: () => void;
  patient: string;
  message: string;
}

const EmergencyAlert = ({ open, onClose, patient, message }: EmergencyAlertProps) => {
  const { toast } = useToast();

  const handleAcknowledge = () => {
    toast({
      title: "Alert Acknowledged",
      description: `Critical alert for ${patient} has been acknowledged.`,
      variant: "default",
    });
    onClose();
  };

  const handleEmergencyCall = () => {
    // ⚠️ SAFETY LOCK: Emergency calling not yet configured
    toast({
      title: "Emergency Calling Not Configured",
      description: "Emergency calling and SMS functionality is not yet implemented. Please contact emergency services directly if needed.",
      variant: "destructive",
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="border-destructive border-2">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive animate-pulse" />
            </div>
            <div>
              <AlertDialogTitle className="text-destructive text-xl">
                Critical Patient Alert
              </AlertDialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Immediate attention required</p>
            </div>
          </div>
          <AlertDialogDescription className="text-base">
            <span className="font-semibold text-foreground">{patient}</span>
            <br />
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {/* Safety Warning Card */}
        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              System Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-xs">
              ⚠️ Emergency calling and SMS functionality is not yet configured.
              This system does not make real emergency calls. If this is a true
              medical emergency, please contact emergency services directly (911).
            </CardDescription>
          </CardContent>
        </Card>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogAction
            onClick={handleEmergencyCall}
            className="bg-warning hover:bg-warning/90 text-warning-foreground"
            disabled
          >
            <Phone className="mr-2 h-4 w-4" />
            Call Emergency (Not Available)
          </AlertDialogAction>
          <AlertDialogAction onClick={handleAcknowledge} className="bg-destructive hover:bg-destructive/90">
            Acknowledged
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EmergencyAlert;
