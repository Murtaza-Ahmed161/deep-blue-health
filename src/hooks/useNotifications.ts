import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface NotificationPreferences {
  critical_alerts: boolean;
  new_reports: boolean;
  doctor_messages: boolean;
  vitals_warnings: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
}

export const useNotifications = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(true);

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
      } else if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const { data: newPrefs } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            critical_alerts: true,
            new_reports: true,
            doctor_messages: true,
            vitals_warnings: true,
            push_enabled: false,
            email_enabled: true,
          })
          .select()
          .single();
        
        if (newPrefs) setPreferences(newPrefs);
      }
      
      setLoading(false);
    };

    loadPreferences();
  }, []);

  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Browser notifications are not supported on this device.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will receive important alerts and updates.',
        });
        return true;
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [toast]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!preferences?.push_enabled || permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }, [preferences, permission]);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not save notification preferences.',
        variant: 'destructive',
      });
    } else if (data) {
      setPreferences(data);
      toast({
        title: 'Preferences Updated',
        description: 'Your notification settings have been saved.',
      });
    }
  }, [toast]);

  return {
    preferences,
    permission,
    loading,
    requestPermission,
    sendNotification,
    updatePreferences,
  };
};
