import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DoctorPatient {
  id: string;
  name: string;
  age: number | null;
  condition: string | null;
  status: 'normal' | 'warning' | 'critical';
  lastReading: string;
  vitals: {
    heartRate: number | null;
    bloodPressure: string;
    temperature: number | null;
    oxygen: number | null;
  };
}

export const useDoctorPatients = () => {
  const { user, role } = useAuth();
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || role !== 'doctor') {
      setLoading(false);
      return;
    }

    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get patients assigned to this doctor via consultations
        // For now, we'll get all patients (doctors can view all per RLS)
        // In future, add a patient_doctors junction table for explicit assignments
        
        // First get all patient user IDs
        const { data: patientRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'patient');

        if (rolesError) {
          console.error('Error fetching patient roles:', rolesError);
          setError('Failed to load patients');
          setPatients([]);
          setLoading(false);
          return;
        }

        const patientIds = (patientRoles || []).map(r => r.user_id);

        if (patientIds.length === 0) {
          setPatients([]);
          setLoading(false);
          return;
        }

        // Then get their profiles
        const { data: patientProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, created_at')
          .in('id', patientIds);

        if (profilesError) {
          console.error('Error fetching patient profiles:', profilesError);
          setError('Failed to load patient profiles');
          setPatients([]);
          setLoading(false);
          return;
        }

        // Get latest vitals for each patient
        const patientsWithVitals: DoctorPatient[] = [];
        
        for (const profile of (patientProfiles || [])) {
          // Get latest vitals
          const { data: latestVitals } = await supabase
            .from('vitals')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get latest AI screening result to determine status
          const { data: latestScreening } = await supabase
            .from('ai_screening_results')
            .select('severity')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const status = (latestScreening?.severity as 'normal' | 'warning' | 'critical') || 'normal';
          
          // Calculate age from created_at (approximate)
          const age = profile.created_at 
            ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365))
            : null;

          const lastReading = latestVitals?.created_at
            ? new Date(latestVitals.created_at).toLocaleString()
            : 'No readings yet';

          patientsWithVitals.push({
            id: profile.id,
            name: profile.full_name || 'Unknown Patient',
            age,
            condition: null, // Could be added to profiles table
            status,
            lastReading,
            vitals: {
              heartRate: latestVitals?.heart_rate || null,
              bloodPressure: latestVitals?.blood_pressure_systolic && latestVitals?.blood_pressure_diastolic
                ? `${latestVitals.blood_pressure_systolic}/${latestVitals.blood_pressure_diastolic}`
                : 'N/A',
              temperature: latestVitals?.temperature ? Number(latestVitals.temperature) : null,
              oxygen: latestVitals?.oxygen_saturation || null,
            },
          });
        }

        setPatients(patientsWithVitals);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch patients');
        setPatients([]);
        // Don't throw - just set error state
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('doctor-patients')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vitals',
        },
        () => {
          fetchPatients();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_screening_results',
        },
        () => {
          fetchPatients();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);

  return { patients, loading, error };
};

