// Emergency Escalation System Types
// Phase 2: Real Emergency Escalation Implementation

import { Database } from '@/integrations/supabase/types';

// Database table types
export type EmergencyEvent = Database['public']['Tables']['emergency_events']['Row'];
export type EmergencyEventInsert = Database['public']['Tables']['emergency_events']['Insert'];
export type EmergencyEventUpdate = Database['public']['Tables']['emergency_events']['Update'];

export type EmergencyNotification = Database['public']['Tables']['emergency_notifications']['Row'];
export type EmergencyNotificationInsert = Database['public']['Tables']['emergency_notifications']['Insert'];
export type EmergencyNotificationUpdate = Database['public']['Tables']['emergency_notifications']['Update'];

// Emergency system enums
export type EmergencyStatus = 'pending' | 'sent' | 'failed';
export type NotificationChannel = 'email' | 'sms';
export type NotificationStatus = 'pending' | 'sent' | 'failed';

// Core interfaces for emergency system components
export interface EmergencyController {
  triggerEmergency(patientId: string): Promise<EmergencyResult>;
  getEmergencyHistory(patientId: string): Promise<EmergencyEvent[]>;
}

export interface ConsentManager {
  requestLocationConsent(patientId: string): Promise<ConsentResult>;
  logConsentDecision(
    patientId: string, 
    consentType: 'location', 
    granted: boolean,
    metadata?: Record<string, any>
  ): Promise<string>; // Return consent ID for tracking
}

export interface NotificationService {
  sendEmergencyNotification(
    event: EmergencyEvent, 
    recipient: EmergencyContact
  ): Promise<NotificationResult>;
  validateNotificationChannel(channel: NotificationChannel): boolean;
}

// Result types
export interface EmergencyResult {
  success: boolean;
  eventId: string;
  message: string;
  notificationStatus: NotificationStatus;
  error?: string;
}

export interface ConsentResult {
  granted: boolean;
  location?: GeolocationCoordinates;
  consentId: string;
  error?: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt?: Date;
  channel: NotificationChannel;
  recipient: string;
}

// Emergency contact information
export interface EmergencyContact {
  name: string;
  email?: string;
  phone?: string;
  preferredChannel: NotificationChannel;
}

// Location data structure
export interface EmergencyLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
}

// Emergency notification content
export interface EmergencyNotificationContent {
  patientName: string;
  patientContact: string;
  timestamp: string;
  location?: EmergencyLocation;
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    temperature?: number;
    oxygenSaturation?: number;
  };
  disclaimer: string;
}

// Error types for emergency system
export class EmergencyError extends Error {
  constructor(
    message: string,
    public code: EmergencyErrorCode,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'EmergencyError';
  }
}

export enum EmergencyErrorCode {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_PATIENT_ID = 'INVALID_PATIENT_ID',
  MISSING_EMERGENCY_CONTACT = 'MISSING_EMERGENCY_CONTACT',
  LOCATION_PERMISSION_DENIED = 'LOCATION_PERMISSION_DENIED',
  NOTIFICATION_SERVICE_UNAVAILABLE = 'NOTIFICATION_SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

// UI component props
export interface EmergencyButtonProps {
  patientId: string;
  disabled?: boolean;
  onEmergencyTriggered?: (result: EmergencyResult) => void;
  className?: string;
}

export interface EmergencyFeedbackProps {
  result: EmergencyResult;
  onClose: () => void;
  onRetry?: () => void;
}

export interface LocationConsentDialogProps {
  open: boolean;
  onConsentDecision: (granted: boolean) => void;
  patientName: string;
}

// Utility types for emergency system state
export interface EmergencySystemState {
  isProcessing: boolean;
  currentEvent?: EmergencyEvent;
  lastResult?: EmergencyResult;
  error?: EmergencyError;
}

// Configuration types
export interface EmergencySystemConfig {
  emailService: {
    provider: 'resend' | 'sendgrid' | 'ses';
    apiKey: string;
    fromAddress: string;
    fromName: string;
  };
  smsService: {
    provider: 'twilio' | 'aws-sns';
    apiKey: string;
    apiSecret?: string;
    fromNumber: string;
  };
  locationTimeout: number; // milliseconds
  notificationTimeout: number; // milliseconds
  retryAttempts: number;
}