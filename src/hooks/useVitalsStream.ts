import { useState, useEffect } from 'react';

export interface VitalReading {
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  temperature: number;
  oxygen: number;
  timestamp: string;
}

export interface PatientVitals {
  patientId: number;
  readings: VitalReading[];
  status: 'normal' | 'warning' | 'critical';
}

const generateReading = (patientId: number, baseVitals: any): VitalReading => {
  // Add realistic variation
  const variance = patientId === 3 ? 0.15 : 0.05; // Patient 3 (Maria) has more variation
  
  const hr = Math.round(baseVitals.heartRate + (Math.random() - 0.5) * baseVitals.heartRate * variance);
  const temp = +(baseVitals.temperature + (Math.random() - 0.5) * 0.5).toFixed(1);
  const o2 = Math.round(baseVitals.oxygen + (Math.random() - 0.5) * 3);
  
  const [sys, dia] = baseVitals.bloodPressure.split('/').map(Number);
  const newSys = Math.round(sys + (Math.random() - 0.5) * sys * variance);
  const newDia = Math.round(dia + (Math.random() - 0.5) * dia * variance);

  return {
    heartRate: hr,
    bloodPressure: { systolic: newSys, diastolic: newDia },
    temperature: temp,
    oxygen: o2,
    timestamp: new Date().toISOString(),
  };
};

const determineStatus = (reading: VitalReading): 'normal' | 'warning' | 'critical' => {
  if (
    reading.heartRate > 140 || reading.heartRate < 40 ||
    reading.bloodPressure.systolic > 160 ||
    reading.temperature > 100 ||
    reading.oxygen < 94
  ) {
    return 'critical';
  }
  
  if (
    reading.heartRate > 100 || reading.heartRate < 50 ||
    reading.bloodPressure.systolic > 140 ||
    reading.temperature > 99 ||
    reading.oxygen < 96
  ) {
    return 'warning';
  }
  
  return 'normal';
};

export const useVitalsStream = (patients: any[]) => {
  const [vitalsData, setVitalsData] = useState<Map<number, PatientVitals>>(new Map());
  const [alerts, setAlerts] = useState<Array<{ id: string; patientId: number; patient: string; message: string; severity: 'critical' | 'warning'; time: string }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVitalsData(prev => {
        const newVitalsData = new Map<number, PatientVitals>(prev);
        const newAlerts: typeof alerts = [];

        patients.forEach((patient) => {
          const newReading = generateReading(patient.id, patient.vitals);
          const status = determineStatus(newReading);
          
          const existing = prev.get(patient.id);
          const readings = existing ? [...existing.readings.slice(-23), newReading] : [newReading];
          
          newVitalsData.set(patient.id, {
            patientId: patient.id,
            readings,
            status,
          });

          // Generate alerts
          if (status === 'critical') {
            if (newReading.heartRate > 140 || newReading.heartRate < 40) {
              newAlerts.push({
                id: `${patient.id}-hr-${Date.now()}`,
                patientId: patient.id,
                patient: patient.name,
                message: `${newReading.heartRate > 140 ? 'Elevated' : 'Low'} heart rate detected: ${newReading.heartRate} bpm`,
                severity: 'critical',
                time: 'Just now',
              });
            }
            if (newReading.bloodPressure.systolic > 160) {
              newAlerts.push({
                id: `${patient.id}-bp-${Date.now()}`,
                patientId: patient.id,
                patient: patient.name,
                message: `High blood pressure: ${newReading.bloodPressure.systolic}/${newReading.bloodPressure.diastolic}`,
                severity: 'critical',
                time: 'Just now',
              });
            }
          }
        });

        if (newAlerts.length > 0) {
          setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
        }

        return newVitalsData;
      });
    }, 800); // Optimized: Update every 800ms for <1s lag

    return () => clearInterval(interval);
  }, [patients]);

  return { vitalsData, alerts };
};
