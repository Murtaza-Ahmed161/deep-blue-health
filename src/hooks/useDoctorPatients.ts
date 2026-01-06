import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { patientAssignmentService } from '@/services/patientAssignmentService';
import { DoctorPatient, AssignmentError } from '@/types/doctor';

export const useDoctorPatients = () => {
  const { user, role } = useAuth();
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    if (!user || role !== 'doctor') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const assignedPatients = await patientAssignmentService.getAssignedPatients(user.id);
      setPatients(assignedPatients);
    } catch (err) {
      console.error('Error fetching assigned patients:', err);
      if (err instanceof AssignmentError) {
        setError(err.message);
      } else {
        setError('Failed to fetch assigned patients');
      }
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user, role]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user || role !== 'doctor') return;

    const channel = supabase
      .channel('doctor-patients')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_doctor_assignments',
          filter: `doctor_id=eq.${user.id}`,
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

  const assignPatient = async (patientId: string, notes?: string) => {
    if (!user) throw new Error('User not authenticated');
    
    await patientAssignmentService.assignPatientToDoctor({
      patientId,
      doctorId: user.id,
      assignedBy: user.id,
      notes
    });
    
    // Refresh the list
    await fetchPatients();
  };

  const updateAssignment = async (assignmentId: string, status: 'active' | 'inactive' | 'transferred', notes?: string) => {
    await patientAssignmentService.updateAssignment({
      assignmentId,
      status,
      notes
    });
    
    // Refresh the list
    await fetchPatients();
  };

  return { 
    patients, 
    loading, 
    error, 
    assignPatient, 
    updateAssignment,
    refreshPatients: fetchPatients
  };
};

