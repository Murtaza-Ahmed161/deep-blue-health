import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DoctorAlert {
  id: string;
  patientId: string;
  patientName: string;
  message: string;
  severity: 'critical' | 'warning';
  time: string;
  vitalsId: string | null;
  acknowledged: boolean;
}

export const useDoctorAlerts = () => {
  const { user, role } = useAuth();
  const [alerts, setAlerts] = useState<DoctorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || role !== 'doctor') {
      setLoading(false);
      return;
    }

    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get critical/warning AI screening results
        // These are the alerts doctors need to see
        const { data: screeningResults, error: screeningError } = await supabase
          .from('ai_screening_results')
          .select('id, user_id, vitals_id, severity, explanation, created_at')
          .in('severity', ['critical', 'warning'])
          .order('created_at', { ascending: false })
          .limit(50);

        if (screeningError) {
          console.error('Error fetching alerts:', screeningError);
          setError('Failed to load alerts');
          setAlerts([]);
          setLoading(false);
          return;
        }

        // Get patient names for each alert
        const patientIds = [...new Set((screeningResults || []).map(r => r.user_id))];
        const { data: patientProfiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', patientIds);

        const patientNameMap = new Map(
          (patientProfiles || []).map(p => [p.id, p.full_name || 'Unknown Patient'])
        );
        
        const alertsList: DoctorAlert[] = (screeningResults || [])
          .map((result) => {
            const patientName = patientNameMap.get(result.user_id) || 'Unknown Patient';
            
            // Create alert message from explanation
            const message = result.explanation || 'Anomaly detected in patient vitals';
            
            return {
              id: result.id,
              patientId: result.user_id,
              patientName,
              message,
              severity: result.severity as 'critical' | 'warning',
              time: new Date(result.created_at).toLocaleString(),
              vitalsId: result.vitals_id,
              acknowledged: false, // Will be set based on acknowledged_alerts table or field
            };
          });

        setAlerts(alertsList);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
        setAlerts([]);
        // Don't throw - just set error state
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('doctor-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_screening_results',
          filter: 'severity=in.(critical,warning)',
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, role]);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      // For now, we'll just remove it from the local state
      // In production, you'd want to:
      // 1. Add an acknowledged_alerts table, OR
      // 2. Add an acknowledged_at field to ai_screening_results, OR
      // 3. Add an acknowledged_by field
      // For MVP, we'll filter it out locally
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      
      // TODO: Persist acknowledgment to database
      // await supabase.from('acknowledged_alerts').insert({
      //   alert_id: alertId,
      //   doctor_id: user?.id,
      //   acknowledged_at: new Date().toISOString(),
      // });
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  return { alerts, loading, error, acknowledgeAlert };
};

