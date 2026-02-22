import { useState, useEffect, useCallback, useRef } from 'react';

interface VitalsData {
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  oxygenSaturation: number;
  temperature: number;
  respiratoryRate: number;
}

interface DemoModeConfig {
  updateInterval: number; // milliseconds
  scenario: 'normal' | 'warning' | 'critical' | 'mixed';
}

const DEFAULT_CONFIG: DemoModeConfig = {
  updateInterval: 10000, // 10 seconds
  scenario: 'mixed'
};

// Baseline normal vitals
const BASELINE_VITALS: VitalsData = {
  heartRate: 75,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  oxygenSaturation: 98,
  temperature: 37.0,
  respiratoryRate: 16
};

// Realistic variation ranges
const VARIATION_RANGES = {
  normal: {
    heartRate: { min: -5, max: 5 },
    bloodPressureSystolic: { min: -5, max: 5 },
    bloodPressureDiastolic: { min: -3, max: 3 },
    oxygenSaturation: { min: -1, max: 1 },
    temperature: { min: -0.2, max: 0.2 },
    respiratoryRate: { min: -2, max: 2 }
  },
  warning: {
    heartRate: { min: 10, max: 25 },
    bloodPressureSystolic: { min: 15, max: 30 },
    bloodPressureDiastolic: { min: 8, max: 15 },
    oxygenSaturation: { min: -3, max: -1 },
    temperature: { min: 0.3, max: 0.8 },
    respiratoryRate: { min: 3, max: 6 }
  },
  critical: {
    heartRate: { min: 30, max: 50 },
    bloodPressureSystolic: { min: 40, max: 70 },
    bloodPressureDiastolic: { min: 20, max: 35 },
    oxygenSaturation: { min: -10, max: -5 },
    temperature: { min: 1.0, max: 2.5 },
    respiratoryRate: { min: 8, max: 12 }
  }
};

export const useDemoMode = (config: Partial<DemoModeConfig> = {}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentVitals, setCurrentVitals] = useState<VitalsData>(BASELINE_VITALS);
  const [updateCount, setUpdateCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const configRef = useRef<DemoModeConfig>({ ...DEFAULT_CONFIG, ...config });

  // Generate realistic vitals with smooth transitions
  const generateRealisticVitals = useCallback((previousVitals: VitalsData, scenario: 'normal' | 'warning' | 'critical'): VitalsData => {
    const ranges = VARIATION_RANGES[scenario];
    
    // Helper to add variation with smoothing (prevents sudden jumps)
    const smoothVariation = (current: number, baseline: number, range: { min: number; max: number }, maxChange: number = 5) => {
      const targetVariation = range.min + Math.random() * (range.max - range.min);
      const target = baseline + targetVariation;
      const change = target - current;
      // Limit change per update for smooth transitions
      const smoothedChange = Math.max(-maxChange, Math.min(maxChange, change));
      return Math.round((current + smoothedChange) * 10) / 10;
    };

    return {
      heartRate: Math.round(smoothVariation(
        previousVitals.heartRate,
        BASELINE_VITALS.heartRate,
        ranges.heartRate,
        3
      )),
      bloodPressureSystolic: Math.round(smoothVariation(
        previousVitals.bloodPressureSystolic,
        BASELINE_VITALS.bloodPressureSystolic,
        ranges.bloodPressureSystolic,
        4
      )),
      bloodPressureDiastolic: Math.round(smoothVariation(
        previousVitals.bloodPressureDiastolic,
        BASELINE_VITALS.bloodPressureDiastolic,
        ranges.bloodPressureDiastolic,
        3
      )),
      oxygenSaturation: Math.round(smoothVariation(
        previousVitals.oxygenSaturation,
        BASELINE_VITALS.oxygenSaturation,
        ranges.oxygenSaturation,
        1
      )),
      temperature: Math.round(smoothVariation(
        previousVitals.temperature,
        BASELINE_VITALS.temperature,
        ranges.temperature,
        0.2
      ) * 10) / 10,
      respiratoryRate: Math.round(smoothVariation(
        previousVitals.respiratoryRate,
        BASELINE_VITALS.respiratoryRate,
        ranges.respiratoryRate,
        2
      ))
    };
  }, []);

  // Determine scenario based on update count (for mixed mode)
  const getCurrentScenario = useCallback((count: number): 'normal' | 'warning' | 'critical' => {
    if (configRef.current.scenario !== 'mixed') {
      return configRef.current.scenario;
    }

    // Mixed mode: cycle through scenarios
    // First 3 updates: normal
    // Next 2 updates: warning
    // Next 1 update: critical
    // Then repeat
    const cycle = count % 6;
    if (cycle < 3) return 'normal';
    if (cycle < 5) return 'warning';
    return 'critical';
  }, []);

  // Start demo mode
  const startDemo = useCallback(() => {
    if (isActive) return;

    console.log('🎬 Demo Mode: Starting...');
    setIsActive(true);
    setUpdateCount(0);
    setCurrentVitals(BASELINE_VITALS);

    // Start interval
    intervalRef.current = setInterval(() => {
      setUpdateCount(prev => {
        const newCount = prev + 1;
        const scenario = getCurrentScenario(newCount);
        
        setCurrentVitals(prevVitals => {
          const newVitals = generateRealisticVitals(prevVitals, scenario);
          console.log(`🎬 Demo Mode Update #${newCount} (${scenario}):`, newVitals);
          return newVitals;
        });

        return newCount;
      });
    }, configRef.current.updateInterval);

  }, [isActive, generateRealisticVitals, getCurrentScenario]);

  // Stop demo mode
  const stopDemo = useCallback(() => {
    if (!isActive) return;

    console.log('🛑 Demo Mode: Stopping...');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsActive(false);
    setUpdateCount(0);
    setCurrentVitals(BASELINE_VITALS);
  }, [isActive]);

  // Toggle demo mode
  const toggleDemo = useCallback(() => {
    if (isActive) {
      stopDemo();
    } else {
      startDemo();
    }
  }, [isActive, startDemo, stopDemo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isActive,
    currentVitals,
    updateCount,
    startDemo,
    stopDemo,
    toggleDemo,
    scenario: getCurrentScenario(updateCount)
  };
};
