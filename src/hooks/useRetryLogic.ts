import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
};

export const useRetryLogic = (config: RetryConfig = {}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const retryWithBackoff = useCallback(async <T>(
    fn: () => Promise<T>,
    retryCount = 0
  ): Promise<T> => {
    try {
      setIsRetrying(retryCount > 0);
      const result = await fn();
      setIsRetrying(false);
      return result;
    } catch (error) {
      if (retryCount >= finalConfig.maxRetries) {
        setIsRetrying(false);
        throw error;
      }

      const delayMs = Math.min(
        finalConfig.initialDelay * Math.pow(finalConfig.backoffFactor, retryCount),
        finalConfig.maxDelay
      );

      console.log(`Retry attempt ${retryCount + 1}/${finalConfig.maxRetries} after ${delayMs}ms`);
      await delay(delayMs);
      return retryWithBackoff(fn, retryCount + 1);
    }
  }, [finalConfig]);

  const queueOfflineRequest = useCallback(async (
    requestType: string,
    requestData: any
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('offline_queue').insert({
      user_id: user.id,
      request_type: requestType,
      request_data: requestData,
    });

    if (error) {
      console.error('Failed to queue offline request:', error);
    } else {
      console.log('Request queued for retry:', requestType);
    }
  }, []);

  const processOfflineQueue = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: queuedRequests, error } = await supabase
      .from('offline_queue')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error || !queuedRequests || queuedRequests.length === 0) return;

    console.log(`Processing ${queuedRequests.length} queued requests`);

    for (const request of queuedRequests) {
      try {
        // Process request based on type
        // This is a placeholder - implement actual request processing
        console.log('Processing queued request:', request.request_type);
        
        // Delete successfully processed request
        await supabase.from('offline_queue').delete().eq('id', request.id);
      } catch (error) {
        // Update retry count and error
        await supabase
          .from('offline_queue')
          .update({
            retry_count: request.retry_count + 1,
            last_error: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', request.id);
      }
    }
  }, []);

  return {
    retryWithBackoff,
    queueOfflineRequest,
    processOfflineQueue,
    isRetrying,
  };
};
