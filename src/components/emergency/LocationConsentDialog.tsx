import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPin, Shield, AlertTriangle } from "lucide-react";
import { LocationConsentDialogProps } from "@/types/emergency";

const LocationConsentDialog = ({ 
  open, 
  onConsentDecision, 
  patientName 
}: LocationConsentDialogProps) => {
  const handleGrantConsent = () => {
    onConsentDecision(true);
  };

  const handleDenyConsent = () => {
    onConsentDecision(false);
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg">
                Share Location for Emergency?
              </AlertDialogTitle>
              <p className="text-sm text-muted-foreground">
                Help emergency contacts find you
              </p>
            </div>
          </div>
          
          <AlertDialogDescription className="space-y-3">
            <p>
              <strong>{patientName}</strong>, would you like to share your current location 
              with your emergency contact to help them respond to your emergency?
            </p>
            
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-success">Privacy Protected</p>
                  <p className="text-muted-foreground">
                    Location is only shared for this emergency and not stored permanently
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-warning/10 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Important</p>
                  <p className="text-muted-foreground">
                    This does not contact emergency services (911). Your emergency contact 
                    will be notified, but you should call 911 directly for medical emergencies.
                  </p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleDenyConsent} className="w-full sm:w-auto">
            Continue Without Location
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleGrantConsent} 
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            Share Location
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LocationConsentDialog;