import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, Clock, Star, Phone, Mail, Globe, FileText,
  Award, Building2, Shield, CheckCheck, AlertTriangle, ChevronRight,
  Inbox, PlayCircle, XCircle, ClipboardCheck, BarChart3
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { CATEGORIES, STATUS_CONFIG } from '@/constants/categories';
import { getInitials, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/features/reports/StatusBadge';
import CategoryBadge from '@/components/features/reports/CategoryBadge';
import { Report } from '@/types';
import OrgReportWorkflow from '@/components/features/reports/OrgReportWorkflow';

type TabId = 'new' | 'active' | 'completed' | 'all' | 'stats';

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { organizations, reports, currentUser } = useAppStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>('new');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const org = organizations.find(o => o.id === id);
  const orgReports = reports.filter(r => r.organizationId === id);

  const newReports = orgReports.filter(r => r.status === 'new');
  const activeReports = orgReports.filter(r => ['review', 'accepted', 'inprogress'].includes(r.status));
  const completedReports = orgReports.filter(r => r.status === 'completed');
  const rejectedReports = orgReports.filter(r => ['rejected', 'ignored'].includes(r.status));

  // Can this user manage this org's reports?
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'organization';

  if (!org) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🏢</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Tashkilot topilmadi</h2>
          <button onClick={() => navigate('/organizations')} className="city-btn-secondary mt-4">Orqaga</button>
        </div>
      </div>
    );
  }

  const solvedRate = orgReports.length > 0 ? Math.round((completedReports.length / orgReports.length) * 100) : 0;

  const tabs: { id: TabId; label: string; count: number; icon: React.ReactNode; color: string }[] = [
    { id: 'new', label: 'Yangi', count: newReports.length, icon: <Inbox className="w-4 h-4" />, color: '#DC2626' },
    { id: 'active', label: 'Aktiv', count: activeReports.length, icon: <PlayCircle className="w-4 h-4" />, color: '#2563EB' },
    { id: 'completed', label: 'Bajarildi', count: completedReports.length, icon: <CheckCheck className="w-4 h-4" />, color: '#16A34A' },
    { id: 'all', label: 'Barchasi', count: orgReports.length, icon: <FileText className="w-4 h-4" />, color: '#6B7280' },
    { id: 'stats', label: 'Statistika', count: 0, icon: <BarChart3 className="w-4 h-4" />, color: '#7C3AED' },
  ];

  const tabReports: Record<TabId, Report[]> = {
    new: newReports,
    active: activeReports,
    completed: completedReports,
    all: orgReports,
    stats: [],
  };

  return (
    <div className="min-h-screen pt-16 bg-gray-50">

      {/* ── ORG HEADER ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-5 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Orqaga
          </button>

          <div className="flex items-start gap-5">
            {/* Logo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EFF6FF] border-2 border-[#BFDBFE] flex items-center justify-center flex-shrink-0">
              <div className="text-center">
                <Building2 className="w-7 h-7 sm:w-9 sm:h-9 text-[#2563EB] mx-auto" />
                <span className="text-[9px] font-black text-[#2563EB] tracking-tight leading-none">{getInitials(org.name)}</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{org.name}</h1>
                {org.verified && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    <Shield className="w-3 h-3" /> Tasdiqlangan tashkilot
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-3 leading-relaxed">{org.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {org.categoryIds.map(cid => {
                  const cat = CATEGORIES.find(c => c.id === cid);
                  return cat ? (
                    <span key={cid} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: cat.bgColor, color: cat.color }}>
                      {cat.icon} {cat.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Rating (desktop) */}
            <div className="hidden sm:flex flex-col items-center p-4 bg-amber-50 rounded-2xl border border-amber-200 flex-shrink-0">
              <Star className="w-5 h-5 text-amber-500 fill-current mb-1" />
              <span className="text-2xl font-black text-gray-900">{org.rating}</span>
              <span className="text-xs text-gray-500">/ 5.0</span>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { label: 'Jami so\'rovlar', value: orgReports.length, icon: '📋', color: '#7C3AED', bg: '#EDE9FE' },
              { label: 'Bajarildi', value: completedReports.length, icon: '✅', color: '#16A34A', bg: '#F0FDF4' },
              { label: 'Jarayonda', value: activeReports.length, icon: '🔄', color: '#2563EB', bg: '#EFF6FF' },
              { label: 'Samaradorlik', value: `${solvedRate}%`, icon: '📈', color: '#D97706', bg: '#FEF3C7' },
            ].map(({ label, value, icon, color, bg }) => (
              <div key={label} className="rounded-xl p-3 sm:p-4 flex items-center gap-3" style={{ backgroundColor: bg }}>
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-lg sm:text-xl font-black leading-none" style={{ color }}>{value}</p>
                  <p className="text-xs mt-0.5 opacity-75" style={{ color }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── MAIN COLUMN (tabs + reports) ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-glass overflow-hidden">
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 border-b-2',
                      tab === t.id
                        ? 'border-current text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    )}
                    style={tab === t.id ? { color: t.color, borderColor: t.color } : {}}
                  >
                    <span style={tab === t.id ? { color: t.color } : {}}>{t.icon}</span>
                    {t.label}
                    {t.count > 0 && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center"
                        style={tab === t.id ? { backgroundColor: t.color + '20', color: t.color } : { backgroundColor: '#F3F4F6', color: '#6B7280' }}
                      >
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {tab === 'stats' ? (
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Holat bo'yicha taqsimot</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Yangi', count: newReports.length, color: '#DC2626', bg: '#FEF2F2' },
                      { label: 'Ko\'rib chiqilmoqda', count: orgReports.filter(r => r.status === 'review').length, color: '#EA580C', bg: '#FFF7ED' },
                      { label: 'Qabul qilindi', count: orgReports.filter(r => r.status === 'accepted').length, color: '#CA8A04', bg: '#FEFCE8' },
                      { label: 'Jarayonda', count: orgReports.filter(r => r.status === 'inprogress').length, color: '#2563EB', bg: '#EFF6FF' },
                      { label: 'Bajarildi', count: completedReports.length, color: '#16A34A', bg: '#F0FDF4' },
                      { label: 'Rad etildi', count: rejectedReports.length, color: '#6B7280', bg: '#F3F4F6' },
                    ].map(({ label, count, color, bg }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs text-gray-600 w-36 flex-shrink-0">{label}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                            style={{
                              width: orgReports.length ? `${Math.max(4, (count / orgReports.length) * 100)}%` : '4%',
                              backgroundColor: bg,
                              border: `1px solid ${color}30`,
                            }}
                          >
                            <span className="text-[10px] font-bold" style={{ color }}>{count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">O'rtacha javob vaqti</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{org.avgResponseTime}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Samaradorlik ko'rsatkichi</p>
                      <p className="text-lg font-bold text-green-700 mt-1">{solvedRate}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {tabReports[tab].length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Bu bo'limda muammo yo'q</p>
                    </div>
                  ) : (
                    tabReports[tab].map(report => (
                      <OrgReportRow
                        key={report.id}
                        report={report}
                        canManage={canManage}
                        isSelected={selectedReport?.id === report.id}
                        onSelect={() => setSelectedReport(
                          selectedReport?.id === report.id ? null : report
                        )}
                        onNavigate={() => navigate(`/reports/${report.id}`)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-4">

            {/* Workflow panel (when report selected) */}
            {selectedReport && canManage && (
              <OrgReportWorkflow
                report={selectedReport}
                onClose={() => setSelectedReport(null)}
              />
            )}

            {/* Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#2563EB]" /> Aloqa ma'lumotlari
              </h3>
              <div className="space-y-3">
                <a href={`tel:${org.phone}`}
                  className="flex items-center gap-3 text-sm text-gray-700 hover:text-[#2563EB] transition-colors p-2 rounded-lg hover:bg-blue-50">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  {org.phone}
                </a>
                <a href={`mailto:${org.email}`}
                  className="flex items-center gap-3 text-sm text-gray-700 hover:text-[#2563EB] transition-colors p-2 rounded-lg hover:bg-blue-50">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  {org.email}
                </a>
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-700 hover:text-[#2563EB] transition-colors p-2 rounded-lg hover:bg-blue-50">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    Rasmiy sayt
                  </a>
                )}
              </div>
            </div>

            {/* Performance */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#2563EB]" /> Samaradorlik
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-500">O'rtacha javob vaqti</span>
                  <span className="text-sm font-bold text-gray-900">⏱️ {org.avgResponseTime}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-500">Reyting</span>
                  <span className="text-sm font-bold text-amber-600">⭐ {org.rating}/5.0</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-gray-500">Qo'shilgan</span>
                  <span className="text-sm font-bold text-gray-900">📅 {new Date(org.joinedAt).getFullYear()}</span>
                </div>
              </div>
              {/* Solved rate bar */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Hal etish darajasi</span>
                  <span className="text-xs font-bold text-green-700">{solvedRate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#16A34A] transition-all duration-700"
                    style={{ width: `${solvedRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Hint for managers */}
            {canManage && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-semibold text-[#2563EB] mb-1">💡 Boshqaruv paneli</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Muammoni tanlang — o'ng tomonda holat o'zgartirish, qabul qilish yoki tugatish amallarini bajaring.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Report row component ──
interface RowProps {
  report: Report;
  canManage: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onNavigate: () => void;
}

function OrgReportRow({ report, canManage, isSelected, onSelect, onNavigate }: RowProps) {
  const isUrgent = report.priority === 'urgent';
  const isNew = report.status === 'new';

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer group',
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50',
        isUrgent && !isSelected && 'border-l-2 border-red-400'
      )}
      onClick={canManage ? onSelect : onNavigate}
    >
      {/* New dot */}
      <div className="flex-shrink-0 mt-1.5">
        {isNew ? (
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 block animate-pulse" />
        ) : (
          <span className="w-2.5 h-2.5 rounded-full bg-gray-200 block" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold text-gray-900 line-clamp-1', isNew && 'text-gray-900')}>
              {report.title}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <StatusBadge status={report.status} size="sm" />
              <CategoryBadge categoryId={report.categoryId} size="sm" />
              {isUrgent && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> Shoshilinch
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-900">👍 {report.votes}</p>
              <p className="text-[10px] text-gray-400">{formatDate(report.createdAt)}</p>
            </div>
            {canManage ? (
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                isSelected ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-[#EFF6FF] group-hover:text-[#2563EB]'
              )}>
                <ClipboardCheck className="w-3.5 h-3.5" />
              </div>
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
          📍 {report.location.address}
        </p>
      </div>
    </div>
  );
}
