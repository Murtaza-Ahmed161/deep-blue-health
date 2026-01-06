import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, XCircle, MapPin, Phone, Mail, Clock } from "lucide-react";
import { useEmergencyController } from "@/hooks/useEmergencyController";
import { useLocationConsent } from "@/hooks/useLocationConsent";
import { useNotificationService } from "@/hooks/useNotificationService";
import { useAuth } from "@/hooks/useAuth";
import LocationConsentDialog from "./LocationConsentDialog";
import { EmergencyContact } from "@/types/emergency";
import { debugEmergencySystem, testEmergencyEventCreation } from "@/utils/emergencyDebug";

const EmergencyTestComponent = () => {
  const { user, profile } = useAuth();
  const {
    isProcessing,
    lastResult,
    triggerEmergency,
    updateEmergencyWithLocation,
    getEmergencyHistory,
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

  const [emergencyHistory, setEmergencyHistory] = useState<any[]>([]);
  const [testStep, setTestStep] = useState<'idle' | 'emergency-created' | 'location-processed' | 'notification-sent'>('idle');

  // Real emergency contact for testing
  const mockEmergencyContact: EmergencyContact = {
    name: profile?.emergency_contact_name || "Test Emergency Contact",
    email: profile?.email || "noorburair@gmail.com", // Use real email
    phone: profile?.emergency_contact_phone || "+1234567890",
    preferredChannel: "email"
  };

  const handleStartEmergencyTest = async () => {
    if (!user) {
      alert("Please log in to test emergency system");
      return;
    }

    resetState();
    resetConsentState();
    setTestStep('idle');

    try {
      // Step 1: Trigger emergency
      console.log("Step 1: Triggering emergency...");
      const result = await triggerEmergency(user.id);
      
      if (result.success) {
        setTestStep('emergency-created');
        console.log("Emergency created successfully:", result);
        
        // Step 2: Show location consent dialog
        showLocationConsentDialog();
      } else {
        console.error("Emergency creation failed:", result);
      }
    } catch (error) {
      console.error("Error in emergency test:", error);
    }
  };

  const handleDebugCheck = async () => {
    await debugEmergencySystem();
  };

  const handleTestDirectInsert = async () => {
    if (!user) {
      alert("Please log in first");
      return;
    }
    await testEmergencyEventCreation(user.id);
  };

  const handleLocationConsentDecision = async (granted: boolean) => {
    if (!user || !lastResult?.eventId) return;

    try {
      const consentResult = await handleConsentDialogDecision(granted, user.id);
      
      // Update emergency event with location data
      await updateEmergencyWithLocation(lastResult.eventId, consentResult);
      setTestStep('location-processed');
      
      // Step 3: Send notification (simulate)
      if (lastResult) {
        console.log("Step 3: Sending notification...");
        
        // Create mock emergency event for notification
        const mockEvent = {
          id: lastResult.eventId,
          patient_id: user.id,
          triggered_by: user.id,
          triggered_at: new Date().toISOString(),
          location_lat: consentResult.location?.latitude || null,
          location_lng: consentResult.location?.longitude || null,
          location_consented: consentResult.granted,
          status: 'pending' as const,
          notes: 'Test emergency',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const notifResult = await sendEmergencyNotification(mockEvent, mockEmergencyContact);
        if (notifResult.success) {
          setTestStep('notification-sent');
        }
      }
    } catch (error) {
      console.error("Error processing location consent:", error);
    }
  };

  const handleLoadHistory = async () => {
    if (!user) return;
    
    try {
      const history = await getEmergencyHistory(user.id);
      setEmergencyHistory(history);
    } catch (error) {
      console.error("Error loading emergency history:", error);
    }
  };

  const getStepStatus = (step: string) => {
    switch (step) {
      case 'emergency-created':
        return testStep === 'emergency-created' || testStep === 'location-processed' || testStep === 'notification-sent';
      case 'location-processed':
        return testStep === 'location-processed' || testStep === 'notification-sent';
      case 'notification-sent':
        return testStep === 'notification-sent';
      default:
        return false;
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Emergency System Test
          </CardTitle>
          <CardDescription>
            Please log in as a patient to test the emergency escalation system
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Emergency Escalation System Test
          </CardTitle>
          <CardDescription>
            Test the complete emergency escalation flow: trigger → location consent → notification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleStartEmergencyTest}
              disabled={isProcessing || isRequestingLocation || isSending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessing ? "Creating Emergency..." : "🚨 Test Emergency Alert"}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLoadHistory}
              disabled={isProcessing}
            >
              Load History
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleDebugCheck}
            >
              🔍 Debug Check
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleTestDirectInsert}
            >
              🧪 Test DB Insert
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                resetState();
                resetConsentState();
                setTestStep('idle');
              }}
            >
              Reset Test
            </Button>
          </div>

          {/* Test Progress */}
          <div className="space-y-2">
            <h4 className="font-medium">Test Progress:</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {getStepStatus('emergency-created') ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted" />
                )}
                <span className={getStepStatus('emergency-created') ? 'text-success' : 'text-muted-foreground'}>
                  1. Emergency Event Created
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getStepStatus('location-processed') ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted" />
                )}
                <span className={getStepStatus('location-processed') ? 'text-success' : 'text-muted-foreground'}>
                  2. Location Consent Processed
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getStepStatus('notification-sent') ? (
                  <CheckCircle className="h-4 w-4 text-success" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted" />
                )}
                <span className={getStepStatus('notification-sent') ? 'text-success' : 'text-muted-foreground'}>
                  3. Notification Sent
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Test Results */}
      {(lastResult || consentResult || notificationResult) && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Emergency Result */}
            {lastResult && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Emergency Event
                </h4>
                <div className="bg-muted p-3 rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={lastResult.success ? "default" : "destructive"}>
                      {lastResult.success ? "Success" : "Failed"}
                    </Badge>
                    <span className="text-sm">Event ID: {lastResult.eventId || "N/A"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{lastResult.message}</p>
                  {lastResult.error && (
                    <p className="text-sm text-destructive">Error: {lastResult.error}</p>
                  )}
                </div>
              </div>
            )}

            {/* Location Consent Result */}
            {consentResult && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location Consent
                </h4>
                <div className="bg-muted p-3 rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={consentResult.granted ? "default" : "secondary"}>
                      {consentResult.granted ? "Granted" : "Denied"}
                    </Badge>
                    <span className="text-sm">Consent ID: {consentResult.consentId}</span>
                  </div>
                  {consentResult.location && (
                    <p className="text-sm text-muted-foreground">
                      Location: {consentResult.location.latitude.toFixed(6)}, {consentResult.location.longitude.toFixed(6)}
                    </p>
                  )}
                  {consentResult.error && (
                    <p className="text-sm text-destructive">Error: {consentResult.error}</p>
                  )}
                </div>
              </div>
            )}

            {/* Notification Result */}
            {notificationResult && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  {notificationResult.channel === 'email' ? (
                    <Mail className="h-4 w-4" />
                  ) : (
                    <Phone className="h-4 w-4" />
                  )}
                  Notification ({notificationResult.channel})
                </h4>
                <div className="bg-muted p-3 rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={notificationResult.success ? "default" : "destructive"}>
                      {notificationResult.success ? "Sent" : "Failed"}
                    </Badge>
                    <span className="text-sm">To: {notificationResult.recipient}</span>
                  </div>
                  {notificationResult.messageId && (
                    <p className="text-sm text-muted-foreground">Message ID: {notificationResult.messageId}</p>
                  )}
                  {notificationResult.error && (
                    <p className="text-sm text-destructive">Error: {notificationResult.error}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Emergency History */}
      {emergencyHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Emergency History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {emergencyHistory.map((event, index) => (
                <div key={event.id} className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge variant={
                        event.status === 'sent' ? 'default' : 
                        event.status === 'failed' ? 'destructive' : 
                        'secondary'
                      }>
                        {event.status}
                      </Badge>
                      <span className="ml-2 text-sm">
                        {new Date(event.triggered_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Location: {event.location_consented ? 'Shared' : 'Not shared'}
                    </div>
                  </div>
                  {event.notes && (
                    <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm space-y-1">
            <p><strong>Patient:</strong> {profile?.full_name || "Unknown"} ({user.email})</p>
            <p><strong>Emergency Contact:</strong> {mockEmergencyContact.name}</p>
            <p><strong>Test Email:</strong> {mockEmergencyContact.email}</p>
            <p><strong>Test Phone:</strong> {mockEmergencyContact.phone}</p>
            <p><strong>Notification Channel:</strong> {mockEmergencyContact.preferredChannel}</p>
          </div>
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p><strong>Note:</strong> This test uses mock email/phone numbers and will not send real notifications unless the Supabase Edge Functions are deployed and configured with real API keys.</p>
          </div>
        </CardContent>
      </Card>

      {/* Location Consent Dialog */}
      <LocationConsentDialog
        open={showConsentDialog}
        onConsentDecision={handleLocationConsentDecision}
        patientName={profile?.full_name || "Patient"}
      />
    </div>
  );
};

export default EmergencyTestComponent;