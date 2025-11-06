/**
 * API Service Layer - Stubs for Backend Integration
 * 
 * These are mock implementations that simulate API responses.
 * Replace with actual backend calls when integrating real services.
 */

export interface VitalsStreamData {
  patientId: number;
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  temperature: number;
  oxygen: number;
  timestamp: string;
}

export interface Alert {
  id: string;
  patientId: number;
  type: 'critical' | 'warning';
  message: string;
  timestamp: string;
}

export interface PatientReport {
  patientId: number;
  date: string;
  vitalsSummary: {
    avgHeartRate: number;
    avgBloodPressure: string;
    avgTemperature: number;
    avgOxygen: number;
  };
  alerts: Alert[];
  aiNotes: string[];
  doctorNotes: string;
  reviewStatus: 'pending' | 'reviewed' | 'followup';
}

/**
 * POST /vitals/stream
 * Receives simulated vitals from monitoring devices
 */
export const streamVitals = async (data: VitalsStreamData): Promise<{ success: boolean }> => {
  // Mock implementation
  console.log('[API Stub] POST /vitals/stream', data);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return { success: true };
};

/**
 * POST /alerts/create
 * Creates a new alert for critical conditions
 */
export const createAlert = async (alert: Omit<Alert, 'id' | 'timestamp'>): Promise<Alert> => {
  console.log('[API Stub] POST /alerts/create', alert);
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    ...alert,
    id: `alert-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
};

/**
 * GET /patients/:id/report
 * Returns daily summary for a specific patient
 */
export const getPatientReport = async (patientId: number): Promise<PatientReport> => {
  console.log('[API Stub] GET /patients/:id/report', { patientId });
  
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Mock report data
  return {
    patientId,
    date: new Date().toISOString(),
    vitalsSummary: {
      avgHeartRate: 75,
      avgBloodPressure: '125/82',
      avgTemperature: 98.6,
      avgOxygen: 97,
    },
    alerts: [],
    aiNotes: [
      'Heart rate shows normal circadian variation',
      'Blood pressure stable throughout monitoring period',
      'No significant anomalies detected',
    ],
    doctorNotes: '',
    reviewStatus: 'pending',
  };
};

/**
 * PUT /patients/:id/notes
 * Updates doctor's notes for a patient
 */
export const updatePatientNotes = async (
  patientId: number,
  notes: string
): Promise<{ success: boolean }> => {
  console.log('[API Stub] PUT /patients/:id/notes', { patientId, notes });
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return { success: true };
};

/**
 * PUT /patients/:id/status
 * Updates patient review status
 */
export const updatePatientStatus = async (
  patientId: number,
  status: 'pending' | 'reviewed' | 'followup'
): Promise<{ success: boolean }> => {
  console.log('[API Stub] PUT /patients/:id/status', { patientId, status });
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return { success: true };
};
