import { supabase } from '@/integrations/supabase/client';
import { 
  PatientAssignmentService,
  AssignPatientRequest,
  UpdateAssignmentRequest,
  PatientDoctorAssignment,
  DoctorPatient,
  AssignmentError,
  AssignmentErrorCode,
  AssignmentStatus
} from '@/types/doctor';

class PatientAssignmentServiceImpl implements PatientAssignmentService {
  /**
   * Assign a patient to a doctor
   */
  async assignPatientToDoctor(request: AssignPatientRequest): Promise<PatientDoctorAssignment> {
    try {
      // Validate that patient exists and is actually a patient
      const { data: patientProfile, error: patientError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', request.patientId)
        .single();

      if (patientError || !patientProfile) {
        throw new AssignmentError(
          'Patient not found',
          AssignmentErrorCode.PATIENT_NOT_FOUND,
          { patientId: request.patientId }
        );
      }

      // Validate that doctor exists and is actually a doctor
      const { data: doctorRole, error: doctorError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', request.doctorId)
        .eq('role', 'doctor')
        .single();

      if (doctorError || !doctorRole) {
        throw new AssignmentError(
          'Doctor not found or invalid role',
          AssignmentErrorCode.DOCTOR_NOT_FOUND,
          { doctorId: request.doctorId }
        );
      }

      // Check if patient is already assigned to this doctor
      const { data: existingAssignment } = await supabase
        .from('patient_doctor_assignments')
        .select('id, status')
        .eq('patient_id', request.patientId)
        .eq('doctor_id', request.doctorId)
        .eq('status', 'active')
        .single();

      if (existingAssignment) {
        throw new AssignmentError(
          'Patient is already assigned to this doctor',
          AssignmentErrorCode.ALREADY_ASSIGNED,
          { assignmentId: existingAssignment.id }
        );
      }

      // Create the assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('patient_doctor_assignments')
        .insert({
          patient_id: request.patientId,
          doctor_id: request.doctorId,
          assigned_by: request.assignedBy,
          notes: request.notes || null,
          status: 'active'
        })
        .select()
        .single();

      if (assignmentError) {
        console.error('Error creating assignment:', assignmentError);
        throw new AssignmentError(
          'Failed to create patient assignment',
          AssignmentErrorCode.DATABASE_ERROR,
          { originalError: assignmentError }
        );
      }

      return assignment;
    } catch (error) {
      if (error instanceof AssignmentError) {
        throw error;
      }
      console.error('Unexpected error in assignPatientToDoctor:', error);
      throw new AssignmentError(
        'An unexpected error occurred while assigning patient',
        AssignmentErrorCode.DATABASE_ERROR
      );
    }
  }

  /**
   * Update an existing assignment
   */
  async updateAssignment(request: UpdateAssignmentRequest): Promise<PatientDoctorAssignment> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (request.status) {
        updateData.status = request.status;
      }

      if (request.notes !== undefined) {
        updateData.notes = request.notes;
      }

      const { data: assignment, error } = await supabase
        .from('patient_doctor_assignments')
        .update(updateData)
        .eq('id', request.assignmentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating assignment:', error);
        throw new AssignmentError(
          'Failed to update assignment',
          AssignmentErrorCode.DATABASE_ERROR,
          { originalError: error }
        );
      }

      if (!assignment) {
        throw new AssignmentError(
          'Assignment not found',
          AssignmentErrorCode.ASSIGNMENT_NOT_FOUND,
          { assignmentId: request.assignmentId }
        );
      }

      return assignment;
    } catch (error) {
      if (error instanceof AssignmentError) {
        throw error;
      }
      console.error('Unexpected error in updateAssignment:', error);
      throw new AssignmentError(
        'An unexpected error occurred while updating assignment',
        AssignmentErrorCode.DATABASE_ERROR
      );
    }
  }

