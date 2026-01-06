import { supabase } from '@/integrations/supabase/client';
import { 
  EmergencyController, 
  EmergencyResult, 
  EmergencyEvent, 
  EmergencyEventInsert,
  EmergencyError,
  EmergencyErrorCode,
  ConsentResult,
  EmergencyLocation
} from '@/types/emergency';
import { consentManager } from './consentManager';

class EmergencyControllerImpl implements EmergencyController {
  /**
   * Trigger an emergency alert for a patient
   * This is the main entry point for emergency escalation
   */
  async triggerEmergency(patientId: string): Promise<EmergencyResult> {
    console.log('🚨 EmergencyController.triggerEmergency called with patientId:', patientId);
    
    try {
      // 1. Validate patient authentication and authorization
      console.log('Step 1: Validating patient access...');
      await this.validatePatientAccess(patientId);
      console.log('✅ Patient access validated');

      // 2. Check rate limiting (prevent spam)
      console.log('Step 2: Checking rate limits...');
      await this.checkRateLimit(patientId);
      console.log('✅ Rate limit check passed');

      // 3. Check if patient has emergency contact configured
      console.log('Step 3: Checking emergency contact...');
      const emergencyContact = await this.getEmergencyContact(patientId);
      if (!emergencyContact) {
        console.log('❌ No emergency contact found');
        throw new EmergencyError(
          'No emergency contact configured. Please set up an emergency contact in your profile settings.',
          EmergencyErrorCode.MISSING_EMERGENCY_CONTACT
        );
      }
      console.log('✅ Emergency contact found:', emergencyContact);

      // 3. Request location consent (this will be handled by the UI layer)
      // For now, we'll create the event without location and update it later
      const eventData: EmergencyEventInsert = {
        patient_id: patientId,
        triggered_by: patientId,
        triggered_at: new Date().toISOString(),
        location_consented: false,
        status: 'pending',
        notes: 'Emergency triggered by patient'
      };

      console.log('Step 4: Creating emergency event with data:', eventData);

      // 5. Create emergency event in database
      const { data: event, error: eventError } = await supabase
        .from('emergency_events')
        .insert(eventData)
        .select()
        .single();

      if (eventError) {
        console.error('❌ Database error creating emergency event:', eventError);
        throw new EmergencyError(
          'Failed to create emergency event',
          EmergencyErrorCode.DATABASE_ERROR,
          { originalError: eventError }
        );
      }

      console.log('✅ Emergency event created successfully:', event);

      return {
        success: true,
        eventId: event.id,
        message: 'Emergency event created successfully. Location consent and notification will be processed next.',
        notificationStatus: 'pending'
      };

    } catch (error) {
      console.error('❌ Error in triggerEmergency:', error);
      
      if (error instanceof EmergencyError) {
        return {
          success: false,
          eventId: '',
          message: error.message,
          notificationStatus: 'failed',
          error: error.code
        };
      }

      return {
        success: false,
        eventId: '',
        message: 'An unexpected error occurred while processing your emergency request.',
        notificationStatus: 'failed',
        error: EmergencyErrorCode.DATABASE_ERROR
      };
    }
  }

  /**
   * Update an emergency event with location data after consent is obtained
   */
  async updateEmergencyWithLocation(
    eventId: string, 
    consentResult: ConsentResult
  ): Promise<void> {
    try {
      const updateData: any = {
        location_consented: consentResult.granted,
        updated_at: new Date().toISOString()
      };

      if (consentResult.granted && consentResult.location) {
        updateData.location_lat = consentResult.location.latitude;
        updateData.location_lng = consentResult.location.longitude;
      }

      const { error } = await supabase
        .from('emergency_events')
        .update(updateData)
        .eq('id', eventId);

      if (error) {
        console.error('Error updating emergency event with location:', error);
        throw new EmergencyError(
          'Failed to update emergency event with location data',
          EmergencyErrorCode.DATABASE_ERROR,
          { originalError: error }
        );
      }
    } catch (error) {
      console.error('Error in updateEmergencyWithLocation:', error);
      throw error;
    }
  }

