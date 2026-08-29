import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle2, Clock, TrendingUp, Award, Users, ThumbsUp } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAppStore } from '@/stores/appStore';
import { DAILY_STATS, MONTHLY_STATS } from '@/lib/mockData';
import { STATUS_CONFIG, getCategoryById } from '@/constants/categories';
import StatsCard from '@/components/features/dashboard/StatsCard';
import ReportCard from '@/components/features/reports/ReportCard';
import { formatNumber } from '@/lib/utils';

const PIE_COLORS = ['#DC2626','#EA580C','#CA8A04','#2563EB','#16A34A','#6B7280','#374151'];

export default function DashboardPage() {
  const { reports, organizations } = useAppStore();
  const navigate = useNavigate();

  const stats = useMemo(() => ({
    total: reports.length,
    completed: reports.filter(r => r.status === 'completed').length,
    pending: reports.filter(r => !['completed','rejected','ignored'].includes(r.status)).length,
    totalVotes: reports.reduce((s, r) => s + r.votes, 0),
  }), [reports]);

  const statusDist = useMemo(() =>
    Object.entries(STATUS_CONFIG).map(([k, v], i) => ({
      name: v.label,
      value: reports.filter(r => r.status === k).length,
      color: PIE_COLORS[i],
    })).filter(d => d.value > 0),
  [reports]);

  const catStats = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => { counts[r.categoryId] = (counts[r.categoryId] || 0) + 1; });
    return Object.entries(counts)
      .map(([id, count]) => ({ name: getCategoryById(id as any).name, count, icon: getCategoryById(id as any).icon }))
      .sort((a, b) => b.count - a.count).slice(0, 8);
  }, [reports]);

  const topOrgs = useMemo(() =>
    [...organizations].sort((a, b) => b.completedReports - a.completedReports).slice(0, 5),
  [organizations]);

  const topReports = useMemo(() =>
    [...reports].sort((a, b) => b.votes - a.votes).slice(0, 3),
  [reports]);

  const solvedRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Toshkent Shahar Dashboard</h1>
          <p className="text-blue-100 text-sm">Real vaqt statistikasi va tahlillar</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Jami muammolar', value: formatNumber(stats.total), icon: '📋' },
              { label: 'Hal qilindi', value: formatNumber(stats.completed), icon: '✅' },
              { label: "Ko'rib chiqilmoqda", value: formatNumber(stats.pending), icon: '⏳' },
              { label: 'Hal etish darajasi', value: `${solvedRate}%`, icon: '📊' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 sm:p-4">
                <p className="text-xl sm:text-2xl mb-1">{icon}</p>
                <p className="text-xl sm:text-2xl font-bold">{value}</p>
                <p className="text-blue-100 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard title="Jami muammolar" value={formatNumber(stats.total)} icon={ClipboardList} color="blue" subtitle="Barcha vaqt" trend={{ value: 12, label: "o'tgan oyga nisbatan" }} />
          <StatsCard title="Bajarildi" value={formatNumber(stats.completed)} icon={CheckCircle2} color="green" subtitle={`${solvedRate}% hal etish darajasi`} trend={{ value: 8, label: "o'tgan oyga nisbatan" }} />
          <StatsCard title="Jarayonda" value={formatNumber(stats.pending)} icon={Clock} color="orange" subtitle="Aktiv muammolar" />
          <StatsCard title="Jami ovozlar" value={formatNumber(stats.totalVotes)} icon={ThumbsUp} color="purple" subtitle="Fuqarolar ishtiroki" trend={{ value: 24, label: "o'tgan oyga nisbatan" }} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Daily trend */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-glass p-4 sm:p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563EB]" />Haftalik dinamika
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={DAILY_STATS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={25} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="count" stroke="#2563EB" fill="#EFF6FF" strokeWidth={2} name="Yangi" />
                <Area type="monotone" dataKey="resolved" stroke="#16A34A" fill="#F0FDF4" strokeWidth={2} name="Hal qilindi" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-4 sm:p-6">
            <h2 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">Holat bo'yicha</h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={45} outerRadius={68} dataKey="value" paddingAngle={3}>
                  {statusDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {statusDist.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-semibold text-gray-700">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Bar + Monthly */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-4 sm:p-6">
            <h2 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">Kategoriyalar bo'yicha</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catStats} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Bar dataKey="count" fill="#2563EB" radius={[0, 6, 6, 0]} name="Muammolar" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-4 sm:p-6">
            <h2 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">Oylik statistika</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MONTHLY_STATS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={25} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Area type="monotone" dataKey="count" stroke="#7C3AED" fill="#EDE9FE" strokeWidth={2} name="Jami" />
                <Area type="monotone" dataKey="resolved" stroke="#16A34A" fill="#F0FDF4" strokeWidth={2} name="Hal qilindi" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Top Orgs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-4 sm:p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563EB]" />Eng faol tashkilotlar
            </h2>
            <div className="space-y-2.5">
              {topOrgs.map((org, i) => (
                <button
                  key={org.id}
                  onClick={() => navigate(`/organizations/${org.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="text-base font-black w-6 flex-shrink-0" style={{ color: i === 0 ? '#DC2626' : i === 1 ? '#EA580C' : '#6B7280' }}>
                    #{i + 1}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] text-xs font-bold flex-shrink-0">
                    {org.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{org.name}</p>
                    <p className="text-xs text-gray-400">✅ {org.completedReports} · ⭐ {org.rating}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#16A34A]">{org.completedReports}</p>
                    <p className="text-[10px] text-gray-400">muammo</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Top Voted */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-4 sm:p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563EB]" />Eng ko'p ovoz olgan
            </h2>
            <div className="space-y-3">
              {topReports.map(r => <ReportCard key={r.id} report={r} compact />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
