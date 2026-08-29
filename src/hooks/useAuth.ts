import { useAppStore } from '@/stores/appStore';
import { User, UserRole } from '@/types';
import { generateId } from '@/lib/utils';

export function useAuth() {
  const { currentUser, login, logout, openAuthModal, isAuthModalOpen, closeAuthModal, authModalTab } = useAppStore();

  const loginWithEmail = (email: string, name: string, role: UserRole = 'citizen') => {
    const user: User = {
      id: generateId(),
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      reportsCount: 0,
      votesCount: 0,
      isVerified: false,
      district: 'Toshkent',
    };
    login(user);
    return user;
  };

  const loginAsDemo = (role: UserRole = 'citizen') => {
    const demoUsers: Record<UserRole, User> = {
      citizen: {
        id: 'user-demo-citizen',
        name: 'Demo Fuqaro',
        email: 'demo@opencity.uz',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        role: 'citizen',
        district: 'Yunusobod',
        createdAt: new Date().toISOString(),
        reportsCount: 3,
        votesCount: 12,
        isVerified: true,
      },
      organization: {
        id: 'user-demo-org',
        name: 'Demo Tashkilot',
        email: 'org@opencity.uz',
        role: 'organization',
        district: 'Toshkent',
        createdAt: new Date().toISOString(),
        reportsCount: 0,
        votesCount: 0,
        isVerified: true,
      },
      admin: {
        id: 'user-demo-admin',
        name: 'Demo Admin',
        email: 'admin@opencity.uz',
        role: 'admin',
        district: 'Toshkent',
        createdAt: new Date().toISOString(),
        reportsCount: 0,
        votesCount: 0,
        isVerified: true,
      },
    };
    login(demoUsers[role]);
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
    logout,
    loginWithEmail,
    loginAsDemo,
    openAuthModal,
    closeAuthModal,
    isAuthModalOpen,
    authModalTab,
  };
}
