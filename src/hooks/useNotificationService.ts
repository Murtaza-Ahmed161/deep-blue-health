import { useState, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';
import { 
  NotificationResult, 
  EmergencyEvent, 
  EmergencyContact,
  NotificationChannel 
} from '@/types/emergency';
import { useToast } from '@/hooks/use-toast';

export const useNotificationService = () => {
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<NotificationResult | null>(null);
  const { toast } = useToast();

  const sendEmergencyNotification = useCallback(async (
    event: EmergencyEvent,
    recipient: EmergencyContact
  ): Promise<NotificationResult> => {
    setIsSending(true);
    setLastResult(null);

    try {
      const result = await notificationService.sendEmergencyNotification(event, recipient);
      setLastResult(result);

      if (result.success) {
        toast({
          title: "Emergency Alert Sent",
          description: `Notification sent via ${result.channel} to ${recipient.name}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Notification Failed",
          description: `Failed to send ${result.channel} notification: ${result.error}`,
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      const errorResult: NotificationResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        channel: recipient.preferredChannel,
        recipient: recipient.email || recipient.phone || 'unknown'
      };

      setLastResult(errorResult);

      toast({
        title: "Notification System Error",
        description: "Unable to send emergency notification. Please contact emergency services directly.",
        variant: "destructive",
      });

      return errorResult;
    } finally {
      setIsSending(false);
    }
  }, [toast]);

  const validateNotificationChannel = useCallback((channel: NotificationChannel): boolean => {
    return notificationService.validateNotificationChannel(channel);
  }, []);

  const resetState = useCallback(() => {
    setLastResult(null);
    setIsSending(false);
  }, []);

  return {
    // State
    isSending,
    lastResult,
    
    // Actions
    sendEmergencyNotification,
    validateNotificationChannel,
    resetState,
  };
};