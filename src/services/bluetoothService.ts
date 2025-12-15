// Bluetooth Service Abstraction for Wearable Devices
// This service provides an abstracted interface for connecting to wearable devices
// Currently simulated for MVP, designed for easy integration with real Bluetooth APIs

export interface WearableVitals {
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  oxygenSaturation: number;
  temperature?: number;
  respiratoryRate?: number;
  timestamp: Date;
}

export interface WearableDevice {
  id: string;
  name: string;
  type: 'smartwatch' | 'fitness_tracker' | 'medical_device';
  manufacturer: string;
  connected: boolean;
  batteryLevel?: number;
  lastSync?: Date;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

type VitalsCallback = (vitals: WearableVitals) => void;
type StatusCallback = (status: ConnectionStatus) => void;
type DeviceCallback = (device: WearableDevice | null) => void;

class BluetoothService {
  private status: ConnectionStatus = 'disconnected';
  private connectedDevice: WearableDevice | null = null;
  private vitalsInterval: ReturnType<typeof setInterval> | null = null;
  private vitalsCallbacks: VitalsCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private deviceCallbacks: DeviceCallback[] = [];

  // Simulate available devices for scanning
  private mockDevices: WearableDevice[] = [
    {
      id: 'google-fit-001',
      name: 'Google Fit (Pixel Watch)',
      type: 'smartwatch',
      manufacturer: 'Google',
      connected: false,
      batteryLevel: 85,
    },
    {
      id: 'apple-health-001',
      name: 'Apple Watch Series 9',
      type: 'smartwatch',
      manufacturer: 'Apple',
      connected: false,
      batteryLevel: 72,
    },
    {
      id: 'fitbit-001',
      name: 'Fitbit Charge 5',
      type: 'fitness_tracker',
      manufacturer: 'Fitbit',
      connected: false,
      batteryLevel: 91,
    },
    {
      id: 'garmin-001',
      name: 'Garmin Venu 2',
      type: 'fitness_tracker',
      manufacturer: 'Garmin',
      connected: false,
      batteryLevel: 68,
    },
  ];

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getConnectedDevice(): WearableDevice | null {
    return this.connectedDevice;
  }

  async scanForDevices(): Promise<WearableDevice[]> {
    // Simulate Bluetooth scanning delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return this.mockDevices;
  }

  async connect(deviceId: string): Promise<boolean> {
    this.updateStatus('connecting');
    
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const device = this.mockDevices.find(d => d.id === deviceId);
    if (!device) {
      this.updateStatus('error');
      return false;
    }

    this.connectedDevice = { ...device, connected: true, lastSync: new Date() };
    this.updateDevice(this.connectedDevice);
    this.updateStatus('connected');
    
    // Start simulated vitals streaming
    this.startVitalsStream();
    
    return true;
  }

  async disconnect(): Promise<void> {
    this.stopVitalsStream();
    this.connectedDevice = null;
    this.updateDevice(null);
    this.updateStatus('disconnected');
  }

  private startVitalsStream(): void {
    // Stream vitals every 5 seconds (simulated)
    this.vitalsInterval = setInterval(() => {
      const vitals = this.generateMockVitals();
      this.vitalsCallbacks.forEach(cb => cb(vitals));
    }, 5000);
  }

  private stopVitalsStream(): void {
    if (this.vitalsInterval) {
      clearInterval(this.vitalsInterval);
      this.vitalsInterval = null;
    }
  }

  private generateMockVitals(): WearableVitals {
    // Generate realistic vitals with slight variations
    const baseHR = 70 + Math.random() * 20;
    const baseSystolic = 115 + Math.random() * 15;
    const baseDiastolic = 75 + Math.random() * 10;
    const baseO2 = 96 + Math.random() * 3;
    const baseTemp = 97.5 + Math.random() * 1.5;
    const baseRR = 14 + Math.random() * 4;

    return {
      heartRate: Math.round(baseHR),
      bloodPressureSystolic: Math.round(baseSystolic),
      bloodPressureDiastolic: Math.round(baseDiastolic),
      oxygenSaturation: Math.round(baseO2),
      temperature: +baseTemp.toFixed(1),
      respiratoryRate: Math.round(baseRR),
      timestamp: new Date(),
    };
  }

  onVitals(callback: VitalsCallback): () => void {
    this.vitalsCallbacks.push(callback);
    return () => {
      this.vitalsCallbacks = this.vitalsCallbacks.filter(cb => cb !== callback);
    };
  }

  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  onDeviceChange(callback: DeviceCallback): () => void {
    this.deviceCallbacks.push(callback);
    return () => {
      this.deviceCallbacks = this.deviceCallbacks.filter(cb => cb !== callback);
    };
  }

  private updateStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusCallbacks.forEach(cb => cb(status));
  }

  private updateDevice(device: WearableDevice | null): void {
    this.deviceCallbacks.forEach(cb => cb(device));
  }
}

// Singleton instance
export const bluetoothService = new BluetoothService();
