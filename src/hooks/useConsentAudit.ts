import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type ConsentType = 
  | "device_data" 
  | "doctor_access" 
  | "location" 
  | "notifications" 
  | "data_sharing" 
  | "terms_of_service" 
  | "privacy_policy";

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  granted: boolean;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export const useConsentAudit = () => {
  const { user } = useAuth();
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConsents = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("consent_audit")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setConsents(data as ConsentRecord[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  const recordConsent = async (
    consentType: ConsentType,
    granted: boolean,
    metadata?: Record<string, any>
  ) => {
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase.from("consent_audit").insert({
      user_id: user.id,
      consent_type: consentType,
      granted,
      user_agent: navigator.userAgent,
      metadata: metadata || {},
    });

    if (!error) {
      await fetchConsents();
    }

    return { error };
  };

  const getCurrentConsent = (consentType: ConsentType): boolean | null => {
    const latestConsent = consents.find((c) => c.consent_type === consentType);
    return latestConsent?.granted ?? null;
  };

  const exportConsentsAsCSV = () => {
    const headers = [
      "ID",
      "Consent Type",
      "Granted",
      "Date",
      "User Agent",
    ];
    
    const rows = consents.map((c) => [
      c.id,
      c.consent_type,
      c.granted ? "Yes" : "No",
      new Date(c.created_at).toISOString(),
      c.user_agent || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `consent_audit_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return {
    consents,
    loading,
    recordConsent,
    getCurrentConsent,
    exportConsentsAsCSV,
    refetch: fetchConsents,
  };
};
