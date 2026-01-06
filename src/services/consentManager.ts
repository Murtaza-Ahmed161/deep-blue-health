import { supabase } from '@/integrations/supabase/client';
import { ConsentManager, ConsentResult, EmergencyLocation } from '@/types/emergency';

class ConsentManagerImpl implements ConsentManager {
  /**
   * Request location consent from the patient for emergency purposes
   * This method handles the geolocation API and returns the result
   */
  async requestLocationConsent(patientId: string): Promise<ConsentResult> {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        return {
          granted: false,
          consentId: '',
          error: 'Geolocation is not supported by this browser'
        };
      }

      // Create a promise to handle the geolocation request
      const locationPromise = new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000, // 10 second timeout
            maximumAge: 60000 // Accept cached position up to 1 minute old
          }
        );
      });

      try {
        const position = await locationPromise;
        
        // Log the consent decision as granted
        const consentId = await this.logConsentDecision(patientId, 'location', true, {
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString(),
          source: 'emergency_request'
        });

        return {
          granted: true,
          location: position.coords,
          consentId,
        };
      } catch (locationError) {
        // Log the consent decision as denied due to location error
        const consentId = await this.logConsentDecision(patientId, 'location', false, {
          error: locationError instanceof Error ? locationError.message : 'Location access denied',
          source: 'emergency_request'
        });

        return {
          granted: false,
          consentId,
          error: locationError instanceof Error ? locationError.message : 'Failed to get location'
        };
      }
    } catch (error) {
      console.error('Error in requestLocationConsent:', error);
      return {
        granted: false,
        consentId: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Log consent decision to the consent_audit table
   * This ensures all consent decisions are properly tracked for compliance
   */
  async logConsentDecision(
    patientId: string,
    consentType: 'location',
    granted: boolean,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // Get user agent and IP information for audit trail
      const userAgent = navigator.userAgent;
      
      const { data, error } = await supabase
        .from('consent_audit')
        .insert({
          user_id: patientId,
          consent_type: consentType,
          granted,
          user_agent: userAgent,
          metadata: metadata || {},
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error logging consent decision:', error);
        throw new Error(`Failed to log consent: ${error.message}`);
      }

      return data.id;
    } catch (error) {
      console.error('Error in logConsentDecision:', error);
      throw error;
    }
  }

  /**
   * Get the user's consent history for a specific consent type
   * Useful for checking previous consent decisions
   */
  async getConsentHistory(patientId: string, consentType: 'location'): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('consent_audit')
        .select('*')
        .eq('user_id', patientId)
        .eq('consent_type', consentType)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching consent history:', error);
        throw new Error(`Failed to fetch consent history: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getConsentHistory:', error);
      throw error;
    }
  }

  /**
   * Check if the user has previously granted consent for a specific type
   * Returns the most recent consent decision
   */
  async hasRecentConsent(patientId: string, consentType: 'location', withinMinutes: number = 60): Promise<boolean> {
    try {
      const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('consent_audit')
        .select('granted')
        .eq('user_id', patientId)
        .eq('consent_type', consentType)
        .gte('created_at', cutoffTime)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking recent consent:', error);
        return false;
      }

      return data?.granted || false;
    } catch (error) {
      console.error('Error in hasRecentConsent:', error);
      return false;
    }
  }

  /**
   * Validate location data for emergency use
   * Ensures location data meets minimum requirements for emergency response
   */
  validateLocationData(location: GeolocationCoordinates): boolean {
    // Check if coordinates are valid
    if (!location.latitude || !location.longitude) {
      return false;
    }

    // Check if coordinates are within valid ranges
    if (location.latitude < -90 || location.latitude > 90) {
      return false;
    }

    if (location.longitude < -180 || location.longitude > 180) {
      return false;
    }

    // Check if accuracy is reasonable (less than 1000 meters)
    if (location.accuracy && location.accuracy > 1000) {
      console.warn('Location accuracy is poor:', location.accuracy, 'meters');
      // Still return true, but log the warning
    }

    return true;
  }

  /**
   * Format location data for emergency notifications
   * Creates a human-readable location string
   */
  formatLocationForNotification(location: GeolocationCoordinates): string {
    const lat = location.latitude.toFixed(6);
    const lng = location.longitude.toFixed(6);
    const accuracy = location.accuracy ? Math.round(location.accuracy) : 'unknown';
    
    return `Location: ${lat}, ${lng} (±${accuracy}m accuracy)\nGoogle Maps: https://maps.google.com/?q=${lat},${lng}`;
  }
}

// Export singleton instance
export const consentManager = new ConsentManagerImpl();