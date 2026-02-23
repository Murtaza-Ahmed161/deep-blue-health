import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: { patientId?: string; date?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const requestedPatientId = body.patientId as string | undefined;
    const dateStr = body.date || new Date().toISOString().slice(0, 10);
    const { start: dayStart, end: dayEnd } = getDayBounds(dateStr);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetPatientId: string;
    if (requestedPatientId) {
      if (requestedPatientId === user.id) {
        targetPatientId = user.id;
      } else {
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'doctor')
          .maybeSingle();
        if (!roleRow) {
          return new Response(
            JSON.stringify({ error: 'Not authorized to view this patient report' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const { data: assignment } = await supabase
          .from('patient_doctor_assignments')
          .select('id')
          .eq('patient_id', requestedPatientId)
          .eq('doctor_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        if (!assignment) {
          return new Response(
            JSON.stringify({ error: 'Not authorized to view this patient report' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        targetPatientId = requestedPatientId;
      }
    } else {
      targetPatientId = user.id;
    }

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

    if (vitalsError) {
      console.error('Vitals fetch error:', vitalsError);
      throw vitalsError;
    }

    const vitalsList = vitals || [];
    const vitalsIds = vitalsList.map((v: { id: string }) => v.id);
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

    const hr = vitalsList.map((v: { heart_rate: number | null }) => v.heart_rate);
    const sys = vitalsList.map((v: { blood_pressure_systolic: number | null }) => v.blood_pressure_systolic);
    const dia = vitalsList.map((v: { blood_pressure_diastolic: number | null }) => v.blood_pressure_diastolic);
    const temp = vitalsList.map((v: { temperature: number | null }) => v.temperature);
    const o2 = vitalsList.map((v: { oxygen_saturation: number | null }) => v.oxygen_saturation);
    const resp = vitalsList.map((v: { respiratory_rate: number | null }) => v.respiratory_rate);

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

    const report = {
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
      readings: vitalsList.map((v: {
        created_at: string;
        heart_rate: number | null;
        blood_pressure_systolic: number | null;
        blood_pressure_diastolic: number | null;
        temperature: number | null;
        oxygen_saturation: number | null;
        respiratory_rate: number | null;
      }) => ({
        time: v.created_at,
        heartRate: v.heart_rate,
        bloodPressureSystolic: v.blood_pressure_systolic,
        bloodPressureDiastolic: v.blood_pressure_diastolic,
        temperature: v.temperature,
        oxygenSaturation: v.oxygen_saturation,
        respiratoryRate: v.respiratory_rate,
      })),
    };

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in generate-daily-report:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
