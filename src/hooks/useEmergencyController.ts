import { useState, useCallback } from 'react';
import { emergencyController } from '@/services/emergencyController';
import { 
  EmergencyResult, 
  EmergencyEvent, 
  EmergencySystemState,
  EmergencyError,
  ConsentResult 
} from '@/types/emergency';
import { useToast } from '@/hooks/use-toast';

export const useEmergencyController = () => {
  const [state, setState] = useState<EmergencySystemState>({
    isProcessing: false,
    currentEvent: undefined,
    lastResult: undefined,
    error: undefined,
  });
  
  const { toast } = useToast();

  const triggerEmergency = useCallback(async (patientId: string): Promise<EmergencyResult> => {
    setState(prev => ({ ...prev, isProcessing: true, error: undefined }));

    try {
      const result = await emergencyController.triggerEmergency(patientId);
      
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        lastResult: result,
        error: undefined
      }));

      if (result.success) {
        toast({
          title: "Emergency Alert Initiated",
          description: "Processing your emergency request...",
          variant: "default",
        });
      } else {
        toast({
          title: "Emergency Alert Failed",
          description: result.message,
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      const errorResult: EmergencyResult = {
        success: false,
        eventId: '',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        notificationStatus: 'failed',
        error: 'UNKNOWN_ERROR'
      };

      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        lastResult: errorResult,
        error: error instanceof EmergencyError ? error : undefined
      }));

      toast({
        title: "Emergency System Error",
        description: "Unable to process emergency request. Please contact emergency services directly.",
        variant: "destructive",
      });

      return errorResult;
    }
  }, [toast]);

  const updateEmergencyWithLocation = useCallback(async (
    eventId: string, 
    consentResult: ConsentResult
  ): Promise<void> => {
    try {
      await emergencyController.updateEmergencyWithLocation(eventId, consentResult);
      
      if (consentResult.granted) {
        toast({
          title: "Location Added",
          description: "Your location has been added to the emergency alert.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error updating emergency with location:', error);
      toast({
        title: "Location Update Failed",
        description: "Unable to add location to emergency alert, but the alert will still be sent.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const updateEmergencyStatus = useCallback(async (
    eventId: string, 
    status: 'pending' | 'sent' | 'failed',
    notes?: string
  ): Promise<void> => {
    try {
      await emergencyController.updateEmergencyStatus(eventId, status, notes);
    } catch (error) {
      console.error('Error updating emergency status:', error);
      // Don't show toast for status updates as they're internal operations
    }
  }, []);

  const getEmergencyHistory = useCallback(async (patientId: string): Promise<EmergencyEvent[]> => {
    try {
      return await emergencyController.getEmergencyHistory(patientId);
    } catch (error) {
      console.error('Error fetching emergency history:', error);
      toast({
        title: "Failed to Load History",
        description: "Unable to load emergency history.",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  const getEmergencyEvent = useCallback(async (
    eventId: string, 
    patientId: string
  ): Promise<EmergencyEvent | null> => {
    try {
      return await emergencyController.getEmergencyEvent(eventId, patientId);
    } catch (error) {
      console.error('Error fetching emergency event:', error);
      return null;
    }
  }, []);

  const getLatestVitals = useCallback(async (patientId: string): Promise<any | null> => {
    try {
      return await emergencyController.getLatestVitals(patientId);
    } catch (error) {
      console.error('Error fetching latest vitals:', error);
      return null;
    }
  }, []);

  const resetState = useCallback(() => {
    setState({
      isProcessing: false,
      currentEvent: undefined,
      lastResult: undefined,
      error: undefined,
    });
  }, []);

  const setCurrentEvent = useCallback((event: EmergencyEvent | undefined) => {
    setState(prev => ({ ...prev, currentEvent: event }));
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    triggerEmergency,
    updateEmergencyWithLocation,
    updateEmergencyStatus,
    getEmergencyHistory,
    getEmergencyEvent,
    getLatestVitals,
    resetState,
    setCurrentEvent,
  };
};