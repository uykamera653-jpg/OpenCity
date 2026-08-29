import { useState } from 'react';
import { Shield, Users, Building2, ClipboardList, Settings, CheckCircle, XCircle, Eye, Trash2, Search } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '@/constants/categories';
import { CategoryId } from '@/types';
import StatusBadge from '@/components/features/reports/StatusBadge';
import CategoryBadge from '@/components/features/reports/CategoryBadge';
import { formatDate, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

type TabKey = 'users' | 'organizations' | 'reports' | 'routing';

export default function AdminPage() {
  const { currentUser, isAdmin } = useAuth();
  const { users, organizations, reports, blockUser, unblockUser, routingRules, updateRoutingRule } = useAppStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('users');
  const [search, setSearch] = useState('');

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Kirish taqiqlangan</h2>
          <p className="text-sm text-gray-500 mb-5">Admin paneliga faqat administratorlar kira oladi</p>
          <button onClick={() => navigate('/')} className="city-btn-secondary">Bosh sahifaga qaytish</button>
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'users', label: 'Foydalanuvchilar', icon: Users, count: users.length },
    { key: 'organizations', label: 'Tashkilotlar', icon: Building2, count: organizations.length },
    { key: 'reports', label: 'Muammolar', icon: ClipboardList, count: reports.length },
    { key: 'routing', label: "Yo'naltirish", icon: Settings },
  ];

  const filteredUsers = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const filteredReports = reports.filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()));
  const filteredOrgs = organizations.filter(o => !search || o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-gray-300 text-sm">Tizim boshqaruvi · {currentUser?.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Foydalanuvchilar', value: users.length },
              { label: 'Tashkilotlar', value: organizations.length },
              { label: 'Muammolar', value: reports.length },
              { label: 'Hal qilindi', value: reports.filter(r => r.status === 'completed').length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-gray-300 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs — scrollable on mobile */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0',
                tab === key ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
              {count !== undefined && (
                <span className={cn('text-xs px-1.5 py-0.5 rounded-full', tab === key ? 'bg-white/20' : 'bg-gray-100')}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        {tab !== 'routing' && (
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="city-input pl-9 py-2 text-sm"
              placeholder="Qidirish..."
            />
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Foydalanuvchi', 'Email', 'Rol', 'Muammolar', 'Holat', 'Amallar'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] text-xs font-bold overflow-hidden flex-shrink-0">
                            {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(u.name)}
                          </div>
                          <span className="font-medium text-gray-900 whitespace-nowrap">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap',
                          u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'organization' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700')}>
                          {u.role === 'admin' ? 'Admin' : u.role === 'organization' ? 'Tashkilot' : 'Fuqaro'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.reportsCount}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap',
                          u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700')}>
                          {u.isBlocked ? 'Bloklangan' : 'Faol'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.isBlocked ? (
                          <button onClick={() => unblockUser(u.id)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors" title="Blokdan chiqarish">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => blockUser(u.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Bloklash">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Organizations */}
        {tab === 'organizations' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Tashkilot', 'Kategoriyalar', 'Bajarildi', 'Aktiv', 'Holat', 'Amallar'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrgs.map(org => (
                    <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] text-xs font-bold flex-shrink-0">{getInitials(org.name)}</div>
                          <span className="font-medium text-gray-900 whitespace-nowrap max-w-[160px] truncate">{org.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {org.categoryIds.slice(0, 2).map(cid => <CategoryBadge key={cid} categoryId={cid as CategoryId} size="sm" />)}
                          {org.categoryIds.length > 2 && <span className="text-xs text-gray-400">+{org.categoryIds.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-green-600 font-semibold">{org.completedReports}</td>
                      <td className="px-4 py-3 text-[#2563EB] font-semibold">{org.activeReports}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap',
                          org.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>
                          {org.verified ? 'Tasdiqlangan' : 'Kutmoqda'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/organizations/${org.id}`)} className="p-1.5 rounded-lg text-[#2563EB] hover:bg-blue-50 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Muammo', 'Kategoriya', 'Holat', 'Ovoz', 'Sana', 'Amallar'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredReports.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 max-w-[180px] truncate">{r.title}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">{r.location.address}</p>
                      </td>
                      <td className="px-4 py-3"><CategoryBadge categoryId={r.categoryId} size="sm" /></td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} size="sm" /></td>
                      <td className="px-4 py-3"><span className="font-semibold text-[#2563EB] whitespace-nowrap">👍 {r.votes}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => navigate(`/reports/${r.id}`)} className="p-1.5 rounded-lg text-[#2563EB] hover:bg-blue-50 transition-colors"><Eye className="w-4 h-4" /></button>
                          <button className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Routing Rules */}
        {tab === 'routing' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-5 sm:p-6">
            <h2 className="font-bold text-gray-900 mb-1">Avtomatik yo'naltirish qoidalari</h2>
            <p className="text-sm text-gray-500 mb-5">Har bir kategoriya qaysi tashkilotga yo'naltirilishini belgilang</p>
            <div className="space-y-2.5">
              {routingRules.map(rule => {
                const cat = CATEGORIES.find(c => c.id === rule.categoryId);
                return (
                  <div key={rule.categoryId} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-2 sm:w-44 flex-shrink-0">
                      <span className="text-lg">{cat?.icon}</span>
                      <span className="text-sm font-semibold text-gray-800">{cat?.name}</span>
                    </div>
                    <div className="hidden sm:block text-gray-400 text-lg">→</div>
                    <select
                      value={rule.organizationId}
                      onChange={e => {
                        const org = organizations.find(o => o.id === e.target.value);
                        if (org) updateRoutingRule(rule.categoryId, org.id, org.name);
                      }}
                      className="city-input flex-1 py-2 text-sm"
                    >
                      {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
