import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, CheckCircle, Clock, FileText, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { CATEGORIES } from '@/constants/categories';
import { CategoryId } from '@/types';
import { cn, getInitials } from '@/lib/utils';

export default function OrganizationsPage() {
  const { organizations, reports } = useAppStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<CategoryId | 'all'>('all');

  const filtered = useMemo(() =>
    organizations.filter(o => {
      const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'all' || o.categoryIds.includes(catFilter as CategoryId);
      return matchSearch && matchCat;
    }),
  [organizations, search, catFilter]);

  const getOrgReportCount = (orgId: string) => reports.filter(r => r.organizationId === orgId).length;

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Tashkilotlar</h1>
          <p className="text-sm text-gray-500 mb-5">Shahar muammolarini hal qiluvchi {organizations.length} ta tasdiqlangan tashkilot</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="city-input pl-9 py-2.5 text-sm" placeholder="Tashkilot nomi yoki tavsif..." />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={() => setCatFilter('all')}
              className={cn('text-xs px-3 py-1.5 rounded-full border font-medium transition-all', catFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400')}>
              Barchasi
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCatFilter(cat.id as CategoryId)}
                className={cn('text-xs px-3 py-1.5 rounded-full border font-medium transition-all', catFilter === cat.id ? '' : 'border-gray-200 text-gray-600 hover:border-gray-400')}
                style={catFilter === cat.id ? { backgroundColor: cat.bgColor, color: cat.color, borderColor: cat.color } : {}}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <p className="text-sm text-gray-500 mb-4">{filtered.length} ta tashkilot topildi</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(org => (
            <button key={org.id} onClick={() => navigate(`/organizations/${org.id}`)}
              className="text-left bg-white rounded-2xl border border-gray-100 hover:border-[#2563EB]/30 hover:shadow-glass transition-all duration-200 p-5 group">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] font-bold text-lg flex-shrink-0">
                  {getInitials(org.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-gray-900 text-sm truncate group-hover:text-[#2563EB] transition-colors">{org.name}</p>
                    {org.verified && <CheckCircle className="w-4 h-4 text-[#2563EB] flex-shrink-0" />}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {org.categoryIds.slice(0, 3).map(cid => {
                      const cat = CATEGORIES.find(c => c.id === cid);
                      return cat ? <span key={cid} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: cat.bgColor, color: cat.color }}>{cat.icon} {cat.name}</span> : null;
                    })}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4">{org.description}</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: 'Bajarildi', value: org.completedReports, icon: CheckCircle, color: '#16A34A' },
                  { label: 'Aktiv', value: org.activeReports, icon: Clock, color: '#2563EB' },
                  { label: "Jami so'rov", value: getOrgReportCount(org.id), icon: FileText, color: '#7C3AED' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="text-center">
                    <p className="text-base font-bold" style={{ color }}>{value}</p>
                    <p className="text-[10px] text-gray-400">{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-amber-600 font-medium">
                  <Star className="w-3.5 h-3.5 fill-current" /> {org.rating}
                </span>
                <span className="text-gray-400">⏱️ {org.avgResponseTime}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#2563EB] transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
