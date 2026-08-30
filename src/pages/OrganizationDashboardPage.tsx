import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

export default function OrganizationDashboardPage() {
  const { currentUser, isOrganization, isAuthenticated } = useAuth();
  const { organizations, reports, refresh } = useAppStore();
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!supabase || !currentUser || !isOrganization) {
        if (live) setLoading(false);
        return;
      }
      const { data } = await supabase.from('profiles').select('organization_id').eq('id', currentUser.id).maybeSingle();
      if (live) { setOrgId(data?.organization_id || ''); setLoading(false); }
    })();
    return () => { live = false; };
  }, [currentUser, isOrganization]);

  useEffect(() => { if (orgId) void refresh(); }, [orgId, refresh]);

  if (!isAuthenticated) return <Gate title="Tashkilot kabineti" text="Avval tizimga kiring." action={() => navigate('/')} />;
  if (!isOrganization) return <Gate title="Ruxsat yo'q" text="Bu bo'lim faqat tasdiqlangan tashkilot xodimlari uchun." action={() => navigate('/')} />;
  if (loading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50">
      <RefreshCw className="w-7 h-7 text-[#2563EB] animate-spin" />
    </div>
  );
  if (!orgId) return <Gate title="Tashkilot biriktirilmagan" text="Admin profilingizga tashkilot biriktirgandan keyin kabinet ochiladi." action={() => navigate('/profile')} />;

  const org = organizations.find(o => o.id === orgId);
  const own = reports.filter(r => r.organizationId === orgId);
  const newCount = own.filter(r => r.status === 'new').length;
  const active = own.filter(r => ['review', 'accepted', 'inprogress'].includes(r.status)).length;
  const done = own.filter(r => r.status === 'completed').length;

  const statCards = [
    { n: newCount, l: 'Yangi', cls: 'bg-red-50 text-red-700 border-red-100' },
    { n: active, l: 'Jarayonda', cls: 'bg-blue-50 text-[#2563EB] border-blue-100' },
    { n: done, l: 'Bajarildi', cls: 'bg-green-50 text-green-700 border-green-100' },
    { n: own.length, l: 'Jami', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  ];

  return (
    <div className="min-h-screen pt-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-glass border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-[#2563EB]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-gray-900">{org?.name || 'Tashkilot kabineti'}</h1>
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-gray-500 mt-1 text-sm">
                {org?.district || currentUser.district || 'Hudud'} · {currentUser.name}
              </p>
            </div>
            <button onClick={() => navigate(`/organizations/${orgId}`)} className="city-btn-primary flex-shrink-0">
              Tashkilot profilini ochish
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map(({ n, l, cls }) => (
            <div key={l} className={cn('rounded-2xl p-5 border', cls)}>
              <div className="text-3xl font-black">{n}</div>
              <div className="text-sm font-medium mt-1">{l}</div>
            </div>
          ))}
        </div>

        {/* Reports list */}
        <div className="bg-white rounded-2xl shadow-glass border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-lg text-gray-900">Murojaatlar</h2>
            <p className="text-sm text-gray-500">Faqat sizga biriktirilgan tashkilot murojaatlari</p>
          </div>

          {own.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Hozircha murojaatlar yo'q.</p>
            </div>
          ) : (
            own.slice(0, 30).map(r => (
              <button
                key={r.id}
                onClick={() => navigate(`/reports/${r.id}`)}
                className="w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'w-2.5 h-2.5 rounded-full flex-shrink-0',
                    r.priority === 'urgent' ? 'bg-red-500 animate-pulse'
                      : r.status === 'completed' ? 'bg-green-500'
                        : 'bg-[#2563EB]'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 truncate">
                      📍 {r.location.address || r.location.district || 'Manzil aniqlanmagan'}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 flex-shrink-0 whitespace-nowrap">
                    {r.status}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* RLS notice */}
        <div className="mt-5 flex gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50 text-sm text-amber-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          Tashkilot xodimining vakolati backend RLS bilan ham tekshiriladi.
        </div>

      </div>
    </div>
  );
}

function Gate({ title, text, action }: { title: string; text: string; action: () => void }) {
  return (
    <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-glass border border-gray-100 p-8 text-center max-w-md w-full">
        <Building2 className="w-10 h-10 text-[#2563EB] mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500 text-sm mt-2 mb-6">{text}</p>
        <button onClick={action} className="city-btn-primary w-full">Davom etish</button>
      </div>
    </div>
  );
}
