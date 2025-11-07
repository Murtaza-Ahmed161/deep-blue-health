import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'doctor' | 'patient' | 'caregiver';

export interface AuthUser {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  profile: any | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthUser>({
    user: null,
    session: null,
    role: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Defer additional data fetching
          setTimeout(async () => {
            await fetchUserRoleAndProfile(session.user.id);
          }, 0);
        } else {
          setAuthState({
            user: null,
            session: null,
            role: null,
            profile: null,
            loading: false,
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserRoleAndProfile(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoleAndProfile = async (userId: string) => {
    try {
      // Fetch user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: { session } } = await supabase.auth.getSession();

      setAuthState({
        user: session?.user || null,
        session: session,
        role: roleData?.role || null,
        profile: profileData,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...authState, signOut };
};
