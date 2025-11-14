import { useEffect, useRef } from 'react';
import { trackMetric } from './useSessionTracking';

const HEALTH_CHECK_INTERVAL = 60000; // 1 minute
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

export const useUptimeMonitoring = () => {
  const uptimeStartRef = useRef<number>(Date.now());
  const lastSuccessRef = useRef<number>(Date.now());

  useEffect(() => {
    let consecutiveFailures = 0;
    
    const checkHealth = async () => {
      const startTime = Date.now();
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

        const response = await fetch(window.location.origin, {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const uptime = Date.now() - uptimeStartRef.current;
          const responseTime = Date.now() - startTime;
          
          // Track successful health check
          trackMetric('health_check_success', responseTime, {
            uptime_ms: uptime,
            consecutive_failures: consecutiveFailures,
          });

          consecutiveFailures = 0;
          lastSuccessRef.current = Date.now();
        } else {
          throw new Error(`Health check failed: ${response.status}`);
        }
      } catch (error) {
        consecutiveFailures++;
        const downtime = Date.now() - lastSuccessRef.current;

        console.error('Health check failed:', error);
        
        // Track failure
        trackMetric('health_check_failure', downtime, {
          error: error instanceof Error ? error.message : 'Unknown error',
          consecutive_failures: consecutiveFailures,
        });

        // Log critical error if down for > 5 minutes
        if (downtime > 300000) {
          trackMetric('system_downtime_critical', downtime, {
            consecutive_failures: consecutiveFailures,
          });
        }
      }
    };

    // Initial check
    checkHealth();

    // Set up interval
    const intervalId = setInterval(checkHealth, HEALTH_CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return {
    uptimeStart: uptimeStartRef.current,
    lastSuccess: lastSuccessRef.current,
  };
};
