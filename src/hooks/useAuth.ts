import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { User, UserRole } from '@/types';
import { generateId } from '@/lib/utils';
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

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;
    const restore = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted || !session?.user) return;
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (profile) login(await profileToUser(profile, session.user.email || ''));
    };
    restore();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        logout();
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (profile) login(await profileToUser(profile, session.user.email || ''));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [login, logout]);

  const loginWithEmail = async (email: string, passwordOrName: string, role: UserRole = 'citizen') => {
    if (!supabase) {
      const user: User = {
        id: generateId(), name: passwordOrName, email, role,
        createdAt: new Date().toISOString(), reportsCount: 0, votesCount: 0,
        isVerified: false, district: 'Toshkent',
      };
      login(user);
      return user;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: passwordOrName });
    if (error) throw error;
    if (!data.user) throw new Error('Kirish amalga oshmadi');
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    if (profileError) throw profileError;
    const user = await profileToUser(profile, data.user.email || email);
    login(user);
    return user;
  };

  const registerWithEmail = async (email: string, password: string, name: string, role: UserRole = 'citizen') => {
    if (!supabase) throw new Error('Supabase sozlanmagan. VITE_SUPABASE_PUBLISHABLE_KEY ni kiriting.');
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, role } } });
    if (error) throw error;
    if (!data.user) throw new Error('Ro‘yxatdan o‘tish amalga oshmadi');

    const { data: profile, error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id, name, email, role,
    }).select('*').single();
    if (profileError) throw profileError;
    const user = await profileToUser(profile, email);
    if (data.session) login(user);
    return user;
  };

  const logoutReal = async () => {
    if (supabase) await supabase.auth.signOut();
    logout();
  };

  const loginAsDemo = (role: UserRole = 'citizen') => {
    const demoUsers: Record<UserRole, User> = {
      citizen: { id: 'user-demo-citizen', name: 'Demo Fuqaro', email: 'demo@opencity.uz', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo', role: 'citizen', district: 'Yunusobod', createdAt: new Date().toISOString(), reportsCount: 3, votesCount: 12, isVerified: true },
      organization: { id: 'user-demo-org', name: 'Demo Tashkilot', email: 'org@opencity.uz', role: 'organization', district: 'Toshkent', createdAt: new Date().toISOString(), reportsCount: 0, votesCount: 0, isVerified: true },
      admin: { id: 'user-demo-admin', name: 'Demo Admin', email: 'admin@opencity.uz', role: 'admin', district: 'Toshkent', createdAt: new Date().toISOString(), reportsCount: 0, votesCount: 0, isVerified: true },
    };
    login(demoUsers[role]);
  };

  const isAdmin = currentUser?.role === 'admin';
  const isOrganization = currentUser?.role === 'organization';
  const isCitizen = currentUser?.role === 'citizen';

  return {
    currentUser, isAuthenticated: !!currentUser, isAdmin, isOrganization, isCitizen,
    login, logout: logoutReal, loginWithEmail, registerWithEmail, loginAsDemo,
    openAuthModal, closeAuthModal, isAuthModalOpen, authModalTab,
  };
}
