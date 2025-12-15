import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { bluetoothService, WearableVitals, WearableDevice, ConnectionStatus } from '@/services/bluetoothService';

export interface VitalsRecord {
  id: string;
  heartRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  oxygenSaturation: number | null;
  temperature: number | null;
  respiratoryRate: number | null;
  source: 'manual' | 'wearable';
  deviceType: string | null;
  enteredBy: 'patient' | 'doctor' | 'system';
  createdAt: Date;
}

export interface ManualVitalsInput {
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  oxygenSaturation?: number;
  temperature?: number;
  respiratoryRate?: number;
  timestamp?: Date;
}

export const useVitals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vitals, setVitals] = useState<VitalsRecord[]>([]);
  const [currentVitals, setCurrentVitals] = useState<VitalsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectedDevice, setConnectedDevice] = useState<WearableDevice | null>(null);

  // Fetch vitals from database
  const fetchVitals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vitals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mappedVitals: VitalsRecord[] = (data || []).map(v => ({
        id: v.id,
        heartRate: v.heart_rate,
        bloodPressureSystolic: v.blood_pressure_systolic,
        bloodPressureDiastolic: v.blood_pressure_diastolic,
        oxygenSaturation: v.oxygen_saturation,
        temperature: v.temperature ? Number(v.temperature) : null,
        respiratoryRate: v.respiratory_rate,
        source: (v.source as 'manual' | 'wearable') || 'wearable',
        deviceType: v.device_type,
        enteredBy: (v.entered_by as 'patient' | 'doctor' | 'system') || 'system',
        createdAt: new Date(v.created_at),
      }));

      setVitals(mappedVitals);
      if (mappedVitals.length > 0) {
        setCurrentVitals(mappedVitals[0]);
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save vitals to database
  const saveVitals = useCallback(async (
    input: ManualVitalsInput,
    source: 'manual' | 'wearable' = 'manual',
    deviceType?: string
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save vitals',
        variant: 'destructive',
      });
      return false;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('vitals')
        .insert({
          user_id: user.id,
          heart_rate: input.heartRate || null,
          blood_pressure_systolic: input.bloodPressureSystolic || null,
          blood_pressure_diastolic: input.bloodPressureDiastolic || null,
          oxygen_saturation: input.oxygenSaturation || null,
          temperature: input.temperature || null,
          respiratory_rate: input.respiratoryRate || null,
          source,
          device_type: deviceType || (source === 'wearable' ? 'bluetooth' : null),
          entered_by: source === 'manual' ? 'patient' : 'system',
          synced_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const newVitals: VitalsRecord = {
        id: data.id,
        heartRate: data.heart_rate,
        bloodPressureSystolic: data.blood_pressure_systolic,
        bloodPressureDiastolic: data.blood_pressure_diastolic,
        oxygenSaturation: data.oxygen_saturation,
        temperature: data.temperature ? Number(data.temperature) : null,
        respiratoryRate: data.respiratory_rate,
        source: data.source as 'manual' | 'wearable',
        deviceType: data.device_type,
        enteredBy: data.entered_by as 'patient' | 'doctor' | 'system',
        createdAt: new Date(data.created_at),
      };

      setVitals(prev => [newVitals, ...prev]);
      setCurrentVitals(newVitals);

      // Trigger AI screening
      await triggerAIScreening(data.id, newVitals);

      return true;
    } catch (error) {
      console.error('Error saving vitals:', error);
      toast({
        title: 'Error',
        description: 'Failed to save vitals. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [user, toast]);

  // Trigger AI screening for new vitals
  const triggerAIScreening = async (vitalsId: string, vitals: VitalsRecord) => {
    try {
      const { error } = await supabase.functions.invoke('ai-screen-vitals', {
        body: {
          vitalsId,
          vitals: {
            heartRate: vitals.heartRate,
            bloodPressureSystolic: vitals.bloodPressureSystolic,
            bloodPressureDiastolic: vitals.bloodPressureDiastolic,
            oxygenSaturation: vitals.oxygenSaturation,
            temperature: vitals.temperature,
            respiratoryRate: vitals.respiratoryRate,
          },
        },
      });

      if (error) {
        console.warn('AI screening failed:', error);
      }
    } catch (error) {
      console.warn('AI screening error:', error);
    }
  };

  // Connect to wearable device
  const connectDevice = useCallback(async (deviceId: string) => {
    const success = await bluetoothService.connect(deviceId);
    if (success) {
      toast({
        title: 'Device Connected',
        description: 'Wearable device connected successfully. Vitals will sync automatically.',
      });
    } else {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to wearable device. Please try again.',
        variant: 'destructive',
      });
    }
    return success;
  }, [toast]);

  // Disconnect wearable device
  const disconnectDevice = useCallback(async () => {
    await bluetoothService.disconnect();
    toast({
      title: 'Device Disconnected',
      description: 'Wearable device has been disconnected.',
    });
  }, [toast]);

  // Subscribe to Bluetooth events
  useEffect(() => {
    const unsubStatus = bluetoothService.onStatusChange(setConnectionStatus);
    const unsubDevice = bluetoothService.onDeviceChange(setConnectedDevice);
    
    const unsubVitals = bluetoothService.onVitals(async (wearableVitals: WearableVitals) => {
      // Auto-save wearable vitals
      await saveVitals({
        heartRate: wearableVitals.heartRate,
        bloodPressureSystolic: wearableVitals.bloodPressureSystolic,
        bloodPressureDiastolic: wearableVitals.bloodPressureDiastolic,
        oxygenSaturation: wearableVitals.oxygenSaturation,
        temperature: wearableVitals.temperature,
        respiratoryRate: wearableVitals.respiratoryRate,
      }, 'wearable', 'bluetooth');
    });

    return () => {
      unsubStatus();
      unsubDevice();
      unsubVitals();
    };
  }, [saveVitals]);

  // Initial fetch
  useEffect(() => {
    fetchVitals();
  }, [fetchVitals]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('vitals-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vitals',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchVitals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchVitals]);

  return {
    vitals,
    currentVitals,
    loading,
    saving,
    saveVitals,
    fetchVitals,
    connectionStatus,
    connectedDevice,
    connectDevice,
    disconnectDevice,
  };
};
