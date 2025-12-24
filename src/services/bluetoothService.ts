// Bluetooth Service Abstraction for Wearable Devices
// 
// ⚠️ MEDICAL SAFETY: Mock mode is DISABLED by default
// This service will NOT generate fake vitals or simulate device connections.
// Real Bluetooth integration must be implemented before use in production.
//
// TODO: Implement real Bluetooth API integration (Web Bluetooth API or native bridge)

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

// CRITICAL: Mock mode flag - MUST be false in production
const MOCK_MODE = false;

class BluetoothService {
  private status: ConnectionStatus = 'disconnected';
  private connectedDevice: WearableDevice | null = null;
  private vitalsInterval: ReturnType<typeof setInterval> | null = null;
  private vitalsCallbacks: VitalsCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private deviceCallbacks: DeviceCallback[] = [];

  // Mock devices - ONLY used if MOCK_MODE is true (disabled by default)
  private mockDevices: WearableDevice[] = [];

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getConnectedDevice(): WearableDevice | null {
    return this.connectedDevice;
  }

  async scanForDevices(): Promise<WearableDevice[]> {
    if (MOCK_MODE) {
      // MOCK MODE DISABLED - This should never execute in production
      console.warn('⚠️ WARNING: Mock mode is disabled. Bluetooth scanning not available.');
      throw new Error('Bluetooth service not configured. Real device integration required.');
    }
    
    // TODO: Implement real Bluetooth scanning using Web Bluetooth API
    // Example: navigator.bluetooth.requestDevice({ filters: [...] })
    throw new Error('Bluetooth scanning not yet implemented. Real device integration required.');
  }

  async connect(deviceId: string): Promise<boolean> {
    if (MOCK_MODE) {
      // MOCK MODE DISABLED - This should never execute in production
      console.warn('⚠️ WARNING: Mock mode is disabled. Device connection not available.');
      this.updateStatus('error');
      throw new Error('Bluetooth service not configured. Real device integration required.');
    }
    
    // TODO: Implement real Bluetooth connection using Web Bluetooth API
    // Example: const device = await navigator.bluetooth.requestDevice({ ... })
    this.updateStatus('error');
    throw new Error('Bluetooth connection not yet implemented. Real device integration required.');
  }

  async disconnect(): Promise<void> {
    this.stopVitalsStream();
    this.connectedDevice = null;
    this.updateDevice(null);
    this.updateStatus('disconnected');
  }

  private startVitalsStream(): void {
    // MOCK MODE DISABLED - No fake vitals generation
    // TODO: Implement real vitals streaming from connected Bluetooth device
    // This should read from the device's GATT characteristics
    console.warn('⚠️ Vitals streaming not available. Real device integration required.');
  }

  private stopVitalsStream(): void {
    if (this.vitalsInterval) {
      clearInterval(this.vitalsInterval);
      this.vitalsInterval = null;
    }
  }

  // REMOVED: generateMockVitals() - No fake vitals generation allowed
  // Real vitals must come from actual device connections

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
