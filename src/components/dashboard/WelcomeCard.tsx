import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Pill, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface WelcomeCardProps {
  latestVitals?: {
    heartRate?: number;
    oxygenSaturation?: number;
  };
  medicationsTakenToday?: number;
  totalMedications?: number;
}

const WelcomeCard = ({ latestVitals, medicationsTakenToday = 0, totalMedications = 0 }: WelcomeCardProps) => {
  const { profile } = useAuth();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getHealthStatus = () => {
    if (!latestVitals?.heartRate) return { status: "No data", color: "secondary" };
    
    const hr = latestVitals.heartRate;
    const o2 = latestVitals.oxygenSaturation || 100;
    
    if (hr > 100 || o2 < 95) return { status: "Needs attention", color: "destructive" };
    if (hr > 90 || o2 < 97) return { status: "Monitor closely", color: "warning" };
    return { status: "Looking good", color: "default" };
  };

  const healthStatus = getHealthStatus();

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20 animate-fade-in">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Greeting */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1">
              {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
            </h2>
            <p className="text-sm text-muted-foreground">
              Here's your health summary for today
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-3">
            {/* Health Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50">
              <Activity className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={healthStatus.color as any} className="text-xs">
                  {healthStatus.status}
                </Badge>
              </div>
            </div>

            {/* Latest Heart Rate */}
            {latestVitals?.heartRate && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50">
                <Heart className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-xs text-muted-foreground">Heart Rate</p>
                  <p className="text-sm font-bold">{latestVitals.heartRate} bpm</p>
                </div>
              </div>
            )}

            {/* Medications */}
            {totalMedications > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50">
                <Pill className="h-4 w-4 text-secondary" />
                <div>
                  <p className="text-xs text-muted-foreground">Medications</p>
                  <p className="text-sm font-bold">
                    {medicationsTakenToday}/{totalMedications} taken
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;
