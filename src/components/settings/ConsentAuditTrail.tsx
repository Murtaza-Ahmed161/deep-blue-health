import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Shield, Check, X, History } from "lucide-react";
import { useConsentAudit, ConsentType } from "@/hooks/useConsentAudit";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const CONSENT_LABELS: Record<ConsentType, { title: string; description: string }> = {
  device_data: {
    title: "Device Data Access",
    description: "Allow collection of vitals data from connected devices",
  },
  doctor_access: {
    title: "Doctor Access",
    description: "Allow assigned doctors to view your health data",
  },
  location: {
    title: "Location Services",
    description: "Enable location tracking for emergency services",
  },
  notifications: {
    title: "Push Notifications",
    description: "Receive alerts for critical health events",
  },
  data_sharing: {
    title: "Data Sharing",
    description: "Share anonymized data for research purposes",
  },
  terms_of_service: {
    title: "Terms of Service",
    description: "Agreement to the platform terms and conditions",
  },
  privacy_policy: {
    title: "Privacy Policy",
    description: "Acknowledgment of data privacy practices",
  },
};

const CONSENT_TYPES: ConsentType[] = [
  "device_data",
  "doctor_access",
  "location",
  "notifications",
  "data_sharing",
];

export const ConsentAuditTrail = () => {
  const { consents, loading, recordConsent, getCurrentConsent, exportConsentsAsCSV } = useConsentAudit();
  const [updating, setUpdating] = useState<ConsentType | null>(null);

  const handleConsentChange = async (consentType: ConsentType, granted: boolean) => {
    setUpdating(consentType);
    const { error } = await recordConsent(consentType, granted);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update consent preference",
        variant: "destructive",
      });
    } else {
      toast({
        title: granted ? "Consent Granted" : "Consent Revoked",
        description: `${CONSENT_LABELS[consentType].title} has been ${granted ? "enabled" : "disabled"}`,
      });
    }
    setUpdating(null);
  };

  const handleExport = () => {
    exportConsentsAsCSV();
    toast({
      title: "Export Complete",
      description: "Consent audit log has been downloaded",
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Consent Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Privacy & Consent Settings</CardTitle>
            </div>
          </div>
          <CardDescription>
            Manage your data sharing preferences. All changes are logged for compliance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CONSENT_TYPES.map((type) => {
            const currentValue = getCurrentConsent(type);
            const label = CONSENT_LABELS[type];
            
            return (
              <div key={type} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="space-y-0.5">
                  <Label htmlFor={type} className="text-base font-medium">
                    {label.title}
                  </Label>
                  <p className="text-sm text-muted-foreground">{label.description}</p>
                </div>
                <Switch
                  id={type}
                  checked={currentValue === true}
                  onCheckedChange={(checked) => handleConsentChange(type, checked)}
                  disabled={updating === type || loading}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Audit History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <CardTitle>Consent Audit History</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={consents.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <CardDescription>
            Complete log of all consent changes for HIPAA/GDPR compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading audit trail...</div>
            ) : consents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No consent records yet</div>
            ) : (
              <div className="space-y-3">
                {consents.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {record.granted ? (
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {CONSENT_LABELS[record.consent_type]?.title || record.consent_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(record.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={record.granted ? "default" : "secondary"}>
                      {record.granted ? "Granted" : "Revoked"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
