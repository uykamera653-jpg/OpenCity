import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';

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

  const loadProfile = useCallback(async (userId: string, email = '') => {
    if (!supabase) return null;
    let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (!profile) {
      const { data: created } = await supabase.from('profiles').insert({
        id: userId,
        email,
        name: email.split('@')[0] || 'Foydalanuvchi',
        role: 'citizen',
      }).select('*').single();
      profile = created;
    }
    if (!profile) return null;
    return profileToUser(profile, email);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted || !session?.user) return;
      const user = await loadProfile(session.user.id, session.user.email || '');
      if (mounted && user) login(user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session?.user) { logout(); return; }
      const user = await loadProfile(session.user.id, session.user.email || '');
      if (mounted && user) login(user);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [login, logout, loadProfile]);

  const loginWithEmail = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase sozlanmagan. VITE_SUPABASE_PUBLISHABLE_KEY ni kiriting.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('Kirish amalga oshmadi');
    const user = await loadProfile(data.user.id, data.user.email || email);
    if (!user) throw new Error('Profil yaratilmadi');
    if (user.isBlocked) throw new Error('Hisobingiz bloklangan.');
    login(user);
    return user;
  };

  const registerWithEmail = async (email: string, password: string, name: string) => {
    if (!supabase) throw new Error('Supabase sozlanmagan.');
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) throw error;
    if (!data.user) throw new Error('Ro‘yxatdan o‘tish amalga oshmadi');
    const { data: profile, error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id, name, email, role: 'citizen',
    }).select('*').single();
    if (profileError) throw profileError;
    const user = await profileToUser(profile, email);
    if (data.session) login(user);
    return user;
  };

  const loginWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase sozlanmagan.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
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
