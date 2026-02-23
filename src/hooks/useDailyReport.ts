import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DailyReport } from '@/types/dailyReport';
import { buildDailyReportClientSide } from '@/lib/dailyReportClient';

export function useDailyReport(patientId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(
    async (date?: string): Promise<DailyReport | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Not authenticated');
          return null;
        }
        const dateStr = date || new Date().toISOString().slice(0, 10);
        const targetPatientId = patientId ?? session.user.id;

        // Try Edge Function first
        try {
          const res = await supabase.functions.invoke('generate-daily-report', {
            body: {
              ...(patientId && { patientId }),
              ...(date && { date }),
            },
          });
          if (!res.error && typeof res.data === 'object' && res.data !== null && 'patientId' in res.data) {
            return res.data as DailyReport;
          }
          if (res.error) {
            console.warn('Edge function generate-daily-report failed, using client-side fallback:', res.error.message);
          }
        } catch (invokeErr) {
          console.warn('Edge function invoke failed, using client-side fallback:', invokeErr);
        }

        // Fallback: build report client-side (works when Edge Function is not deployed or request fails)
        const report = await buildDailyReportClientSide(supabase, targetPatientId, dateStr);
        return report;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to generate report';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [patientId]
  );

  return { fetchReport, loading, error };
}
