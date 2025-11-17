import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role: string | null;
}

/**
 * Custom hook for managing Supabase authentication
 * Provides user session state and authentication methods
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoaded, setRoleLoaded] = useState(false);
  
  // Prevent duplicate fetches with cache and ref
  const profileCacheRef = useRef<Map<string, UserProfile | null>>(new Map());
  const isFetchingRef = useRef(false);

  // Fetch user profile with role - stable function reference
  const fetchUserProfile = useCallback(async (userId: string): Promise<void> => {
    // Check cache first
    if (profileCacheRef.current.has(userId)) {
      const cachedProfile = profileCacheRef.current.get(userId);
      setUserProfile(cachedProfile || null);
      setRoleLoaded(true);
      return;
    }

    // Prevent duplicate fetches using ref
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
      try {
        const queryStart = Date.now();
        
        // Fast timeout (2 seconds) - if query hangs, fail fast
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
        );
        
        // Try Profiles table first (most common)
        const fetchPromise = supabase
          .from('Profiles')
          .select('id, email, first_name, last_name, phone_number, role')
          .eq('id', userId)
          .maybeSingle();
        
        let queryResult;
        try {
          queryResult = await Promise.race([fetchPromise, timeoutPromise]);
          const queryDuration = Date.now() - queryStart;
          if (queryDuration > 100) {
            console.log(`✅ Profile fetched in ${queryDuration}ms`);
          }
        } catch (timeoutError: any) {
          // If Profiles times out, try 'users' table as fallback
          if (timeoutError?.message === 'Profile fetch timeout') {
            try {
              const usersFetchPromise = supabase
                .from('users')
                .select('id, email, first_name, last_name, phone_number, role')
                .eq('id', userId)
                .maybeSingle();
              
              queryResult = await Promise.race([usersFetchPromise, timeoutPromise]);
              const queryDuration = Date.now() - queryStart;
              console.log(`✅ Profile fetched from users table in ${queryDuration}ms`);
            } catch (secondError) {
              console.error('❌ Profile fetch failed from both tables');
              setUserProfile(null);
              setRoleLoaded(true);
              isFetchingRef.current = false;
              return;
            }
          } else {
            console.error('Query error:', timeoutError);
            setUserProfile(null);
            setRoleLoaded(true);
            isFetchingRef.current = false;
            return;
          }
        }
        
        const { data, error } = queryResult as any;

        if (error) {
          console.error('❌ Error fetching profile:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          setUserProfile(null);
          setRoleLoaded(true);
          return;
        }

        if (data) {
          const profile = data as UserProfile;
          setUserProfile(profile);
          // Cache the result
          profileCacheRef.current.set(userId, profile);
        } else {
          setUserProfile(null);
          // Cache the null result
          profileCacheRef.current.set(userId, null);
        }
        setRoleLoaded(true);
        isFetchingRef.current = false;
      } catch (err) {
        console.error('❌ Exception fetching user profile:', err);
        setUserProfile(null);
        setRoleLoaded(true);
        isFetchingRef.current = false;
      }
    }, []);

  useEffect(() => {
    // Get initial session and fetch profile immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Set loading to false immediately - don't wait for profile
      setLoading(false);
      
      if (session?.user) {
        // Start fetching profile in background, don't await
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setRoleLoaded(true);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Set loading to false immediately
      setLoading(false);
      
      // Only fetch profile if user logged in or session refreshed
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        setRoleLoaded(false);
        fetchUserProfile(session.user.id);
      } else if (!session?.user) {
        setUserProfile(null);
        setRoleLoaded(true);
        isFetchingRef.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return { error };

    const userId = data.user?.id; // user id (uuid)
    return { userId, data };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  };

  // Memoize admin check to prevent recalculation on every render
  const isAdmin = useMemo(() => {
    // Method 1: Check database role (primary method)
    const roleUpper = userProfile?.role?.toUpperCase() || '';
    const isAdminByRole = 
      roleUpper === 'ADMIN' || 
      roleUpper === 'MODERATOR';
    
    // Method 2: Check email whitelist (fallback method)
    const adminEmails: string[] = []; // Add admin emails here if needed
    const isAdminByEmail = user?.email ? adminEmails.includes(user.email) : false;
    
    // Either method grants admin access
    const result = isAdminByRole || isAdminByEmail;
    
    if (userProfile) {
      console.log('🔐 Admin check:', {
        role: userProfile?.role,
        isAdmin: result
      });
    }
    
    return result;
  }, [userProfile, user?.email]);

  return {
    user,
    session,
    loading,
    roleLoaded,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
    userProfile,
    userRole: userProfile?.role || null,
    isAdmin,
  };
}

