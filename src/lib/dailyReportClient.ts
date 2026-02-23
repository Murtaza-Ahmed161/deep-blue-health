import type { Database } from '@/integrations/supabase/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DailyReport } from '@/types/dailyReport';

type TypedSupabase = SupabaseClient<Database>;

function getDayBounds(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  const start = d.toISOString();
  d.setUTCDate(d.getUTCDate() + 1);
  const end = d.toISOString();
  return { start, end };
}

function avg(arr: (number | null)[]): number | null {
  const valid = arr.filter((x): x is number => x != null && !Number.isNaN(x));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function min(arr: (number | null)[]): number | null {
  const valid = arr.filter((x): x is number => x != null && !Number.isNaN(x));
  if (valid.length === 0) return null;
  return Math.min(...valid);
}

function max(arr: (number | null)[]): number | null {
  const valid = arr.filter((x): x is number => x != null && !Number.isNaN(x));
  if (valid.length === 0) return null;
  return Math.max(...valid);
}

/**
 * Build daily report from Supabase data (client-side fallback when Edge Function is unavailable).
 * RLS applies: patients can only load their own data; doctors can load assigned patients.
 */
export async function buildDailyReportClientSide(
  supabase: TypedSupabase,
  targetPatientId: string,
  dateStr: string
): Promise<DailyReport> {
  const { start: dayStart, end: dayEnd } = getDayBounds(dateStr);

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', targetPatientId)
    .single();

  const { data: vitals, error: vitalsError } = await supabase
    .from('vitals')
    .select('*')
    .eq('user_id', targetPatientId)
    .gte('created_at', dayStart)
    .lt('created_at', dayEnd)
    .order('created_at', { ascending: true });

  if (vitalsError) throw vitalsError;
  const vitalsList = vitals || [];
  const vitalsIds = vitalsList.map((v) => v.id);

  let screenings: Array<{
    severity: string;
    explanation: string;
    recommendations: string[] | null;
    created_at: string;
    anomaly_detected: boolean;
  }> = [];
  if (vitalsIds.length > 0) {
    const { data: screeningRows } = await supabase
      .from('ai_screening_results')
      .select('severity, explanation, recommendations, created_at, anomaly_detected')
      .eq('user_id', targetPatientId)
      .in('vitals_id', vitalsIds)
      .order('created_at', { ascending: true });
    screenings = screeningRows || [];
  }

  const hr = vitalsList.map((v) => v.heart_rate);
  const sys = vitalsList.map((v) => v.blood_pressure_systolic);
  const dia = vitalsList.map((v) => v.blood_pressure_diastolic);
  const temp = vitalsList.map((v) => v.temperature);
  const o2 = vitalsList.map((v) => v.oxygen_saturation);
  const resp = vitalsList.map((v) => v.respiratory_rate);

  const flaggedEvents = screenings
    .filter((s) => s.anomaly_detected || s.severity !== 'normal')
    .map((s) => ({
      time: s.created_at,
      severity: s.severity,
      explanation: s.explanation,
      recommendations: s.recommendations || [],
    }));

  const allRecommendations = Array.from(
    new Set(screenings.flatMap((s) => (s.recommendations || []).filter(Boolean)))
  );

  return {
    patientId: targetPatientId,
    patientName: profile?.full_name || 'Patient',
    date: dateStr,
    generatedAt: new Date().toISOString(),
    vitalsSummary: {
      readingCount: vitalsList.length,
      heartRate: { avg: avg(hr), min: min(hr), max: max(hr), unit: 'bpm' },
      bloodPressureSystolic: { avg: avg(sys), min: min(sys), max: max(sys), unit: 'mmHg' },
      bloodPressureDiastolic: { avg: avg(dia), min: min(dia), max: max(dia), unit: 'mmHg' },
      temperature: { avg: avg(temp), min: min(temp), max: max(temp), unit: '°C' },
      oxygenSaturation: { avg: avg(o2), min: min(o2), max: max(o2), unit: '%' },
      respiratoryRate: { avg: avg(resp), min: min(resp), max: max(resp), unit: '/min' },
    },
    flaggedEvents,
    recommendations: allRecommendations,
    readings: vitalsList.map((v) => ({
      time: v.created_at,
      heartRate: v.heart_rate,
      bloodPressureSystolic: v.blood_pressure_systolic,
      bloodPressureDiastolic: v.blood_pressure_diastolic,
      temperature: v.temperature,
      oxygenSaturation: v.oxygen_saturation,
      respiratoryRate: v.respiratory_rate,
    })),
  };
}
