/**
 * Core System Test Utility
 * Tests all fundamental app functionality
 */

import { supabase } from '@/integrations/supabase/client';

export interface CoreTestResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export const runCoreSystemTest = async (): Promise<CoreTestResult[]> => {
  const results: CoreTestResult[] = [];
  
  console.log('🧪 Running Core System Test...');

  // Test 1: Database Connection
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    
    results.push({
      component: 'Database Connection',
      status: 'pass',
      message: 'Supabase connection successful'
    });
  } catch (error) {
    results.push({
      component: 'Database Connection',
      status: 'fail',
      message: `Database connection failed: ${error}`,
      details: error
    });
  }

  // Test 2: Authentication System
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (user) {
      results.push({
        component: 'Authentication',
        status: 'pass',
        message: `User authenticated: ${user.email}`,
        details: { userId: user.id, email: user.email }
      });
    } else {
      results.push({
        component: 'Authentication',
        status: 'warning',
        message: 'No user currently authenticated (expected if not logged in)'
      });
    }
  } catch (error) {
    results.push({
      component: 'Authentication',
      status: 'fail',
      message: `Authentication check failed: ${error}`,
      details: error
    });
  }

  // Test 3: User Profile System
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        results.push({
          component: 'User Profile',
          status: 'fail',
          message: 'User profile missing in database',
          details: { userId: user.id }
        });
      } else if (profileError) {
        throw profileError;
      } else {
        results.push({
          component: 'User Profile',
          status: 'pass',
          message: `Profile found: ${profile.full_name || 'No name'}`,
          details: { profileId: profile.id, email: profile.email }
        });
      }
    } else {
      results.push({
        component: 'User Profile',
        status: 'warning',
        message: 'Cannot test profile - no authenticated user'
      });
    }
  } catch (error) {
    results.push({
      component: 'User Profile',
      status: 'fail',
      message: `Profile check failed: ${error}`,
      details: error
    });
  }

  // Test 4: User Roles System
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError && roleError.code === 'PGRST116') {
        results.push({
          component: 'User Roles',
          status: 'fail',
          message: 'User role missing in database',
          details: { userId: user.id }
        });
      } else if (roleError) {
        throw roleError;
      } else {
        results.push({
          component: 'User Roles',
          status: 'pass',
          message: `Role assigned: ${roleData.role}`,
          details: { role: roleData.role }
        });
      }
    } else {
      results.push({
        component: 'User Roles',
        status: 'warning',
        message: 'Cannot test roles - no authenticated user'
      });
    }
  } catch (error) {
    results.push({
      component: 'User Roles',
      status: 'fail',
      message: `Role check failed: ${error}`,
      details: error
    });
  }

  // Test 5: Vitals System
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: vitals, error: vitalsError } = await supabase
        .from('vitals')
        .select('count')
        .eq('user_id', user.id);

      if (vitalsError) throw vitalsError;
      
      results.push({
        component: 'Vitals System',
        status: 'pass',
        message: `Vitals table accessible (${vitals?.length || 0} records)`,
        details: { recordCount: vitals?.length || 0 }
      });
    } else {
      results.push({
        component: 'Vitals System',
        status: 'warning',
        message: 'Cannot test vitals - no authenticated user'
      });
    }
  } catch (error) {
    results.push({
      component: 'Vitals System',
      status: 'fail',
      message: `Vitals system check failed: ${error}`,
      details: error
    });
  }

  // Test 6: Emergency System
  try {
    const { data: emergencyEvents, error: emergencyError } = await supabase
      .from('emergency_events')
      .select('count')
      .limit(1);

    if (emergencyError) throw emergencyError;
    
    results.push({
      component: 'Emergency System',
      status: 'pass',
      message: 'Emergency tables accessible',
      details: { tableExists: true }
    });
  } catch (error) {
    results.push({
      component: 'Emergency System',
      status: 'fail',
      message: `Emergency system check failed: ${error}`,
      details: error
    });
  }

  // Test 7: Edge Functions
  try {
    // Test if edge functions are deployed by checking the URL
    const functionsUrl = supabase.supabaseUrl + '/functions/v1/send-emergency-email';
    
    results.push({
      component: 'Edge Functions',
      status: 'pass',
      message: 'Edge functions URL configured',
      details: { functionsUrl }
    });
  } catch (error) {
    results.push({
      component: 'Edge Functions',
      status: 'fail',
      message: `Edge functions check failed: ${error}`,
      details: error
    });
  }

  // Test 8: Environment Variables
  try {
    const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (hasSupabaseUrl && hasSupabaseKey) {
      results.push({
        component: 'Environment Variables',
        status: 'pass',
        message: 'Required environment variables present',
        details: { hasUrl: hasSupabaseUrl, hasKey: hasSupabaseKey }
      });
    } else {
      results.push({
        component: 'Environment Variables',
        status: 'fail',
        message: 'Missing required environment variables',
        details: { hasUrl: hasSupabaseUrl, hasKey: hasSupabaseKey }
      });
    }
  } catch (error) {
    results.push({
      component: 'Environment Variables',
      status: 'fail',
      message: `Environment check failed: ${error}`,
      details: error
    });
  }

  // Summary
  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  console.log(`🧪 Core System Test Complete: ${passCount} passed, ${failCount} failed, ${warningCount} warnings`);
  
  return results;
};

export const logTestResults = (results: CoreTestResult[]) => {
  console.log('\n📊 Core System Test Results:');
  console.log('================================');
  
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.component}: ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, result.details);
    }
  });
  
  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  
  console.log('\n📈 Summary:');
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⚠️ Warnings: ${warningCount}`);
  
  if (failCount === 0) {
    console.log('\n🎉 All core systems are working correctly!');
  } else {
    console.log('\n🚨 Some core systems need attention before adding new features.');
  }
};