import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, ClipboardList, ThumbsUp, Mail, Phone, LogOut, Edit3, Shield, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/stores/appStore';
import { getInitials, formatDate } from '@/lib/utils';
import ReportCard from '@/components/features/reports/ReportCard';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { currentUser, isAuthenticated, logout, openAuthModal } = useAuth();
  const { reports } = useAppStore();
  const navigate = useNavigate();

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-2xl shadow-glass p-10 max-w-sm w-full mx-4">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profilingizga kiring</h2>
          <p className="text-sm text-gray-500 mb-6">Profilni ko'rish uchun tizimga kiring</p>
          <button onClick={() => openAuthModal('login')} className="city-btn-primary w-full justify-center">Kirish</button>
        </div>
      </div>
    );
  }

  const myReports = reports.filter(r => r.authorId === currentUser.id);
  const myVotes = reports.filter(r => r.isVoted).length;
  const roleLabel = currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'organization' ? 'Tashkilot' : 'Fuqaro';
  const roleIcon = currentUser.role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : currentUser.role === 'organization' ? <Building2 className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />;
  const roleColors = { admin: 'bg-red-100 text-red-700', organization: 'bg-blue-100 text-[#2563EB]', citizen: 'bg-green-100 text-green-700' };

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Orqaga
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-glass overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-[#1D4ED8] to-[#2563EB]" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="w-20 h-20 rounded-2xl border-4 border-white overflow-hidden bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] font-black text-2xl shadow-glass">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                ) : getInitials(currentUser.name)}
              </div>
              <div className="flex gap-2">
                <button className="city-btn-secondary text-xs py-2"><Edit3 className="w-3.5 h-3.5" /> Tahrirlash</button>
                <button onClick={() => { logout(); navigate('/'); }} className="city-btn-ghost text-xs py-2 text-red-500 hover:bg-red-50"><LogOut className="w-3.5 h-3.5" /> Chiqish</button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-gray-900">{currentUser.name}</h1>
              <span className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full', roleColors[currentUser.role])}>
                {roleIcon}{roleLabel}
              </span>
              {currentUser.isVerified && <span className="text-xs bg-blue-50 text-[#2563EB] font-semibold px-2 py-1 rounded-full">✓ Tasdiqlangan</span>}
            </div>
            <p className="text-sm text-gray-500 mb-4">{currentUser.email}</p>

            {currentUser.bio && <p className="text-sm text-gray-700 mb-4">{currentUser.bio}</p>}

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {currentUser.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" />{currentUser.phone}</span>}
              {currentUser.district && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" />{currentUser.district}</span>}
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-gray-400" />{formatDate(currentUser.createdAt)} dan beri</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Muammolar', value: myReports.length, icon: ClipboardList, color: '#2563EB', bg: '#EFF6FF' },
            { label: 'Ovozlar', value: myVotes, icon: ThumbsUp, color: '#16A34A', bg: '#F0FDF4' },
            { label: "Ko'rishlar", value: myReports.reduce((s, r) => s + r.viewCount, 0), icon: MapPin, color: '#7C3AED', bg: '#EDE9FE' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* My Reports */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Mening muammolarim</h2>
          {myReports.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Hali muammo bildirmagansiz</p>
              <button onClick={() => navigate('/reports/new')} className="city-btn-primary mt-4 text-sm">Muammo bildirish</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myReports.map(r => <ReportCard key={r.id} report={r} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
