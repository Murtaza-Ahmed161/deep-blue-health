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
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // CRITICAL: If profile or role is missing, this is a data integrity issue
      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist - this should never happen
        const { data: { user: authUser } } = await supabase.auth.getUser();
        console.error('CRITICAL: User profile missing in database', {
          userId,
          authEmail: authUser?.email,
        });
        
        // Attempt to create profile from auth metadata
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const metadata = user.user_metadata || {};
          const roleFromMetadata = metadata.role;
          
          // CRITICAL: Do not guess role - it must be explicit
          if (!roleFromMetadata) {
            console.error('CRITICAL: Cannot recover profile - role not specified in metadata', {
              userId: user.id,
              email: user.email,
            });
            // Don't throw - set error state instead
            setAuthState({
              user: null,
              session: null,
              role: null,
              profile: null,
              loading: false,
            });
            return;
          }
          
          console.warn('Attempting to recover missing profile...', {
            userId: user.id,
            role: roleFromMetadata,
          });
          
          // Try to create profile
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: metadata.full_name || null,
              phone: metadata.phone || null,
              specialty: metadata.specialty || null,
              license_number: metadata.license_number || null,
            });

          if (createProfileError) {
            console.error('Failed to recover profile:', createProfileError);
            // Don't throw - set error state instead
            setAuthState({
              user: null,
              session: null,
              role: null,
              profile: null,
              loading: false,
            });
            return;
          }

          // Try to create role with explicit role from metadata
          const { error: createRoleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              role: roleFromMetadata,
            });

          if (createRoleError) {
            console.error('Failed to recover role:', createRoleError);
            // Profile created but role failed - set error state
            setAuthState({
              user: null,
              session: null,
              role: null,
              profile: null,
              loading: false,
            });
            return;
          }

          // Retry fetching after recovery
          const { data: recoveredProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          const { data: recoveredRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .single();

          const { data: { session } } = await supabase.auth.getSession();

          setAuthState({
            user: session?.user || null,
            session: session,
            role: recoveredRole?.role || null,
            profile: recoveredProfile,
            loading: false,
          });
          return;
        }
      }

      if (roleError && roleError.code === 'PGRST116') {
        // Role doesn't exist
        console.error('CRITICAL: User role missing in database', {
          userId,
          hasProfile: !!profileData,
        });
        // Don't throw - set error state instead
        setAuthState({
          user: null,
          session: null,
          role: null,
          profile: null,
          loading: false,
        });
        return;
      }

      // Both profile and role must exist
      if (!profileData) {
        console.error('CRITICAL: User profile missing in database', { userId });
        setAuthState({
          user: null,
          session: null,
          role: null,
          profile: null,
          loading: false,
        });
        return;
      }

      if (!roleData) {
        console.error('CRITICAL: User role missing in database', { userId });
        setAuthState({
          user: null,
          session: null,
          role: null,
          profile: null,
          loading: false,
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      setAuthState({
        user: session?.user || null,
        session: session,
        role: roleData.role,
        profile: profileData,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Set error state instead of silently failing
      // DO NOT throw - this would crash the app
      // Instead, set state to indicate error condition
      setAuthState({
        user: null,
        session: null,
        role: null,
        profile: null,
        loading: false,
      });
      
      // Log critical errors but don't throw
      if (error instanceof Error && error.message.includes('DB sync failed')) {
        console.error('CRITICAL: Auth data sync failed - user will need to contact support', error);
        // Don't throw - let the UI handle the missing profile state
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...authState, signOut };
};
