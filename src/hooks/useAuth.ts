import { useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { useAppActions } from '../stores/useAppStore';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

interface SignInData {
  email: string;
  password: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  const { setUser, logout: appLogout, setLoading, setError } = useAppActions();

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
          setAuthState(prev => ({ ...prev, error, loading: false }));
          return;
        }

        if (session?.user) {
          await handleUserSession(session);
        }

        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user || null,
          loading: false,
        }));
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
        setAuthState(prev => ({ ...prev, loading: false }));
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user || null,
          loading: false,
          error: null,
        }));

        if (session?.user) {
          await handleUserSession(session);
        } else {
          appLogout();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, appLogout, setLoading, setError]);

  const handleUserSession = async (session: Session) => {
    try {
      // Get or create user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is expected for new users
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      // If no profile exists, create one
      if (!profile) {
        const newProfile = {
          id: session.user.id,
          username: session.user.email?.split('@')[0] || `user_${Date.now()}`,
          display_name: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url || null,
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (insertError) {
          console.error('Error creating profile:', insertError);
          throw insertError;
        }
      }

      // Update app store with user data
      setUser({
        id: session.user.id,
        name: profile?.display_name || session.user.email?.split('@')[0] || 'User',
        isHost: false, // Will be determined by game context
      });

    } catch (error) {
      console.error('Error handling user session:', error);
      setError('Failed to load user profile');
    }
  };

  const signUp = async ({ email, password, displayName }: SignUpData) => {
    try {
      setLoading(true);
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        setError(error.message);
        setAuthState(prev => ({ ...prev, error, loading: false }));
        return { success: false, error };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return { 
          success: true, 
          requiresConfirmation: true,
          message: 'Please check your email for a confirmation link.' 
        };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: true };

    } catch (err) {
      const error = err as AuthError;
      console.error('Sign up error:', error);
      setError(error.message);
      setAuthState(prev => ({ ...prev, error, loading: false }));
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async ({ email, password }: SignInData) => {
    try {
      setLoading(true);
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setAuthState(prev => ({ ...prev, error, loading: false }));
        return { success: false, error };
      }

      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: true, user: data.user };

    } catch (err) {
      const error = err as AuthError;
      console.error('Sign in error:', error);
      setError(error.message);
      setAuthState(prev => ({ ...prev, error, loading: false }));
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        setError(error.message);
        return { success: false, error };
      }

      return { success: true };
    } catch (err) {
      const error = err as AuthError;
      console.error('Sign out error:', error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        return { success: false, error };
      }

      return { 
        success: true, 
        message: 'Password reset email sent. Please check your inbox.' 
      };
    } catch (err) {
      const error = err as AuthError;
      console.error('Password reset error:', error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setError(error.message);
        return { success: false, error };
      }

      return { success: true, message: 'Password updated successfully.' };
    } catch (err) {
      const error = err as AuthError;
      console.error('Password update error:', error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { display_name?: string; avatar_url?: string }) => {
    try {
      if (!authState.user) {
        throw new Error('No user logged in');
      }

      setLoading(true);
      
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: updates,
      });

      if (authError) {
        throw authError;
      }

      // Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authState.user.id);

      if (profileError) {
        throw profileError;
      }

      // Update app store
      if (updates.display_name) {
        setUser({
          id: authState.user.id,
          name: updates.display_name,
          isHost: false,
        });
      }

      return { success: true, message: 'Profile updated successfully.' };
    } catch (err) {
      const error = err as Error;
      console.error('Profile update error:', error);
      setError(error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,

    // Actions
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };
} 