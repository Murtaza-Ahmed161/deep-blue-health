import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useSessionTracking = () => {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartRef = useRef<Date>(new Date());
  const pageViewsRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    const startSession = async () => {
      const deviceInfo = {
        device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent)
          ? "mobile"
          : "desktop",
        browser: navigator.userAgent,
      };

      const { data, error } = await supabase
        .from("user_sessions")
        .insert({
          user_id: user.id,
          ...deviceInfo,
          page_views: 1,
        })
        .select()
        .single();

      if (!error && data) {
        sessionIdRef.current = data.id;
        sessionStartRef.current = new Date();
      }
    };

    const endSession = async () => {
      if (!sessionIdRef.current) return;

      const sessionEnd = new Date();
      const durationSeconds = Math.floor(
        (sessionEnd.getTime() - sessionStartRef.current.getTime()) / 1000
      );

      await supabase
        .from("user_sessions")
        .update({
          session_end: sessionEnd.toISOString(),
          duration_seconds: durationSeconds,
          page_views: pageViewsRef.current,
        })
        .eq("id", sessionIdRef.current);
    };

    const trackPageView = () => {
      pageViewsRef.current += 1;
      
      if (sessionIdRef.current) {
        supabase
          .from("user_sessions")
          .update({ page_views: pageViewsRef.current })
          .eq("id", sessionIdRef.current);
      }
    };

    // Start session
    startSession();

    // Track page views on route changes
    window.addEventListener("popstate", trackPageView);

    // End session on page unload
    window.addEventListener("beforeunload", endSession);

    return () => {
      window.removeEventListener("popstate", trackPageView);
      window.removeEventListener("beforeunload", endSession);
      endSession();
    };
  }, [user]);
};

export const trackMetric = async (
  metricType: "connection_uptime" | "alert_triggered" | "ai_screening" | "api_error" | "page_load",
  metricValue: number,
  metadata?: Record<string, any>
) => {
  try {
    await supabase.from("system_metrics").insert({
      metric_type: metricType,
      metric_value: metricValue,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("Error tracking metric:", error);
  }
};