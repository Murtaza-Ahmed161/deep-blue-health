import { useState, useCallback } from 'react';
import { consentManager } from '@/services/consentManager';
import { ConsentResult } from '@/types/emergency';
import { useToast } from '@/hooks/use-toast';

export const useLocationConsent = () => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [consentResult, setConsentResult] = useState<ConsentResult | null>(null);
  const { toast } = useToast();

  const requestLocationConsent = useCallback(async (patientId: string): Promise<ConsentResult> => {
    setIsRequesting(true);
    setConsentResult(null);

    try {
      const result = await consentManager.requestLocationConsent(patientId);
      setConsentResult(result);

      if (result.granted) {
        toast({
          title: "Location Shared",
          description: "Your location will be included in the emergency notification.",
          variant: "default",
        });
      } else {
        toast({
          title: "Location Not Shared",
          description: "Emergency notification will be sent without location information.",
          variant: "default",
        });
      }

      return result;
    } catch (error) {
      const errorResult: ConsentResult = {
        granted: false,
        consentId: '',
        error: error instanceof Error ? error.message : 'Failed to process location consent'
      };
      
      setConsentResult(errorResult);
      
      toast({
        title: "Location Error",
        description: "Unable to process location consent. Continuing without location.",
        variant: "destructive",
      });

      return errorResult;
    } finally {
      setIsRequesting(false);
    }
  }, [toast]);

  const handleConsentDialogDecision = useCallback(async (granted: boolean, patientId: string) => {
    setShowConsentDialog(false);
    
    if (granted) {
      return await requestLocationConsent(patientId);
    } else {
      // Log the denial and return result
      try {
        const consentId = await consentManager.logConsentDecision(patientId, 'location', false, {
          source: 'user_dialog_denial'
        });
        
        const result: ConsentResult = {
          granted: false,
          consentId,
        };
        
        setConsentResult(result);
        
        toast({
          title: "Location Not Shared",
          description: "Emergency notification will be sent without location information.",
          variant: "default",
        });

        return result;
      } catch (error) {
        console.error('Error logging consent denial:', error);
        const errorResult: ConsentResult = {
          granted: false,
          consentId: '',
          error: 'Failed to log consent decision'
        };
        setConsentResult(errorResult);
        return errorResult;
      }
    }
  }, [requestLocationConsent, toast]);

  const showLocationConsentDialog = useCallback(() => {
    setShowConsentDialog(true);
  }, []);

  const hideLocationConsentDialog = useCallback(() => {
    setShowConsentDialog(false);
  }, []);

  const resetConsentState = useCallback(() => {
    setConsentResult(null);
    setIsRequesting(false);
    setShowConsentDialog(false);
  }, []);

  return {
    // State
    isRequesting,
    showConsentDialog,
    consentResult,
    
    // Actions
    requestLocationConsent,
    handleConsentDialogDecision,
    showLocationConsentDialog,
    hideLocationConsentDialog,
    resetConsentState,
  };
};