  /**
   * Get all patients assigned to a doctor
   */
  async getAssignedPatients(doctorId: string): Promise<DoctorPatient[]> {
    try {
      // Get active assignments for this doctor
      const { data: assignments, error: assignmentError } = await supabase
        .from('patient_doctor_assignments')
        .select(`
          id,
          patient_id,
          assigned_at,
          assigned_by,
          status,
          notes,
          profiles!patient_doctor_assignments_patient_id_fkey (
            id,
            full_name,
            email,
            created_at
          )
        `)
        .eq('doctor_id', doctorId)
        .eq('status', 'active')
        .order('assigned_at', { ascending: false });

      if (assignmentError) {
        console.error('Error fetching assignments:', assignmentError);
        throw new AssignmentError(
          'Failed to fetch patient assignments',
          AssignmentErrorCode.DATABASE_ERROR,
          { originalError: assignmentError }
        );
      }

      const patients: DoctorPatient[] = [];

      for (const assignment of assignments || []) {
        const profile = assignment.profiles as any;
        if (!profile) continue;

        // Get latest vitals
        const { data: latestVitals } = await supabase
          .from('vitals')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get latest AI screening result for status
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

        patients.push({
          id: profile.id,
          name: profile.full_name || 'Unknown Patient',
          email: profile.email,
          age,
          condition: null, // Could be added to profiles table
          status,
          lastReading,
          assignedAt: new Date(assignment.assigned_at).toLocaleString(),
          assignmentStatus: assignment.status as AssignmentStatus,
          vitals: {
            heartRate: latestVitals?.heart_rate || null,
            bloodPressure: latestVitals?.blood_pressure_systolic && latestVitals?.blood_pressure_diastolic
              ? `${latestVitals.blood_pressure_systolic}/${latestVitals.blood_pressure_diastolic}`
              : 'N/A',
            temperature: latestVitals?.temperature ? Number(latestVitals.temperature) : null,
            oxygen: latestVitals?.oxygen_saturation || null,
          },
          assignmentId: assignment.id,
          assignedBy: assignment.assigned_by,
          assignmentNotes: assignment.notes || undefined,
        });
      }

      return patients;
    } catch (error) {
      if (error instanceof AssignmentError) {
        throw error;
      }
      console.error('Unexpected error in getAssignedPatients:', error);
      throw new AssignmentError(
        'An unexpected error occurred while fetching assigned patients',
        AssignmentErrorCode.DATABASE_ERROR
      );
    }
  }

  /**
   * Get all doctor assignments for a patient
   */
  async getDoctorAssignments(patientId: string): Promise<PatientDoctorAssignment[]> {
    try {
      const { data: assignments, error } = await supabase
        .from('patient_doctor_assignments')
        .select('*')
        .eq('patient_id', patientId)
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('Error fetching doctor assignments:', error);
        throw new AssignmentError(
          'Failed to fetch doctor assignments',
          AssignmentErrorCode.DATABASE_ERROR,
          { originalError: error }
        );
      }

      return assignments || [];
    } catch (error) {
      if (error instanceof AssignmentError) {
        throw error;
      }
      console.error('Unexpected error in getDoctorAssignments:', error);
      throw new AssignmentError(
        'An unexpected error occurred while fetching doctor assignments',
        AssignmentErrorCode.DATABASE_ERROR
      );
    }
  }

  /**
   * Transfer a patient from one doctor to another
   */
  async transferPatient(
    patientId: string, 
    fromDoctorId: string, 
    toDoctorId: string, 
    transferredBy: string
  ): Promise<void> {
    try {
      // Start a transaction-like operation
      // 1. Mark old assignment as transferred
      const { error: updateError } = await supabase
        .from('patient_doctor_assignments')
        .update({ 
          status: 'transferred',
          updated_at: new Date().toISOString()
        })
        .eq('patient_id', patientId)
        .eq('doctor_id', fromDoctorId)
        .eq('status', 'active');

      if (updateError) {
        console.error('Error updating old assignment:', updateError);
        throw new AssignmentError(
          'Failed to update previous assignment',
          AssignmentErrorCode.DATABASE_ERROR,
          { originalError: updateError }
        );
      }

      // 2. Create new assignment
      await this.assignPatientToDoctor({
        patientId,
        doctorId: toDoctorId,
        assignedBy: transferredBy,
        notes: `Transferred from previous doctor`
      });

    } catch (error) {
      if (error instanceof AssignmentError) {
        throw error;
      }
      console.error('Unexpected error in transferPatient:', error);
      throw new AssignmentError(
        'An unexpected error occurred while transferring patient',
        AssignmentErrorCode.DATABASE_ERROR
      );
    }
  }
}

// Export singleton instance
export const patientAssignmentService = new PatientAssignmentServiceImpl();