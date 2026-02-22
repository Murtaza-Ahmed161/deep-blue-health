import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, Square, Activity, TrendingUp, AlertTriangle } from "lucide-react";

interface DemoModeControlProps {
  isActive: boolean;
  updateCount: number;
  scenario: 'normal' | 'warning' | 'critical';
  onToggle: () => void;
}

const DemoModeControl = ({ isActive, updateCount, scenario, onToggle }: DemoModeControlProps) => {
  const getScenarioColor = (scenario: string) => {
    switch (scenario) {
      case 'normal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getScenarioIcon = (scenario: string) => {
    switch (scenario) {
      case 'normal': return Activity;
      case 'warning': return TrendingUp;
      case 'critical': return AlertTriangle;
      default: return Activity;
    }
  };

  const ScenarioIcon = getScenarioIcon(scenario);

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Activity className="h-5 w-5" />
              Demo Mode
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Simulate live vitals monitoring for demonstration
            </CardDescription>
          </div>
          {isActive && (
            <Badge variant="default" className="animate-pulse">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle Control */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <Switch
              id="demo-mode"
              checked={isActive}
              onCheckedChange={onToggle}
            />
            <Label htmlFor="demo-mode" className="cursor-pointer">
              <span className="font-medium">
                {isActive ? 'Demo Mode Active' : 'Enable Demo Mode'}
              </span>
            </Label>
          </div>
          <Button
            variant={isActive ? "destructive" : "default"}
            size="sm"
            onClick={onToggle}
          >
            {isActive ? (
              <>
                <Square className="mr-2 h-4 w-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start
              </>
            )}
          </Button>
        </div>

        {/* Status Information */}
        {isActive && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-muted-foreground mb-1">Updates</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {updateCount}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-muted-foreground mb-1">Scenario</p>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${getScenarioColor(scenario)}`} />
                  <p className="text-sm font-semibold capitalize text-blue-900 dark:text-blue-100">
                    {scenario}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-2">
                <ScenarioIcon className="h-4 w-4 text-yellow-700 dark:text-yellow-300 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-yellow-900 dark:text-yellow-100">
                    Demo Mode Information
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Vitals update every 10 seconds. AI screening runs automatically. 
                    Scenario cycles: Normal → Warning → Critical.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions when inactive */}
        {!isActive && (
          <div className="p-3 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Demo Mode</strong> simulates live vitals monitoring. 
              Enable it to see automatic vitals updates, AI screening, and real-time alerts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DemoModeControl;
