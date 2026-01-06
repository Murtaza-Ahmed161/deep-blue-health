import { 
  NotificationService, 
  NotificationResult, 
  EmergencyEvent, 
  EmergencyContact,
  NotificationChannel,
  EmergencyNotificationContent,
  EmergencyError,
  EmergencyErrorCode
} from '@/types/emergency';
import { supabase } from '@/integrations/supabase/client';

class NotificationServiceImpl implements NotificationService {
  private readonly emailApiUrl = '/api/send-emergency-email'; // Will be implemented as Supabase Edge Function
  private readonly smsApiUrl = '/api/send-emergency-sms';     // Will be implemented as Supabase Edge Function

  /**
   * Send emergency notification via email or SMS
   * This is the main entry point for emergency notifications
   */
  async sendEmergencyNotification(
    event: EmergencyEvent, 
    recipient: EmergencyContact
  ): Promise<NotificationResult> {
    try {
      // Validate notification channel
      if (!this.validateNotificationChannel(recipient.preferredChannel)) {
        throw new EmergencyError(
          `Invalid notification channel: ${recipient.preferredChannel}`,
          EmergencyErrorCode.VALIDATION_ERROR
        );
      }

      // Get patient information for notification content
      const patientInfo = await this.getPatientInfo(event.patient_id);
      if (!patientInfo) {
        throw new EmergencyError(
          'Patient information not found',
          EmergencyErrorCode.INVALID_PATIENT_ID
        );
      }

      // Get latest vitals if available
      const vitals = await this.getLatestVitals(event.patient_id);

      // Create notification content
      const content = this.createNotificationContent(event, patientInfo, vitals);

      // Log notification attempt
      const notificationRecord = await this.logNotificationAttempt(event.id, recipient);

      let result: NotificationResult;

      // Send notification based on preferred channel
      if (recipient.preferredChannel === 'email' && recipient.email) {
        result = await this.sendEmailNotification(recipient.email, content);
      } else if (recipient.preferredChannel === 'sms' && recipient.phone) {
        result = await this.sendSmsNotification(recipient.phone, content);
      } else {
        throw new EmergencyError(
          `No ${recipient.preferredChannel} address available for recipient`,
          EmergencyErrorCode.VALIDATION_ERROR
        );
      }

      // Update notification record with result
      await this.updateNotificationRecord(notificationRecord.id, result);

      return result;

    } catch (error) {
      console.error('Error in sendEmergencyNotification:', error);
      
      const errorResult: NotificationResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        channel: recipient.preferredChannel,
        recipient: recipient.email || recipient.phone || 'unknown'
      };

      // Try to log the failed attempt
      try {
        const notificationRecord = await this.logNotificationAttempt(event.id, recipient);
        await this.updateNotificationRecord(notificationRecord.id, errorResult);
      } catch (logError) {
        console.error('Failed to log notification attempt:', logError);
      }

      return errorResult;
    }
  }

  /**
   * Send email notification using configured email service
   */
  private async sendEmailNotification(
    email: string, 
    content: EmergencyNotificationContent
  ): Promise<NotificationResult> {
    try {
      const emailPayload = {
        to: email,
        subject: `🚨 Emergency Alert - ${content.patientName}`,
        html: this.formatEmailContent(content),
        text: this.formatTextContent(content)
      };

      // Call Supabase Edge Function for email sending
      const { data, error } = await supabase.functions.invoke('send-emergency-email', {
        body: emailPayload
      });

      if (error) {
        console.error('Email service error:', error);
        return {
          success: false,
          error: `Email delivery failed: ${error.message}`,
          channel: 'email',
          recipient: email
        };
      }

      return {
        success: true,
        messageId: data?.messageId || 'email-sent',
        deliveredAt: new Date(),
        channel: 'email',
        recipient: email
      };

    } catch (error) {
      console.error('Error sending email notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email sending failed',
        channel: 'email',
        recipient: email
      };
    }
  }

  /**
   * Send SMS notification using configured SMS service
   */
  private async sendSmsNotification(
    phone: string, 
    content: EmergencyNotificationContent
  ): Promise<NotificationResult> {
    try {
      const smsPayload = {
        to: phone,
        message: this.formatSmsContent(content)
      };

      // Call Supabase Edge Function for SMS sending
      const { data, error } = await supabase.functions.invoke('send-emergency-sms', {
        body: smsPayload
      });

      if (error) {
        console.error('SMS service error:', error);
        return {
          success: false,
          error: `SMS delivery failed: ${error.message}`,
          channel: 'sms',
          recipient: phone
        };
      }

      return {
        success: true,
        messageId: data?.messageId || 'sms-sent',
        deliveredAt: new Date(),
        channel: 'sms',
        recipient: phone
      };

    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMS sending failed',
        channel: 'sms',
        recipient: phone
      };
    }
  }

  /**
   * Validate notification channel
   */
  validateNotificationChannel(channel: NotificationChannel): boolean {
    return ['email', 'sms'].includes(channel);
  }

  /**
   * Create notification content from emergency event data
   */
  private createNotificationContent(
    event: EmergencyEvent,
    patientInfo: any,
    vitals?: any
  ): EmergencyNotificationContent {
    const content: EmergencyNotificationContent = {
      patientName: patientInfo.full_name || 'Unknown Patient',
      patientContact: patientInfo.phone || patientInfo.email || 'No contact info',
      timestamp: new Date(event.triggered_at).toLocaleString(),
      disclaimer: '⚠️ IMPORTANT: This does not contact emergency services (911). If this is a life-threatening emergency, please call 911 immediately.'
    };

    // Add location if consented
    if (event.location_consented && event.location_lat && event.location_lng) {
      content.location = {
        latitude: event.location_lat,
        longitude: event.location_lng,
        timestamp: new Date(event.triggered_at)
      };
    }

    // Add vitals if available
    if (vitals) {
      content.vitals = {
        heartRate: vitals.heart_rate || undefined,
        bloodPressure: vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic 
          ? `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}` 
          : undefined,
        temperature: vitals.temperature || undefined,
        oxygenSaturation: vitals.oxygen_saturation || undefined
      };
    }

    return content;
  }

  /**
   * Format content for email notification
   */
  private formatEmailContent(content: EmergencyNotificationContent): string {
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY ALERT</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #dc2626; margin-top: 0;">Emergency Alert for ${content.patientName}</h2>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #333;">Patient Information</h3>
            <p><strong>Name:</strong> ${content.patientName}</p>
            <p><strong>Contact:</strong> ${content.patientContact}</p>
            <p><strong>Time:</strong> ${content.timestamp}</p>
          </div>
    `;

    // Add vitals if available
    if (content.vitals) {
      html += `
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #333;">Latest Vital Signs</h3>
      `;
      
      if (content.vitals.heartRate) {
        html += `<p><strong>Heart Rate:</strong> ${content.vitals.heartRate} bpm</p>`;
      }
      if (content.vitals.bloodPressure) {
        html += `<p><strong>Blood Pressure:</strong> ${content.vitals.bloodPressure} mmHg</p>`;
      }
      if (content.vitals.temperature) {
        html += `<p><strong>Temperature:</strong> ${content.vitals.temperature}°F</p>`;
      }
      if (content.vitals.oxygenSaturation) {
        html += `<p><strong>Oxygen Saturation:</strong> ${content.vitals.oxygenSaturation}%</p>`;
      }
      
      html += `</div>`;
    }

    // Add location if available
    if (content.location) {
      const mapsUrl = `https://maps.google.com/?q=${content.location.latitude},${content.location.longitude}`;
      html += `
        <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #333;">Location</h3>
          <p><strong>Coordinates:</strong> ${content.location.latitude.toFixed(6)}, ${content.location.longitude.toFixed(6)}</p>
          <p><a href="${mapsUrl}" target="_blank" style="color: #2563eb;">View on Google Maps</a></p>
        </div>
      `;
    }

    // Add disclaimer
    html += `
          <div style="background-color: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">${content.disclaimer}</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666;">
            <p>This message was sent by NeuralTrace Emergency System</p>
          </div>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Format content for text-based notifications (email fallback, SMS)
   */
  private formatTextContent(content: EmergencyNotificationContent): string {
    let text = `🚨 EMERGENCY ALERT\n\n`;
    text += `Patient: ${content.patientName}\n`;
    text += `Contact: ${content.patientContact}\n`;
    text += `Time: ${content.timestamp}\n\n`;

    if (content.vitals) {
      text += `VITAL SIGNS:\n`;
      if (content.vitals.heartRate) text += `Heart Rate: ${content.vitals.heartRate} bpm\n`;
      if (content.vitals.bloodPressure) text += `Blood Pressure: ${content.vitals.bloodPressure} mmHg\n`;
      if (content.vitals.temperature) text += `Temperature: ${content.vitals.temperature}°F\n`;
      if (content.vitals.oxygenSaturation) text += `Oxygen: ${content.vitals.oxygenSaturation}%\n`;
      text += `\n`;
    }

    if (content.location) {
      text += `LOCATION:\n`;
      text += `${content.location.latitude.toFixed(6)}, ${content.location.longitude.toFixed(6)}\n`;
      text += `Google Maps: https://maps.google.com/?q=${content.location.latitude},${content.location.longitude}\n\n`;
    }

    text += `${content.disclaimer}\n\n`;
    text += `- NeuralTrace Emergency System`;

    return text;
  }

  /**
   * Format content specifically for SMS (shorter)
   */
  private formatSmsContent(content: EmergencyNotificationContent): string {
    let sms = `🚨 EMERGENCY: ${content.patientName}\n`;
    sms += `Time: ${content.timestamp}\n`;
    sms += `Contact: ${content.patientContact}\n`;

    if (content.location) {
      sms += `Location: https://maps.google.com/?q=${content.location.latitude},${content.location.longitude}\n`;
    }

    sms += `\n⚠️ This does not contact 911. Call emergency services if needed.\n`;
    sms += `- NeuralTrace`;

    return sms;
  }

  /**
   * Get patient information for notification
   */
  private async getPatientInfo(patientId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', patientId)
        .single();

      if (error) {
        console.error('Error fetching patient info:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPatientInfo:', error);
      return null;
    }
  }

  /**
   * Get latest vitals for patient
   */
  private async getLatestVitals(patientId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('vitals')
        .select('*')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching vitals:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getLatestVitals:', error);
      return null;
    }
  }

  /**
   * Log notification attempt to database
   */
  private async logNotificationAttempt(
    eventId: string, 
    recipient: EmergencyContact
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('emergency_notifications')
        .insert({
          event_id: eventId,
          recipient_type: recipient.preferredChannel,
          recipient_address: recipient.preferredChannel === 'email' ? recipient.email! : recipient.phone!,
          channel: recipient.preferredChannel,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging notification attempt:', error);
        throw new EmergencyError(
          'Failed to log notification attempt',
          EmergencyErrorCode.DATABASE_ERROR,
          { originalError: error }
        );
      }

      return data;
    } catch (error) {
      console.error('Error in logNotificationAttempt:', error);
      throw error;
    }
  }

  /**
   * Update notification record with delivery result
   */
  private async updateNotificationRecord(
    notificationId: string, 
    result: NotificationResult
  ): Promise<void> {
    try {
      const updateData: any = {
        status: result.success ? 'sent' : 'failed',
        message_id: result.messageId || null,
        error_message: result.error || null,
        sent_at: result.deliveredAt ? result.deliveredAt.toISOString() : null
      };

      const { error } = await supabase
        .from('emergency_notifications')
        .update(updateData)
        .eq('id', notificationId);

      if (error) {
        console.error('Error updating notification record:', error);
        // Don't throw here as the notification may have been sent successfully
      }
    } catch (error) {
      console.error('Error in updateNotificationRecord:', error);
      // Don't throw here as the notification may have been sent successfully
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationServiceImpl();