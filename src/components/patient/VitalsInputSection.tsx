import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Heart, Activity, Thermometer, Droplet, Edit3, Bluetooth } from 'lucide-react';
import ManualVitalsEntry from './ManualVitalsEntry';
import WearableConnection from './WearableConnection';
import { VitalsRecord, ManualVitalsInput } from '@/hooks/useVitals';
import { WearableDevice, ConnectionStatus } from '@/services/bluetoothService';

interface VitalsInputSectionProps {
  currentVitals: VitalsRecord | null;
  saving: boolean;
  onSaveManualVitals: (vitals: ManualVitalsInput) => Promise<boolean>;
  connectionStatus: ConnectionStatus;
  connectedDevice: WearableDevice | null;
  onConnectDevice: (deviceId: string) => Promise<boolean>;
  onDisconnectDevice: () => Promise<void>;
}

const VitalsInputSection = ({
  currentVitals,
  saving,
  onSaveManualVitals,
  connectionStatus,
  connectedDevice,
  onConnectDevice,
  onDisconnectDevice,
}: VitalsInputSectionProps) => {
  const defaultTab = connectedDevice ? 'wearable' : 'manual';

  return (
    <div className="space-y-4">
      {/* Current Vitals Display */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Vitals</CardTitle>
              <CardDescription>
                {currentVitals ? (
                  <span className="flex items-center gap-2">
                    {currentVitals.source === 'manual' ? (
                      <>
                        <Edit3 className="h-3 w-3" />
                        Manually Entered
                      </>
                    ) : (
                      <>
                        <Bluetooth className="h-3 w-3" />
                        From Wearable
                      </>
                    )}
                    {' • '}
                    {currentVitals.createdAt.toLocaleTimeString()}
                  </span>
                ) : (
                  'No vitals recorded yet'
                )}
              </CardDescription>
            </div>
            {currentVitals && (
              <Badge variant={currentVitals.source === 'manual' ? 'outline' : 'secondary'}>
                {currentVitals.source === 'manual' ? 'Manual' : 'Wearable'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted touch-target">
              <Heart className="h-8 w-8 text-destructive mb-2" />
              <p className="text-2xl font-bold">
                {currentVitals?.heartRate ?? '--'}
              </p>
              <p className="text-xs text-muted-foreground">bpm</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted touch-target">
              <Activity className="h-8 w-8 text-primary mb-2" />
              <p className="text-2xl font-bold">
                {currentVitals?.bloodPressureSystolic && currentVitals?.bloodPressureDiastolic
                  ? `${currentVitals.bloodPressureSystolic}/${currentVitals.bloodPressureDiastolic}`
                  : '--/--'}
              </p>
              <p className="text-xs text-muted-foreground">mmHg</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted touch-target">
              <Thermometer className="h-8 w-8 text-warning mb-2" />
              <p className="text-2xl font-bold">
                {currentVitals?.temperature ?? '--'}
              </p>
              <p className="text-xs text-muted-foreground">°F</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg bg-muted touch-target">
              <Droplet className="h-8 w-8 text-secondary mb-2" />
              <p className="text-2xl font-bold">
                {currentVitals?.oxygenSaturation ?? '--'}
              </p>
              <p className="text-xs text-muted-foreground">%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Mode Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="wearable" className="flex items-center gap-2">
            <Bluetooth className="h-4 w-4" />
            Connect Wearable
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Manual Vitals Entry</CardTitle>
              <CardDescription>
                Enter your vitals manually at any time. Data will be synced with your health timeline and analyzed by AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManualVitalsEntry onSubmit={onSaveManualVitals} saving={saving} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wearable" className="mt-4">
          <WearableConnection
            connectionStatus={connectionStatus}
            connectedDevice={connectedDevice}
            onConnect={onConnectDevice}
            onDisconnect={onDisconnectDevice}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VitalsInputSection;
