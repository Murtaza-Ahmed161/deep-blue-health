import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, Clock, CheckCircle, XCircle } from "lucide-react";
import { useEmergencyController } from "@/hooks/useEmergencyController";
import { useLocationConsent } from "@/hooks/useLocationConsent";
import { useNotificationService } from "@/hooks/useNotificationService";
import { useAuth } from "@/hooks/useAuth";
import LocationConsentDialog from "./LocationConsentDialog";
import { EmergencyContact } from "@/types/emergency";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const EmergencyButton = () => {
  const { user, profile } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [emergencyInProgress, setEmergencyInProgress] = useState(false);

  const {
    isProcessing,
    lastResult,
    triggerEmergency,
    updateEmergencyWithLocation,
    resetState
  } = useEmergencyController();
  
  const {
    isRequesting: isRequestingLocation,
    showConsentDialog,
    consentResult,
    handleConsentDialogDecision,
    showLocationConsentDialog,
    resetConsentState
  } = useLocationConsent();

  const {
    isSending,
    lastResult: notificationResult,
    sendEmergencyNotification
  } = useNotificationService();

  // Check if user has emergency contact configured
  const hasEmergencyContact = profile?.emergency_contact_name && 
    (profile?.emergency_contact_phone || profile?.email);

  const handleEmergencyClick = () => {
    if (!hasEmergencyContact) {
      alert("Please set up an emergency contact in your profile settings before using the emergency alert.");
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmEmergency = async () => {
    if (!user) return;
    
    setShowConfirmDialog(false);
    setEmergencyInProgress(true);
    resetState();
    resetConsentState();

    try {
      // Step 1: Create emergency event
      const result = await triggerEmergency(user.id);
      
      if (result.success) {
        // Step 2: Request location consent
        showLocationConsentDialog();
      } else {
        setEmergencyInProgress(false);
        setShowResultDialog(true);
      }
    } catch (error) {
      console.error("Emergency process failed:", error);
      setEmergencyInProgress(false);
      setShowResultDialog(true);
    }
  };

  const handleLocationConsentDecision = async (granted: boolean) => {
    if (!user || !lastResult?.eventId) return;

    try {
      const consentResult = await handleConsentDialogDecision(granted, user.id);
      
      // Update emergency event with location data
      await updateEmergencyWithLocation(lastResult.eventId, consentResult);
      
      // Step 3: Send notification
      if (lastResult && hasEmergencyContact) {
        const emergencyContact: EmergencyContact = {
          name: profile?.emergency_contact_name || "Emergency Contact",
          email: profile?.email || "",
          phone: profile?.emergency_contact_phone || "",
          preferredChannel: "email"
        };

        // Create emergency event object for notification
        const mockEvent = {
          id: lastResult.eventId,
          patient_id: user.id,
          triggered_by: user.id,
          triggered_at: new Date().toISOString(),
          location_lat: consentResult.location?.latitude || null,
          location_lng: consentResult.location?.longitude || null,
          location_consented: consentResult.granted,
          status: 'pending' as const,
          notes: 'Emergency alert triggered by patient',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await sendEmergencyNotification(mockEvent, emergencyContact);
      }
      
      setEmergencyInProgress(false);
      setShowResultDialog(true);
    } catch (error) {
      console.error("Error processing emergency:", error);
      setEmergencyInProgress(false);
      setShowResultDialog(true);
    }
  };

  const getResultMessage = () => {
    if (notificationResult?.success) {
      return {
        type: 'success',
        title: 'Emergency Alert Sent',
        message: `Emergency notification sent successfully to ${profile?.emergency_contact_name || 'your emergency contact'}.`,
        icon: CheckCircle
      };
    } else if (notificationResult?.error) {
      return {
        type: 'error',
        title: 'Emergency Alert Failed',
        message: `Failed to send emergency notification: ${notificationResult.error}. Please contact emergency services directly at 911.`,
        icon: XCircle
      };
    } else if (lastResult?.success) {
      return {
        type: 'partial',
        title: 'Emergency Recorded',
        message: 'Emergency event was recorded but notification may have failed. Please contact emergency services directly at 911 if needed.',
        icon: AlertTriangle
      };
    } else {
      return {
        type: 'error',
        title: 'Emergency System Error',
        message: 'Emergency system encountered an error. Please contact emergency services directly at 911.',
        icon: XCircle
      };
    }
  };

  const isDisabled = isProcessing || isRequestingLocation || isSending || emergencyInProgress;

  return (
    <>
      {/* Main Emergency Button */}
      <Button
        onClick={handleEmergencyClick}
        disabled={isDisabled}
        className="bg-destructive hover:bg-destructive/90 text-white font-bold py-4 px-8 text-lg min-h-[60px] shadow-lg"
        size="lg"
      >
        <AlertTriangle className="mr-2 h-6 w-6" />
        {isDisabled ? "Processing Emergency..." : "🚨 EMERGENCY ALERT"}
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm Emergency Alert
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>This will immediately notify your emergency contact:</p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium">{profile?.emergency_contact_name || "Emergency Contact"}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.emergency_contact_phone && `Phone: ${profile.emergency_contact_phone}`}
                  {profile?.emergency_contact_phone && profile?.email && " • "}
                  {profile?.email && `Email: ${profile.email}`}
                </p>
              </div>
              <p className="text-sm font-medium text-destructive">
                ⚠️ This does NOT contact emergency services (911). If this is a life-threatening emergency, call 911 immediately.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmEmergency}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Phone className="mr-2 h-4 w-4" />
              Send Emergency Alert
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(() => {
                const result = getResultMessage();
                const Icon = result.icon;
                return (
                  <>
                    <Icon className={`h-5 w-5 ${
                      result.type === 'success' ? 'text-green-600' : 
                      result.type === 'error' ? 'text-destructive' : 
                      'text-yellow-600'
                    }`} />
                    {result.title}
                  </>
                );
              })()}
            </DialogTitle>
            <DialogDescription>
              {getResultMessage().message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button onClick={() => setShowResultDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Consent Dialog */}
      <LocationConsentDialog
        open={showConsentDialog}
        onConsentDecision={handleLocationConsentDecision}
        patientName={profile?.full_name || "Patient"}
      />
    </>
  );
};

export default EmergencyButton;