import { supabase } from '@/integrations/supabase/client';

export const debugEmergencySystem = async () => {
  console.log('🔍 Emergency System Debug Check');
  
  try {
    // Check if emergency_events table exists
    console.log('1. Checking emergency_events table...');
    const { data: eventsData, error: eventsError } = await supabase
      .from('emergency_events')
      .select('count')
      .limit(1);
    
    if (eventsError) {
      console.error('❌ emergency_events table error:', eventsError);
      if (eventsError.code === '42P01') {
        console.error('💡 Table does not exist - migration needs to be applied');
      }
    } else {
      console.log('✅ emergency_events table exists');
    }

    // Check if emergency_notifications table exists
    console.log('2. Checking emergency_notifications table...');
    const { data: notifData, error: notifError } = await supabase
      .from('emergency_notifications')
      .select('count')
      .limit(1);
    
    if (notifError) {
      console.error('❌ emergency_notifications table error:', notifError);
      if (notifError.code === '42P01') {
        console.error('💡 Table does not exist - migration needs to be applied');
      }
    } else {
      console.log('✅ emergency_notifications table exists');
    }

    // Check current user
    console.log('3. Checking current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ User auth error:', userError);
    } else if (user) {
      console.log('✅ User authenticated:', user.id, user.email);
      
      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Profile error:', profileError);
      } else {
        console.log('✅ User profile found:', profile.full_name, profile.email);
        console.log('Emergency contact:', profile.emergency_contact_name, profile.emergency_contact_phone);
      }
    } else {
      console.error('❌ No user authenticated');
    }

    // Check user role
    console.log('4. Checking user role...');
    if (user) {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (roleError) {
        console.error('❌ Role error:', roleError);
      } else {
        console.log('✅ User role:', roleData.role);
      }
    }

  } catch (error) {
    console.error('❌ Debug check failed:', error);
  }
};

export const testEmergencyEventCreation = async (patientId: string) => {
  console.log('🧪 Testing emergency event creation for patient:', patientId);
  
  try {
    const testEvent = {
      patient_id: patientId,
      triggered_by: patientId,
      triggered_at: new Date().toISOString(),
      location_consented: false,
      status: 'pending' as const,
      notes: 'Debug test event'
    };

    console.log('Attempting to insert:', testEvent);

    const { data, error } = await supabase
      .from('emergency_events')
      .insert(testEvent)
      .select()
      .single();

    if (error) {
      console.error('❌ Insert failed:', error);
      return { success: false, error };
    } else {
      console.log('✅ Insert successful:', data);
      return { success: true, data };
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
};