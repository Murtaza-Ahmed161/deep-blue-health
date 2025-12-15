import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bluetooth, BluetoothConnected, BluetoothSearching, Watch, Loader2 } from 'lucide-react';
import { bluetoothService, WearableDevice, ConnectionStatus } from '@/services/bluetoothService';

interface WearableConnectionProps {
  connectionStatus: ConnectionStatus;
  connectedDevice: WearableDevice | null;
  onConnect: (deviceId: string) => Promise<boolean>;
  onDisconnect: () => Promise<void>;
}

const WearableConnection = ({
  connectionStatus,
  connectedDevice,
  onConnect,
  onDisconnect,
}: WearableConnectionProps) => {
  const [showDeviceDialog, setShowDeviceDialog] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<WearableDevice[]>([]);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);

  const handleScanDevices = async () => {
    setScanning(true);
    const devices = await bluetoothService.scanForDevices();
    setAvailableDevices(devices);
    setScanning(false);
  };

  const handleConnect = async (deviceId: string) => {
    setConnectingDeviceId(deviceId);
    const success = await onConnect(deviceId);
    if (success) {
      setShowDeviceDialog(false);
    }
    setConnectingDeviceId(null);
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <BluetoothConnected className="h-5 w-5 text-success" />;
      case 'connecting':
        return <BluetoothSearching className="h-5 w-5 text-primary animate-pulse" />;
      default:
        return <Bluetooth className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="success">Connected</Badge>;
      case 'connecting':
        return <Badge variant="secondary">Connecting...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Not Connected</Badge>;
    }
  };

  useEffect(() => {
    if (showDeviceDialog && availableDevices.length === 0) {
      handleScanDevices();
    }
  }, [showDeviceDialog]);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <CardTitle className="text-lg">Wearable Device</CardTitle>
            </div>
            {getStatusBadge()}
          </div>
          <CardDescription>
            {connectedDevice
              ? `${connectedDevice.name} • Last sync: ${connectedDevice.lastSync?.toLocaleTimeString() || 'Never'}`
              : 'Connect a Bluetooth wearable for automatic vitals'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectedDevice ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <Watch className="h-8 w-8 text-success" />
                <div className="flex-1">
                  <p className="font-medium">{connectedDevice.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {connectedDevice.manufacturer} • Battery: {connectedDevice.batteryLevel}%
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowDeviceDialog(true)}
                >
                  Switch Device
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={onDisconnect}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="w-full gap-2"
              onClick={() => setShowDeviceDialog(true)}
            >
              <Bluetooth className="h-4 w-4" />
              Connect Device
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDeviceDialog} onOpenChange={setShowDeviceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bluetooth className="h-5 w-5" />
              Connect Wearable Device
            </DialogTitle>
            <DialogDescription>
              Select a device from the list below to start automatic vitals syncing.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {scanning ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <BluetoothSearching className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-sm text-muted-foreground">Scanning for devices...</p>
              </div>
            ) : availableDevices.length > 0 ? (
              <div className="space-y-2">
                {availableDevices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => handleConnect(device.id)}
                    disabled={connectingDeviceId !== null}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Watch className="h-8 w-8 text-primary" />
                    <div className="flex-1 text-left">
                      <p className="font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {device.manufacturer} • {device.type.replace('_', ' ')}
                      </p>
                    </div>
                    {connectingDeviceId === device.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <Badge variant="outline">
                        {device.batteryLevel}%
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No devices found</p>
                <Button variant="outline" onClick={handleScanDevices}>
                  Scan Again
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={handleScanDevices} disabled={scanning}>
              {scanning ? 'Scanning...' : 'Refresh'}
            </Button>
            <Button variant="outline" onClick={() => setShowDeviceDialog(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WearableConnection;
