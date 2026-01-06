// Doctor System Types
// Patient-Doctor Assignment and Alert Management

import { Database } from '@/integrations/supabase/types';

// Database table types
export type PatientDoctorAssignment = Database['public']['Tables']['patient_doctor_assignments']['Row'];
export type PatientDoctorAssignmentInsert = Database['public']['Tables']['patient_doctor_assignments']['Insert'];
export type PatientDoctorAssignmentUpdate = Database['public']['Tables']['patient_doctor_assignments']['Update'];

export type AlertAcknowledgment = Database['public']['Tables']['alert_acknowledgments']['Row'];
export type AlertAcknowledgmentInsert = Database['public']['Tables']['alert_acknowledgments']['Insert'];
export type AlertAcknowledgmentUpdate = Database['public']['Tables']['alert_acknowledgments']['Update'];

// Assignment status types
export type AssignmentStatus = 'active' | 'inactive' | 'transferred';

// Enhanced patient interface for doctor view
export interface DoctorPatient {
  id: string;
  name: string;
  email: string;
  age: number | null;
  condition: string | null;
  status: 'normal' | 'warning' | 'critical';
  lastReading: string;
  assignedAt: string;
  assignmentStatus: AssignmentStatus;
  vitals: {
    heartRate: number | null;
    bloodPressure: string;
    temperature: number | null;
    oxygen: number | null;
  };
  // Assignment info
  assignmentId: string;
  assignedBy: string;
  assignmentNotes?: string;
}

// Enhanced alert interface with acknowledgment info
export interface DoctorAlert {
  id: string;
  patientId: string;
  patientName: string;
  message: string;
  severity: 'critical' | 'warning';
  time: string;
  vitalsId: string | null;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  acknowledgmentNotes?: string;
}

// Assignment management interfaces
export interface AssignPatientRequest {
  patientId: string;
  doctorId: string;
  assignedBy: string;
  notes?: string;
}

export interface UpdateAssignmentRequest {
  assignmentId: string;
  status?: AssignmentStatus;
  notes?: string;
}

export interface AcknowledgeAlertRequest {
  alertId: string;
  doctorId: string;
  notes?: string;
}

// Patient assignment service interface
export interface PatientAssignmentService {
  assignPatientToDoctor(request: AssignPatientRequest): Promise<PatientDoctorAssignment>;
  updateAssignment(request: UpdateAssignmentRequest): Promise<PatientDoctorAssignment>;
  getAssignedPatients(doctorId: string): Promise<DoctorPatient[]>;
  getDoctorAssignments(patientId: string): Promise<PatientDoctorAssignment[]>;
  transferPatient(patientId: string, fromDoctorId: string, toDoctorId: string, transferredBy: string): Promise<void>;
}

// Alert management service interface
export interface AlertManagementService {
  acknowledgeAlert(request: AcknowledgeAlertRequest): Promise<AlertAcknowledgment>;
  getAlertsForDoctor(doctorId: string): Promise<DoctorAlert[]>;
  getUnacknowledgedAlerts(doctorId: string): Promise<DoctorAlert[]>;
  getAlertHistory(patientId: string): Promise<DoctorAlert[]>;
}

// Doctor dashboard data aggregation
export interface DoctorDashboardData {
  totalPatients: number;
  activePatients: number;
  totalAlerts: number;
  criticalAlerts: number;
  patients: DoctorPatient[];
  alerts: DoctorAlert[];
  recentActivity: DoctorActivity[];
}

export interface DoctorActivity {
  id: string;
  type: 'assignment' | 'acknowledgment' | 'note' | 'consultation';
  description: string;
  patientName?: string;
  timestamp: string;
}

// Assignment management component props
export interface AssignPatientDialogProps {
  open: boolean;
  onClose: () => void;
  onAssign: (patientId: string, notes?: string) => Promise<void>;
  availablePatients: Array<{
    id: string;
    name: string;
    email: string;
    currentDoctor?: string;
  }>;
}

export interface PatientAssignmentManagerProps {
  doctorId: string;
  onAssignmentChange?: () => void;
}

export interface AssignmentHistoryProps {
  patientId: string;
  showTransfers?: boolean;
}

// Error types for assignment system
export class AssignmentError extends Error {
  constructor(
    message: string,
    public code: AssignmentErrorCode,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AssignmentError';
  }
}

export enum AssignmentErrorCode {
  PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND',
  DOCTOR_NOT_FOUND = 'DOCTOR_NOT_FOUND',
  ALREADY_ASSIGNED = 'ALREADY_ASSIGNED',
  ASSIGNMENT_NOT_FOUND = 'ASSIGNMENT_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

// UI state management
export interface DoctorDashboardState {
  patients: DoctorPatient[];
  alerts: DoctorAlert[];
  loading: boolean;
  error: string | null;
  selectedPatient: DoctorPatient | null;
  showAssignmentDialog: boolean;
  dashboardData: DoctorDashboardData | null;
}