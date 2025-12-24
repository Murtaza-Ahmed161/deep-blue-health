/**
 * Real-time vitals streaming hook using Supabase Realtime
 * 
 * This hook subscribes to Supabase Realtime for vitals updates.
 * NO FAKE DATA - only real vitals from the database.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VitalReading {
  heartRate: number | null;
  bloodPressure: { systolic: number | null; diastolic: number | null };
  temperature: number | null;
  oxygen: number | null;
  timestamp: string;
}

export interface PatientVitals {
  patientId: string;
  readings: VitalReading[];
  status: 'normal' | 'warning' | 'critical';
}

export const useVitalsStream = (patientIds: string[]) => {
  const [vitalsData, setVitalsData] = useState<Map<string, PatientVitals>>(new Map());
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (patientIds.length === 0) {
      setVitalsData(new Map());
      setHasData(false);
      return;
    }

    // Fetch initial vitals for all patients
    const fetchInitialVitals = async () => {
      const vitalsMap = new Map<string, PatientVitals>();

      for (const patientId of patientIds) {
        // Get last 24 hours of vitals
        const { data: vitals, error } = await supabase
          .from('vitals')
          .select('*')
          .eq('user_id', patientId)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true });

        if (error) {
          console.error(`Error fetching vitals for patient ${patientId}:`, error);
          continue;
        }

        // Get latest AI screening to determine status
        const { data: latestScreening } = await supabase
          .from('ai_screening_results')
          .select('severity')
          .eq('user_id', patientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const status = (latestScreening?.severity as 'normal' | 'warning' | 'critical') || 'normal';

        const readings: VitalReading[] = (vitals || []).map(v => ({
          heartRate: v.heart_rate,
          bloodPressure: {
            systolic: v.blood_pressure_systolic,
            diastolic: v.blood_pressure_diastolic,
          },
          temperature: v.temperature ? Number(v.temperature) : null,
          oxygen: v.oxygen_saturation,
          timestamp: v.created_at,
        }));

        if (readings.length > 0) {
          setHasData(true);
        }

        vitalsMap.set(patientId, {
          patientId,
          readings,
          status,
        });
      }

      setVitalsData(vitalsMap);
    };

    fetchInitialVitals();

    // Subscribe to realtime vitals updates
    const channel = supabase
      .channel('vitals-stream')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vitals',
          filter: `user_id=in.(${patientIds.join(',')})`,
        },
        async (payload) => {
          const newVital = payload.new as any;
          const patientId = newVital.user_id;

          // Update vitals for this patient
          setVitalsData(prev => {
            const existing = prev.get(patientId);
            const newReading: VitalReading = {
              heartRate: newVital.heart_rate,
              bloodPressure: {
                systolic: newVital.blood_pressure_systolic,
                diastolic: newVital.blood_pressure_diastolic,
              },
              temperature: newVital.temperature ? Number(newVital.temperature) : null,
              oxygen: newVital.oxygen_saturation,
              timestamp: newVital.created_at,
            };

            const readings = existing
              ? [...existing.readings.slice(-23), newReading]
              : [newReading];

            // Get latest status from AI screening
            supabase
              .from('ai_screening_results')
              .select('severity')
              .eq('user_id', patientId)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()
              .then(({ data: screening }) => {
                const status = (screening?.severity as 'normal' | 'warning' | 'critical') || 'normal';
                
                setVitalsData(prev => {
                  const updated = new Map(prev);
                  const current = updated.get(patientId);
                  if (current) {
                    updated.set(patientId, {
                      ...current,
                      status,
                    });
                  }
                  return updated;
                });
              });

            const updated = new Map(prev);
            updated.set(patientId, {
              patientId,
              readings,
              status: existing?.status || 'normal',
            });
            setHasData(true);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientIds]);

  return { vitalsData, hasData };
};
