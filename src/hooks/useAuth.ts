import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';

// Use the public OpenCity URL for OAuth callbacks.
// OnSpace can expose the app through an internal localhost:3000 origin;
// using window.location.origin would therefore send Google OAuth back to
// localhost, which is unreachable from the user's device.
const AUTH_REDIRECT_URL = 'https://02.onspace.build';

async function profileToUser(profile: any, fallbackEmail = ''): Promise<User> {
  return {
    id: profile.id,
    name: profile.name || fallbackEmail.split('@')[0] || 'Foydalanuvchi',
    email: profile.email || fallbackEmail,
    avatar: profile.avatar || undefined,
    role: profile.role || 'citizen',
    phone: profile.phone || undefined,
    district: profile.district || undefined,
    createdAt: profile.created_at || new Date().toISOString(),
    reportsCount: 0,
    votesCount: 0,
    isVerified: Boolean(profile.is_verified),
    isBlocked: Boolean(profile.is_blocked),
    bio: profile.bio || undefined,
  };
}

export function useAuth() {
  const { currentUser, login, logout, openAuthModal, isAuthModalOpen, closeAuthModal, authModalTab } = useAppStore();

  const loadProfile = useCallback(async (userId: string, email = '', name = '') => {
    if (!supabase) return null;

    const { data: profile, error: readError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (readError) throw readError;
    if (profile) return profileToUser(profile, email);

    // A profile can only be created after Supabase has an authenticated session.
    // This also prevents the signup flow from failing when email confirmation is enabled.
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        name: name || email.split('@')[0] || 'Foydalanuvchi',
        role: 'citizen',
      })
      .select('*')
      .single();

    if (createError) throw createError;
    return created ? profileToUser(created, email) : null;
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;

    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted || !session?.user) return;
        const user = await loadProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.name || ''
        );
        if (mounted && user) login(user);
      } catch {
        // Do not break the application if profile restoration temporarily fails.
      }
    };

    void restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        logout();
        return;
      }

      try {
        const user = await loadProfile(
          session.user.id,
          session.user.email || '',
          session.user.user_metadata?.name || ''
        );
        if (mounted && user) login(user);
      } catch {
        // Keep auth state alive even if the profile table is temporarily unavailable.
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [login, logout, loadProfile]);

  const loginWithEmail = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase sozlanmagan. VITE_SUPABASE_PUBLISHABLE_KEY ni kiriting.');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Kirish amalga oshmadi');

    const user = await loadProfile(
      data.user.id,
      data.user.email || email,
      data.user.user_metadata?.name || ''
    );
    if (!user) throw new Error('Profil yaratilmadi');
    if (user.isBlocked) throw new Error('Hisobingiz bloklangan.');

    login(user);
    return user;
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    if (!supabase) throw new Error('Supabase sozlanmagan.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: AUTH_REDIRECT_URL,
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('Ro‘yxatdan o‘tish amalga oshmadi');

    // With email confirmation enabled, data.session is null. In that case,
    // do NOT write to public.profiles yet because there is no authenticated JWT.
    if (!data.session) {
      return {
        id: data.user.id,
        name,
        email,
        avatar: undefined,
        role: 'citizen' as const,
        phone: undefined,
        district: undefined,
        createdAt: new Date().toISOString(),
        reportsCount: 0,
        votesCount: 0,
        isVerified: false,
        isBlocked: false,
        bio: undefined,
      } satisfies User;
    }

    const user = await loadProfile(data.user.id, email, name);
    if (!user) throw new Error('Profil yaratilmadi');
    if (user.isBlocked) throw new Error('Hisobingiz bloklangan.');

    login(user);
    return user;
  };

  const loginWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase sozlanmagan.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: AUTH_REDIRECT_URL },
    });
    if (error) throw error;
  };

  const logoutReal = async () => {
    if (supabase) await supabase.auth.signOut();
    logout();
  };

  const isAdmin = currentUser?.role === 'admin';
  const isOrganization = currentUser?.role === 'organization';
  const isCitizen = currentUser?.role === 'citizen';

  return {
    currentUser,
    isAuthenticated: !!currentUser,
    isAdmin,
    isOrganization,
    isCitizen,
    login,
    logout: logoutReal,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    openAuthModal,
    closeAuthModal,
    isAuthModalOpen,
    authModalTab,
  };
}
