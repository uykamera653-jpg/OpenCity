import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, Plus, Menu, X, MapPin, LayoutDashboard, Building2, ClipboardList, Settings, LogOut, User, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/stores/appStore';
import { getInitials, getAvatarUrl, cn } from '@/lib/utils';

// Test mode banner — remove when real organizations are onboarded
const TEST_MODE = true;

export default function Header() {
  const { currentUser, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth();
  const { notifications } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read && n.userId === currentUser?.id).length;

  const navLinks = [
    { to: '/reports', label: 'Muammolar', icon: ClipboardList },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/organizations', label: 'Tashkilotlar', icon: Building2 },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
    {TEST_MODE && (
      <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-400 text-amber-900 text-center text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-700 animate-pulse flex-shrink-0" />
        🧪 TEST REJIMI — Sayt sinov holatida. Tashkilotlar hali ulangani yo'q. Ma'lumotlar test bazasida saqlanadi.
      </div>
    )}
    <header className={cn('fixed left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm', TEST_MODE ? 'top-8' : 'top-0')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Open<span className="text-[#2563EB]">City</span></span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive(to) ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                isActive('/admin') ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-100')}>
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
          </nav>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Create Report */}
            <button onClick={() => isAuthenticated ? navigate('/reports/new') : openAuthModal('login')}
              className="city-btn-primary hidden sm:flex text-sm px-3 py-2">
              <Plus className="w-4 h-4" /> Muammo bildirish
            </button>

            {isAuthenticated && (
              <div className="relative">
                <button onClick={() => setNotifOpen(!notifOpen)}
                  className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">{unreadCount}</span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-glass-lg border border-gray-100 overflow-hidden z-50 animate-slide-down">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="font-semibold text-sm text-gray-900">Bildirishnomalar</span>
                      <button onClick={() => useAppStore.getState().markAllNotificationsRead()} className="text-xs text-[#2563EB] hover:underline">Barchasini o'qi</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {notifications.filter(n => n.userId === currentUser?.id).slice(0, 5).map(n => (
                        <button key={n.id} onClick={() => { useAppStore.getState().markNotificationRead(n.id); setNotifOpen(false); n.reportId && navigate(`/reports/${n.reportId}`); }}
                          className={cn('w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors', !n.read && 'bg-blue-50/50')}>
                          <div className="flex items-start gap-2">
                            {!n.read && <span className="w-2 h-2 bg-[#2563EB] rounded-full mt-1.5 flex-shrink-0" />}
                            <div className={!n.read ? '' : 'ml-4'}>
                              <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold">
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{getInitials(currentUser?.name || '')}</span>
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">{currentUser?.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-glass-lg border border-gray-100 overflow-hidden z-50 animate-slide-down">
                    <div className="px-3 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{currentUser?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                    </div>
                    <div className="py-1">
                      <button onClick={() => { navigate('/profile'); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><User className="w-4 h-4" /> Profil</button>
                      {isAdmin && <button onClick={() => { navigate('/admin'); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"><Settings className="w-4 h-4" /> Admin panel</button>}
                      <button onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4" /> Chiqish</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => openAuthModal('login')} className="city-btn-secondary text-sm">Kirish</button>
            )}

            {/* Mobile hamburger */}
            <button className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 animate-slide-down">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className={cn('flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium mb-1',
                isActive(to) ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-gray-700 hover:bg-gray-100')}>
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
          <button onClick={() => { isAuthenticated ? navigate('/reports/new') : openAuthModal(); setMobileOpen(false); }}
            className="city-btn-primary w-full mt-2 justify-center">
            <Plus className="w-4 h-4" /> Muammo bildirish
          </button>
        </div>
      )}

      {/* Overlay */}
      {(notifOpen || userMenuOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setNotifOpen(false); setUserMenuOpen(false); }} />
      )}
    </header>
    </>
  );
}
