import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleAcknowledge} className="bg-destructive hover:bg-destructive/90">
            Acknowledged
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EmergencyAlert;
