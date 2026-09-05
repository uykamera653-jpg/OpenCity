import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, SlidersHorizontal, X, TrendingUp,
  CheckCircle2, Clock, AlertCircle, ChevronRight, Megaphone, Layers
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES, STATUS_CONFIG, ANNOUNCEMENT_TYPE_CONFIG } from '@/constants/categories';
import { CategoryId, ReportStatus, Report, MapAnnouncement } from '@/types';
import { formatNumber } from '@/lib/utils';
import MapView from '@/components/features/map/MapView';
import MapReportPanel from '@/components/features/map/MapReportPanel';
import AnnouncementPanel from '@/components/features/map/AnnouncementPanel';
import CreateAnnouncementModal from '@/components/features/map/CreateAnnouncementModal';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { reports, announcements } = useAppStore();
  const { isAuthenticated, openAuthModal, currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'all'>('all');
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<MapAnnouncement | null>(null);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);

  const filteredReports = useMemo(() => reports.filter(r => {
    const matchCat = selectedCategory === 'all' || r.categoryId === selectedCategory;
    const matchStatus = selectedStatus === 'all' || r.status === selectedStatus;
    const matchSearch = !searchQuery
      || r.title.toLowerCase().includes(searchQuery.toLowerCase())
      || r.location.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchStatus && matchSearch;
  }), [reports, selectedCategory, selectedStatus, searchQuery]);

  const activeAnnouncements = useMemo(() =>
    showAnnouncements ? announcements.filter(a => a.status !== 'expired') : [],
    [announcements, showAnnouncements]
  );

  const stats = useMemo(() => ({
    total: reports.length,
    new: reports.filter(r => r.status === 'new').length,
    inprogress: reports.filter(r => r.status === 'inprogress').length,
    completed: reports.filter(r => r.status === 'completed').length,
  }), [reports]);

  const topReports = useMemo(() => [...reports].sort((a, b) => b.votes - a.votes).slice(0, 5), [reports]);
  const statuses: (ReportStatus | 'all')[] = ['all', 'new', 'review', 'inprogress', 'completed', 'rejected'];

  const isOrgOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'organization';
  const [mapCenter, setMapCenter] = useState<[number,number]>([41.2995, 69.2401]);
  const handleAutoLocated = (lat: number, lng: number) => setMapCenter([lat, lng]);

  const handleMarkerClick = (report: Report) => {
    setSelectedReport(report);
    setSelectedAnnouncement(null);
    setPanelOpen(false);
  };

  const handleAnnouncementClick = (ann: MapAnnouncement) => {
    setSelectedAnnouncement(ann);
    setSelectedReport(null);
    setPanelOpen(false);
  };

  const handleCloseDetail = () => {
    setSelectedReport(null);
    setSelectedAnnouncement(null);
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ top: 96 }}>

      {/* ── MOBILE TOP BAR ── */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100 z-20 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="city-input pl-9 pr-8 py-2 text-sm"
            placeholder="Muammo qidirish..."
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => { setPanelOpen(!panelOpen); handleCloseDetail(); }}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg border transition-colors flex-shrink-0',
            panelOpen ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-gray-600 border-gray-200'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* ── MAIN ROW ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Desktop left panel */}
        <div className={cn(
          'hidden md:flex h-full bg-white border-r border-gray-100 overflow-y-auto flex-shrink-0 transition-all duration-300',
          panelOpen ? 'w-72' : 'w-0 overflow-hidden'
        )}>
          <FilterPanel
            searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            stats={stats} reports={reports}
            selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
            selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
            statuses={statuses} topReports={topReports}
            selectedReport={selectedReport} setSelectedReport={r => { setSelectedReport(r); setSelectedAnnouncement(null); }}
            announcements={announcements}
            selectedAnnouncement={selectedAnnouncement}
            setSelectedAnnouncement={a => { setSelectedAnnouncement(a); setSelectedReport(null); }}
            showAnnouncements={showAnnouncements}
            setShowAnnouncements={setShowAnnouncements}
          />
        </div>

        {/* Mobile overlay panel */}
        {panelOpen && (
          <div className="md:hidden absolute inset-0 z-30 flex">
            <div className="w-[85vw] max-w-xs bg-white overflow-y-auto shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <span className="font-bold text-gray-900 text-sm">Filtrlar</span>
                <button onClick={() => setPanelOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <FilterPanel
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                stats={stats} reports={reports}
                selectedCategory={selectedCategory}
                setSelectedCategory={v => { setSelectedCategory(v); setPanelOpen(false); }}
                selectedStatus={selectedStatus}
                setSelectedStatus={v => { setSelectedStatus(v); setPanelOpen(false); }}
                statuses={statuses} topReports={topReports}
                selectedReport={selectedReport}
                setSelectedReport={r => { setSelectedReport(r); setSelectedAnnouncement(null); setPanelOpen(false); }}
                announcements={announcements}
                selectedAnnouncement={selectedAnnouncement}
                setSelectedAnnouncement={a => { setSelectedAnnouncement(a); setSelectedReport(null); setPanelOpen(false); }}
                showAnnouncements={showAnnouncements}
                setShowAnnouncements={setShowAnnouncements}
              />
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setPanelOpen(false)} />
          </div>
        )}

        {/* ── MAP ── */}
        <div className="flex-1 relative min-w-0 overflow-hidden">
          {/* Desktop toggle */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="hidden md:flex absolute top-4 left-4 z-10 bg-white rounded-xl shadow-glass px-3 py-2 items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-100"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {panelOpen ? 'Yopish' : 'Filtrlar'}
          </button>

          {/* Count chip */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            <div className="bg-white rounded-full shadow-glass px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-700 border border-gray-100 pointer-events-none whitespace-nowrap">
              🗺️ {filteredReports.length} ta muammo
            </div>
            {activeAnnouncements.length > 0 && (
              <div className="bg-amber-500 text-white rounded-full shadow-glass px-2.5 py-1.5 text-xs font-bold border border-amber-400 pointer-events-none whitespace-nowrap">
                📢 {activeAnnouncements.length} e'lon
              </div>
            )}
          </div>

          {/* FAB group */}
          <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-2 items-end">
            {/* Announcement toggle */}
            <button
              onClick={() => setShowAnnouncements(!showAnnouncements)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shadow-glass border transition-all',
                showAnnouncements
                  ? 'bg-amber-500 text-white border-amber-400'
                  : 'bg-white text-gray-600 border-gray-200'
              )}
              title={showAnnouncements ? "E'lonlarni yashirish" : "E'lonlarni ko'rsatish"}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showAnnouncements ? "E'lonlar yoqiq" : "E'lonlar"}</span>
            </button>

            {/* Org: create announcement */}
            {isOrgOrAdmin && (
              <button
                onClick={() => setShowCreateAnnouncement(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shadow-glass border bg-blue-700 text-white border-blue-600 hover:bg-blue-800 transition-colors"
                title="E'lon qo'shish"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">E'lon qo'shish</span>
              </button>
            )}

            {/* Report FAB */}
            <button
              onClick={() => isAuthenticated ? navigate('/reports/new') : openAuthModal('login')}
              className="city-btn-primary w-14 h-14 rounded-full shadow-lg p-0 flex items-center justify-center"
              title="Muammo bildirish"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-6 left-4 z-10 bg-white/90 backdrop-blur-md rounded-xl shadow-glass border border-gray-100 p-2.5 hidden sm:block">
            <p className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Belgilar
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, conf]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: conf.markerColor }} />
                  <span className="truncate">{conf.label}</span>
                </div>
              ))}
            </div>
            {activeAnnouncements.length > 0 && (
              <>
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <p className="text-[10px] font-bold text-gray-500 mb-1">E'lonlar</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-8 h-1.5 rounded-full" style={{ background: 'repeating-linear-gradient(90deg, #DC2626 0, #DC2626 6px, transparent 6px, transparent 10px)' }} />
                    <span>Yopiq yo'l</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                    <div className="w-8 h-1.5 rounded-full bg-green-500" style={{ background: 'repeating-linear-gradient(90deg, #16A34A 0, #16A34A 8px, transparent 8px, transparent 13px)' }} />
                    <span>Muqobil yo'l</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <MapView
            reports={filteredReports}
            announcements={activeAnnouncements}
            height="100%"
            center={mapCenter}
            selectedId={selectedReport?.id}
            selectedAnnouncementId={selectedAnnouncement?.id}
            onMarkerClick={handleMarkerClick}
            onAnnouncementClick={handleAnnouncementClick}
            autoLocate
            onAutoLocated={handleAutoLocated}
          />
        </div>

        {/* ── DETAIL PANEL (Report or Announcement) ── */}
        {(selectedReport || selectedAnnouncement) && (
          <>
            {/* Mobile: full overlay */}
            <div className="md:hidden absolute inset-0 z-30 flex flex-col bg-white animate-slide-in-right overflow-hidden">
              {selectedReport && (
                <MapReportPanel
                  key={selectedReport.id}
                  report={reports.find(r => r.id === selectedReport.id) || selectedReport}
                  onClose={handleCloseDetail}
                />
              )}
              {selectedAnnouncement && (
                <AnnouncementPanel
                  key={selectedAnnouncement.id}
                  announcement={announcements.find(a => a.id === selectedAnnouncement.id) || selectedAnnouncement}
                  onClose={handleCloseDetail}
                />
              )}
            </div>
            {/* Desktop: side panel */}
            <div className="hidden md:flex w-96 h-full flex-shrink-0">
              {selectedReport && (
                <MapReportPanel
                  key={selectedReport.id}
                  report={reports.find(r => r.id === selectedReport.id) || selectedReport}
                  onClose={handleCloseDetail}
                />
              )}
              {selectedAnnouncement && (
                <AnnouncementPanel
                  key={selectedAnnouncement.id}
                  announcement={announcements.find(a => a.id === selectedAnnouncement.id) || selectedAnnouncement}
                  onClose={handleCloseDetail}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* ── MOBILE BOTTOM STATUS TABS ── */}
      {!selectedReport && !selectedAnnouncement && !panelOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-3 py-2 flex gap-2 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setSelectedStatus('all')}
            className={cn(
              'flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium border transition-all',
              selectedStatus === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-600 border-gray-200'
            )}
          >
            Barchasi
          </button>
          {(statuses.filter(s => s !== 'all') as ReportStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={cn(
                'flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium border transition-all whitespace-nowrap',
                selectedStatus === s ? '' : 'text-gray-600 border-gray-200'
              )}
              style={selectedStatus === s ? {
                backgroundColor: STATUS_CONFIG[s].bgColor,
                color: STATUS_CONFIG[s].color,
                borderColor: STATUS_CONFIG[s].borderColor,
              } : {}}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateAnnouncement && (
        <CreateAnnouncementModal onClose={() => setShowCreateAnnouncement(false)} />
      )}
    </div>
  );
}

// ── Filter Panel ──
interface FilterPanelProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  stats: { total: number; new: number; inprogress: number; completed: number };
  reports: Report[];
  selectedCategory: CategoryId | 'all';
  setSelectedCategory: (v: CategoryId | 'all') => void;
  selectedStatus: ReportStatus | 'all';
  setSelectedStatus: (v: ReportStatus | 'all') => void;
  statuses: (ReportStatus | 'all')[];
  topReports: Report[];
  selectedReport: Report | null;
  setSelectedReport: (r: Report) => void;
  announcements: MapAnnouncement[];
  selectedAnnouncement: MapAnnouncement | null;
  setSelectedAnnouncement: (a: MapAnnouncement) => void;
  showAnnouncements: boolean;
  setShowAnnouncements: (v: boolean) => void;
}

function FilterPanel({
  searchQuery, setSearchQuery, stats, reports,
  selectedCategory, setSelectedCategory,
  selectedStatus, setSelectedStatus,
  statuses, topReports, selectedReport, setSelectedReport,
  announcements, selectedAnnouncement, setSelectedAnnouncement,
  showAnnouncements, setShowAnnouncements,
}: FilterPanelProps) {
  const activeAnn = announcements.filter(a => a.status !== 'expired');

  return (
    <div className="p-4 space-y-4 w-72">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="city-input pl-9 pr-9 py-2.5 text-sm"
          placeholder="Muammo yoki manzil..."
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Jami', value: stats.total, color: '#2563EB', bg: '#EFF6FF', Icon: TrendingUp },
          { label: 'Yangi', value: stats.new, color: '#DC2626', bg: '#FEF2F2', Icon: AlertCircle },
          { label: 'Jarayonda', value: stats.inprogress, color: '#2563EB', bg: '#EFF6FF', Icon: Clock },
          { label: 'Bajarildi', value: stats.completed, color: '#16A34A', bg: '#F0FDF4', Icon: CheckCircle2 },
        ].map(({ label, value, color, bg, Icon }) => (
          <div key={label} className="rounded-lg p-3" style={{ backgroundColor: bg }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <span className="text-xs font-medium" style={{ color }}>{label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatNumber(value)}</p>
          </div>
        ))}
      </div>

      {/* Announcements section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Megaphone className="w-3 h-3" /> E'lonlar
            {activeAnn.length > 0 && (
              <span className="ml-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {activeAnn.length}
              </span>
            )}
          </p>
          <button
            onClick={() => setShowAnnouncements(!showAnnouncements)}
            className={cn(
              'text-[10px] px-2 py-1 rounded-full font-semibold border transition-all',
              showAnnouncements ? 'bg-amber-100 text-amber-700 border-amber-300' : 'text-gray-500 border-gray-200'
            )}
          >
            {showAnnouncements ? 'Yoqiq' : 'O\'chirilgan'}
          </button>
        </div>
        {activeAnn.length === 0 ? (
          <div className="text-center py-3 text-xs text-gray-400">Faol e'lon yo'q</div>
        ) : (
          <div className="space-y-1.5">
            {activeAnn.map(ann => {
              const tc = ANNOUNCEMENT_TYPE_CONFIG[ann.type];
              return (
                <button
                  key={ann.id}
                  onClick={() => setSelectedAnnouncement(ann)}
                  className={cn(
                    'w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg transition-colors border',
                    selectedAnnouncement?.id === ann.id ? '' : 'border-gray-100 hover:bg-gray-50'
                  )}
                  style={selectedAnnouncement?.id === ann.id ? {
                    backgroundColor: tc.bgColor, borderColor: tc.color + '40'
                  } : {}}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{tc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-1">{ann.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: tc.color }}>{tc.label}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Kategoriya</p>
        <div className="space-y-0.5">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
              selectedCategory === 'all' ? 'bg-[#2563EB] text-white font-medium' : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            Barchasi ({reports.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = reports.filter(r => r.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as CategoryId)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors',
                  selectedCategory === cat.id ? 'font-medium' : 'text-gray-600 hover:bg-gray-100'
                )}
                style={selectedCategory === cat.id ? { backgroundColor: cat.bgColor, color: cat.color } : {}}
              >
                <span className="flex items-center gap-2"><span>{cat.icon}</span>{cat.name}</span>
                <span className="text-xs opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Holat</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedStatus('all')}
            className={cn(
              'text-xs px-2.5 py-1 rounded-full font-medium border transition-all',
              selectedStatus === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-600 border-gray-200 hover:border-gray-400'
            )}
          >
            Barchasi
          </button>
          {(statuses.filter(s => s !== 'all') as ReportStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full font-medium border transition-all',
                selectedStatus === s ? '' : 'text-gray-600 border-gray-200 hover:border-gray-400'
              )}
              style={selectedStatus === s ? {
                backgroundColor: STATUS_CONFIG[s].bgColor,
                color: STATUS_CONFIG[s].color,
                borderColor: STATUS_CONFIG[s].borderColor,
              } : {}}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Top voted */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top muammolar</p>
        <div className="space-y-1.5">
          {topReports.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r)}
              className={cn(
                'w-full text-left flex items-center gap-2.5 p-2.5 rounded-lg transition-colors border',
                selectedReport?.id === r.id ? 'border-[#2563EB]/30 bg-[#EFF6FF]' : 'border-gray-100 hover:bg-gray-50'
              )}
            >
              <span
                className="text-lg font-black flex-shrink-0"
                style={{ color: i === 0 ? '#DC2626' : i === 1 ? '#EA580C' : '#6B7280' }}
              >
                #{i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{r.title}</p>
                <p className="text-xs text-gray-400">👍 {r.votes} ovoz</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