  /**
   * Update emergency event status based on notification results
   */
  async updateEmergencyStatus(
    eventId: string, 
    status: 'pending' | 'sent' | 'failed',
    notes?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from('emergency_events')
        .update(updateData)
        .eq('id', eventId);

      if (error) {
        console.error('Error updating emergency event status:', error);
        throw new EmergencyError(
          'Failed to update emergency event status',
          EmergencyErrorCode.DATABASE_ERROR,
          { originalError: error }
        );
      }
    } catch (error) {
      console.error('Error in updateEmergencyStatus:', error);
      throw error;
    }
  }

  /**
   * Get emergency history for a patient
   */
  async getEmergencyHistory(patientId: string): Promise<EmergencyEvent[]> {
    try {
      await this.validatePatientAccess(patientId);

      const { data, error } = await supabase
        .from('emergency_events')
        .select('*')
        .eq('patient_id', patientId)
        .order('triggered_at', { ascending: false });

      if (error) {
        console.error('Error fetching emergency history:', error);
        throw new EmergencyError(
          'Failed to fetch emergency history',
          EmergencyErrorCode.DATABASE_ERROR,
          { originalError: error }
        );
      }

      return data || [];
    } catch (error) {
      console.error('Error in getEmergencyHistory:', error);
      if (error instanceof EmergencyError) {
        throw error;
      }
      throw new EmergencyError(
        'Failed to fetch emergency history',
        EmergencyErrorCode.DATABASE_ERROR
      );
    }
  }

  /**
   * Get emergency event by ID (with proper authorization)
   */
  async getEmergencyEvent(eventId: string, patientId: string): Promise<EmergencyEvent | null> {
    try {
      await this.validatePatientAccess(patientId);

      const { data, error } = await supabase
        .from('emergency_events')
        .select('*')
        .eq('id', eventId)
        .eq('patient_id', patientId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching emergency event:', error);
        throw new EmergencyError(
          'Failed to fetch emergency event',
          EmergencyErrorCode.DATABASE_ERROR,
          { originalError: error }
        );
      }

      return data || null;
    } catch (error) {
      console.error('Error in getEmergencyEvent:', error);
      if (error instanceof EmergencyError) {
        throw error;
      }
      throw new EmergencyError(
        'Failed to fetch emergency event',
        EmergencyErrorCode.DATABASE_ERROR
      );
    }
  }

  /**
   * Validate that the current user has access to perform emergency operations for the patient
   */
  private async validatePatientAccess(patientId: string): Promise<void> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new EmergencyError(
          'Authentication required',
          EmergencyErrorCode.AUTHENTICATION_FAILED
        );
      }

      // Check if the authenticated user is the patient or has appropriate role
      if (user.id !== patientId) {
        // Check if user has doctor or admin role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError || !roleData || !['doctor', 'admin'].includes(roleData.role)) {
          throw new EmergencyError(
            'Insufficient permissions to access this patient\'s emergency data',
            EmergencyErrorCode.AUTHENTICATION_FAILED
          );
        }
      }

      // Validate that the patient exists
      const { data: patientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', patientId)
        .single();

      if (profileError || !patientProfile) {
        throw new EmergencyError(
          'Patient not found',
          EmergencyErrorCode.INVALID_PATIENT_ID
        );
      }
    } catch (error) {
      if (error instanceof EmergencyError) {
        throw error;
      }
      console.error('Error in validatePatientAccess:', error);
      throw new EmergencyError(
        'Failed to validate patient access',
        EmergencyErrorCode.AUTHENTICATION_FAILED
      );
    }
  }

  /**
   * Get emergency contact information for a patient
   */
  private async getEmergencyContact(patientId: string): Promise<{ name: string; email?: string; phone?: string } | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('emergency_contact_name, emergency_contact_phone, email')
        .eq('id', patientId)
        .single();

      if (error) {
        console.error('Error fetching emergency contact:', error);
        return null;
      }

      if (!profile.emergency_contact_name) {
        return null;
      }

      return {
        name: profile.emergency_contact_name,
        phone: profile.emergency_contact_phone || undefined,
        email: profile.email // Fallback to patient's email if no separate emergency email
      };
    } catch (error) {
      console.error('Error in getEmergencyContact:', error);
      return null;
    }
  }

  /**
   * Get latest vitals for a patient to include in emergency notification
   */
  async getLatestVitals(patientId: string): Promise<any | null> {
    try {
      const { data: vitals, error } = await supabase
        .from('vitals')
        .select('*')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching latest vitals:', error);
        return null;
      }

      return vitals || null;
    } catch (error) {
      console.error('Error in getLatestVitals:', error);
      return null;
    }
  }

  /**
   * Validate emergency event data before processing
   */
  private validateEmergencyEventData(data: EmergencyEventInsert): void {
    if (!data.patient_id) {
      throw new EmergencyError(
        'Patient ID is required',
        EmergencyErrorCode.VALIDATION_ERROR
      );
    }

    if (!data.triggered_by) {
      throw new EmergencyError(
        'Triggered by user ID is required',
        EmergencyErrorCode.VALIDATION_ERROR
      );
    }

    if (data.location_lat && (data.location_lat < -90 || data.location_lat > 90)) {
      throw new EmergencyError(
        'Invalid latitude value',
        EmergencyErrorCode.VALIDATION_ERROR
      );
    }

    if (data.location_lng && (data.location_lng < -180 || data.location_lng > 180)) {
      throw new EmergencyError(
        'Invalid longitude value',
        EmergencyErrorCode.VALIDATION_ERROR
      );
    }
  }

  /**
   * Check rate limiting to prevent emergency spam
   * Allows maximum 1 emergency per minute per patient
   */
  private async checkRateLimit(patientId: string): Promise<void> {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      
      const { data: recentEmergencies, error } = await supabase
        .from('emergency_events')
        .select('id, triggered_at')
        .eq('patient_id', patientId)
        .gte('triggered_at', oneMinuteAgo)
        .order('triggered_at', { ascending: false });

      if (error) {
        console.error('Error checking rate limit:', error);
        // Don't block emergency on rate limit check failure
        return;
      }

      if (recentEmergencies && recentEmergencies.length > 0) {
        const lastEmergency = recentEmergencies[0];
        const timeSinceLastEmergency = Date.now() - new Date(lastEmergency.triggered_at).getTime();
        const secondsRemaining = Math.ceil((60000 - timeSinceLastEmergency) / 1000);
        
        throw new EmergencyError(
          `Please wait ${secondsRemaining} seconds before triggering another emergency alert. This prevents accidental spam and ensures each alert is taken seriously.`,
          EmergencyErrorCode.RATE_LIMIT_EXCEEDED
        );
      }
    } catch (error) {
      if (error instanceof EmergencyError) {
        throw error;
      }
      console.error('Error in checkRateLimit:', error);
      // Don't block emergency on unexpected rate limit errors
    }
  }
}

// Export singleton instance
export const emergencyController = new EmergencyControllerImpl();