import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Grid3X3, List, X, TrendingUp, ArrowUpDown } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES, STATUS_CONFIG } from '@/constants/categories';
import { CategoryId, ReportStatus } from '@/types';
import ReportCard from '@/components/features/reports/ReportCard';
import { cn } from '@/lib/utils';

type SortBy = 'newest' | 'oldest' | 'votes' | 'comments';

export default function ReportsPage() {
  const { reports } = useAppStore();
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = [...reports];
    if (search) list = list.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()) || r.location.address.toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter !== 'all') list = list.filter(r => r.categoryId === categoryFilter);
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter);
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'votes') return b.votes - a.votes;
      if (sortBy === 'comments') return b.comments.length - a.comments.length;
      return 0;
    });
    return list;
  }, [reports, search, categoryFilter, statusFilter, sortBy]);

  const activeFilters = [categoryFilter !== 'all' ? 1 : 0, statusFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-24 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="city-input pl-9 pr-9 py-2 text-sm" placeholder="Muammo, manzil, kalit so'z..." />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-3.5 h-3.5 text-gray-400" /></button>}
          </div>
          <button onClick={() => setFilterOpen(!filterOpen)}
            className={cn('city-btn-secondary text-sm py-2 relative', filterOpen && 'border-[#2563EB] text-[#2563EB]')}>
            <Filter className="w-4 h-4" /> Filtr
            {activeFilters > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#2563EB] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{activeFilters}</span>}
          </button>
          <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={cn('w-9 h-9 flex items-center justify-center', viewMode === 'grid' ? 'bg-[#2563EB] text-white' : 'text-gray-500 hover:bg-gray-50')}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={cn('w-9 h-9 flex items-center justify-center', viewMode === 'list' ? 'bg-[#2563EB] text-white' : 'text-gray-500 hover:bg-gray-50')}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => isAuthenticated ? navigate('/reports/new') : openAuthModal('login')}
            className="city-btn-primary text-sm py-2">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Yangi</span>
          </button>
        </div>

        {/* Filters panel */}
        {filterOpen && (
          <div className="border-t border-gray-100 px-4 sm:px-6 py-4 animate-slide-down">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Kategoriya</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setCategoryFilter('all')} className={cn('text-xs px-3 py-1.5 rounded-full border font-medium transition-all', categoryFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400')}>Barchasi</button>
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setCategoryFilter(cat.id as CategoryId)}
                      className={cn('text-xs px-3 py-1.5 rounded-full border font-medium transition-all', categoryFilter === cat.id ? '' : 'border-gray-200 text-gray-600 hover:border-gray-400')}
                      style={categoryFilter === cat.id ? { backgroundColor: cat.bgColor, color: cat.color, borderColor: cat.color } : {}}>
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Holat</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setStatusFilter('all')} className={cn('text-xs px-3 py-1.5 rounded-full border font-medium transition-all', statusFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600')}>Barchasi</button>
                  {(Object.keys(STATUS_CONFIG) as ReportStatus[]).map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={cn('text-xs px-3 py-1.5 rounded-full border font-medium transition-all', statusFilter === s ? '' : 'border-gray-200 text-gray-600')}
                      style={statusFilter === s ? { backgroundColor: STATUS_CONFIG[s].bgColor, color: STATUS_CONFIG[s].color, borderColor: STATUS_CONFIG[s].color } : {}}>
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Muammolar ro'yxati</h1>
            <p className="text-sm text-gray-500 mt-0.5">{filtered.length} ta muammo topildi</p>
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:border-[#2563EB] bg-white">
              <option value="newest">Eng yangi</option>
              <option value="oldest">Eng eski</option>
              <option value="votes">Ko'p ovoz</option>
              <option value="comments">Ko'p izoh</option>
            </select>
          </div>
        </div>

        {/* Quick status tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[{ key: 'all', label: 'Barchasi', count: reports.length }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ key: k, label: v.label, count: reports.filter(r => r.status === k).length }))].map(({ key, label, count }) => (
            <button key={key} onClick={() => setStatusFilter(key as ReportStatus | 'all')}
              className={cn('flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all whitespace-nowrap',
                statusFilter === key ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400')}>
              {label} <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', statusFilter === key ? 'bg-white/20' : 'bg-gray-100')}>{count}</span>
            </button>
          ))}
        </div>

        {/* Grid/List */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-lg font-semibold text-gray-700">Muammo topilmadi</p>
            <p className="text-sm text-gray-500 mt-1">Filtrlari o'zgartiring yoki yangi muammo bildiring</p>
            <button onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all'); }}
              className="city-btn-secondary mt-4 text-sm">Filtrlani tozalash</button>
          </div>
        ) : (
          <div className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3')}>
            {filtered.map(report => <ReportCard key={report.id} report={report} compact={viewMode === 'list'} />)}
          </div>
        )}
      </div>
    </div>
  );
}
