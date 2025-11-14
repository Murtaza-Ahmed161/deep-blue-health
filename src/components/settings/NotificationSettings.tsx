import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Mail } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Skeleton } from "@/components/ui/skeleton";

const NotificationSettings = () => {
  const { preferences, permission, loading, requestPermission, updatePreferences } = useNotifications();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage how you receive alerts and updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="push-enabled" className="text-base">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive browser notifications for important events
              </p>
            </div>
            <div className="flex items-center gap-2">
              {permission !== 'granted' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={requestPermission}
                >
                  Enable
                </Button>
              )}
              <Switch
                id="push-enabled"
                checked={preferences?.push_enabled || false}
                onCheckedChange={(checked) => updatePreferences({ push_enabled: checked })}
                disabled={permission !== 'granted'}
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-4">
          <h4 className="font-medium">Notification Types</h4>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="critical-alerts" className="text-base">Critical Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Emergency vitals and critical health warnings
              </p>
            </div>
            <Switch
              id="critical-alerts"
              checked={preferences?.critical_alerts || false}
              onCheckedChange={(checked) => updatePreferences({ critical_alerts: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="vitals-warnings" className="text-base">Vitals Warnings</Label>
              <p className="text-sm text-muted-foreground">
                Abnormal vital sign readings
              </p>
            </div>
            <Switch
              id="vitals-warnings"
              checked={preferences?.vitals_warnings || false}
              onCheckedChange={(checked) => updatePreferences({ vitals_warnings: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="new-reports" className="text-base">New Reports</Label>
              <p className="text-sm text-muted-foreground">
                When medical reports are processed
              </p>
            </div>
            <Switch
              id="new-reports"
              checked={preferences?.new_reports || false}
              onCheckedChange={(checked) => updatePreferences({ new_reports: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="doctor-messages" className="text-base">Doctor Messages</Label>
              <p className="text-sm text-muted-foreground">
                Messages from your healthcare provider
              </p>
            </div>
            <Switch
              id="doctor-messages"
              checked={preferences?.doctor_messages || false}
              onCheckedChange={(checked) => updatePreferences({ doctor_messages: checked })}
            />
          </div>
        </div>

        {/* Email Notifications */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="email-enabled" className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive email summaries of important events
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={preferences?.email_enabled || false}
              onCheckedChange={(checked) => updatePreferences({ email_enabled: checked })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
