export interface VitalsSummaryStat {
  avg: number | null;
  min: number | null;
  max: number | null;
  unit: string;
}

export interface DailyReportVitalsSummary {
  readingCount: number;
  heartRate: VitalsSummaryStat;
  bloodPressureSystolic: VitalsSummaryStat;
  bloodPressureDiastolic: VitalsSummaryStat;
  temperature: VitalsSummaryStat;
  oxygenSaturation: VitalsSummaryStat;
  respiratoryRate: VitalsSummaryStat;
}

export interface FlaggedEvent {
  time: string;
  severity: string;
  explanation: string;
  recommendations: string[];
}

export interface DailyReportReading {
  time: string;
  heartRate: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  temperature: number | null;
  oxygenSaturation: number | null;
  respiratoryRate: number | null;
}

export interface DailyReport {
  patientId: string;
  patientName: string;
  date: string;
  generatedAt: string;
  vitalsSummary: DailyReportVitalsSummary;
  flaggedEvents: FlaggedEvent[];
  recommendations: string[];
  readings: DailyReportReading[];
}
