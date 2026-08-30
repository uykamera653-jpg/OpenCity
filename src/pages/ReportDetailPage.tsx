
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ThumbsUp, MessageCircle, MapPin, Clock, Eye, Building2,
  Send, Heart, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  ExternalLink, CheckCheck, XCircle, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { getCategoryById, STATUS_CONFIG, PRIORITY_CONFIG } from '@/constants/categories';
import { formatDate, formatFullDate, generateId, getInitials } from '@/lib/utils';
import { Comment, Report } from '@/types';
import CitizenResolutionModal from '@/components/features/reports/CitizenResolutionModal';
import CitizenResolutionPanel from '@/components/features/reports/CitizenResolutionPanel';
import SponsorSection from '@/components/features/reports/SponsorSection';
import StatusBadge from '@/components/features/reports/StatusBadge';
import CategoryBadge from '@/components/features/reports/CategoryBadge';
import MapView from '@/components/features/map/MapView';
import { cn } from '@/lib/utils';

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { reports, organizations, voteReport, addComment, likeComment, updateReportStatus } = useAppStore();
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [completionPhotoIndex, setCompletionPhotoIndex] = useState(0);
  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const [citizenFeedback, setCitizenFeedback] = useState<'solved' | 'unsolved' | null>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);

  const report = reports.find(r => r.id === id);
  const org = report ? organizations.find(o => o.id === report.organizationId) : null;
  const priority = report ? PRIORITY_CONFIG[report.priority] : null;
  const cat = report ? getCategoryById(report.categoryId) : null;

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (!report) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-5xl mb-4">😕</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Muammo topilmadi</h2>
          <p className="text-sm text-gray-500 mb-4">Bu muammo mavjud emas yoki o'chirilgan</p>
          <button onClick={() => navigate('/reports')} className="city-btn-secondary">Orqaga qaytish</button>
        </div>
      </div>
    );
  }

  const isCompleted = report.status === 'completed';
  const timeline = showAllTimeline ? report.timeline : report.timeline.slice(-3);
  const allPhotos = report.photos;
  const completionPhotos = report.completionPhotos || [];

  const handleVote = () => {
    if (!isAuthenticated) { openAuthModal('login'); return; }
    voteReport(report.id);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !commentText.trim()) return;
    const c: Comment = {
      id: generateId(),
      reportId: report.id,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      text: commentText,
      likes: 0,
      createdAt: new Date().toISOString(),
      isLiked: false,
    };
    addComment(report.id, c);
    setCommentText('');
  };

  const handleStatusUpdate = () => {
    if (!newStatus || !statusNote) return;
    updateReportStatus(report.id, newStatus as Report['status'], statusNote);
    setShowStatusUpdate(false);
    setNewStatus('');
    setStatusNote('');
  };

  const canUpdateStatus = currentUser?.role === 'admin' || currentUser?.role === 'organization';
  const citizenResolutions = report.citizenResolutions || [];
  const hasPendingResolution = citizenResolutions.some(r => r.status === 'pending');
  const alreadySubmitted = isAuthenticated && citizenResolutions.some(r => r.solverId === currentUser?.id);
  const canSubmitResolution = isAuthenticated && !isCompleted && !alreadySubmitted && currentUser?.role !== 'admin';

  return (
    <div className="min-h-screen pt-24 bg-gray-50">

      {/* ── COMPLETED BANNER ── */}
      {isCompleted && (
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCheck className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg">Muammo muvaffaqiyatli hal qilindi! ✅</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-green-100 text-sm">
                  {report.solvedBy && <span>👤 {report.solvedBy}</span>}
                  {report.completionDate && <span>📅 {formatDate(report.completionDate)}</span>}
                  {completionPhotos.length > 0 && (
                    <span>📸 {completionPhotos.length} ta natija rasmi</span>
                  )}
                </div>
              </div>
            </div>

            {/* Completion photos strip */}
            {completionPhotos.length > 0 && (
              <div className="mt-4 relative">
                <div className="h-48 sm:h-64 rounded-2xl overflow-hidden relative bg-black">
                  <img
                    src={completionPhotos[completionPhotoIndex]}
                    alt="Natija rasmi"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    ✅ Natija
                  </div>
                  {completionPhotos.length > 1 && (
                    <>
                      <button
                        onClick={() => setCompletionPhotoIndex(i => Math.max(0, i - 1))}
                        disabled={completionPhotoIndex === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCompletionPhotoIndex(i => Math.min(completionPhotos.length - 1, i + 1))}
                        disabled={completionPhotoIndex === completionPhotos.length - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-colors"
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {completionPhotos.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCompletionPhotoIndex(i)}
                            className={cn('h-1.5 rounded-full transition-all', i === completionPhotoIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/60')}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {report.completionDescription && (
                  <div className="mt-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3">
                    <p className="text-sm text-green-50 leading-relaxed">{report.completionDescription}</p>
                  </div>
                )}
              </div>
            )}

            {/* Citizen feedback */}
            <div className="mt-4 flex items-center gap-3">
              <p className="text-sm text-green-100 font-medium">Muammo haqiqatan hal qilindimi?</p>
              <button
                onClick={() => setCitizenFeedback('solved')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                  citizenFeedback === 'solved'
                    ? 'bg-white text-green-700 border-white'
                    : 'border-white/40 text-white hover:bg-white/10'
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Ha, hal qilindi
              </button>
              <button
                onClick={() => setCitizenFeedback('unsolved')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                  citizenFeedback === 'unsolved'
                    ? 'bg-white text-red-600 border-white'
                    : 'border-white/40 text-white hover:bg-white/10'
                )}
              >
                <XCircle className="w-3.5 h-3.5" /> Yo'q, hali ham bor
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Orqaga
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── MAIN COLUMN ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Photos (original) */}
            {allPhotos.length > 0 && (
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-glass">
                <div className="relative h-64 sm:h-96">
                  <img src={allPhotos[photoIndex]} alt={report.title} className="w-full h-full object-cover" />
                  {isCompleted && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                      <CheckCheck className="w-3.5 h-3.5" /> Bajarildi
                    </div>
                  )}
                  {allPhotos.length > 1 && (
                    <>
                      <button onClick={() => setPhotoIndex(i => Math.max(0, i - 1))} disabled={photoIndex === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setPhotoIndex(i => Math.min(allPhotos.length - 1, i + 1))} disabled={photoIndex === allPhotos.length - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-colors">
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {allPhotos.map((_, i) => (
                          <button key={i} onClick={() => setPhotoIndex(i)}
                            className={cn('h-1.5 rounded-full transition-all', i === photoIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/60')} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Info card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-5 sm:p-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {cat && <CategoryBadge categoryId={report.categoryId} />}
                <StatusBadge status={report.status} />
                {priority && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ color: priority.color, backgroundColor: priority.bgColor }}>
                    {priority.label}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 leading-snug">{report.title}</h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-500 mb-5">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{report.location.address}{report.location.district && ` · ${report.location.district}`}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{formatDate(report.createdAt)}</span>
                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{report.viewCount} ko'rildi</span>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed mb-6">{report.description}</p>

              {/* Vote + Stats */}
              <div className="flex flex-wrap items-center gap-3 pb-5 border-b border-gray-100">
                <button onClick={handleVote}
                  className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all',
                    report.isVoted ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-gray-700 hover:bg-[#2563EB] hover:text-white')}>
                  <ThumbsUp className="w-4 h-4" /> {report.votes} ovoz
                </button>
                <span className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MessageCircle className="w-4 h-4" />{report.comments.length} izoh
                </span>
                {(report.sponsors?.filter(s => s.status !== 'cancelled').length || 0) > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-[#2563EB]">
                    🤝 {report.sponsors!.filter(s => s.status !== 'cancelled').length} ta sponsor
                  </span>
                )}
                {/* Citizen solve button */}
                {!isCompleted && (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) { openAuthModal('login'); return; }
                      setShowResolutionModal(true);
                    }}
                    disabled={alreadySubmitted}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border ml-auto',
                      alreadySubmitted
                        ? 'border-green-300 bg-green-50 text-green-700 cursor-default'
                        : 'border-green-400 text-green-700 hover:bg-green-50'
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {alreadySubmitted ? 'Taklif yuborildi' : 'Men hal qildim'}
                  </button>
                )}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 mt-5">
                <div className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] font-bold text-sm overflow-hidden flex-shrink-0">
                  {report.authorAvatar ? <img src={report.authorAvatar} alt="" className="w-full h-full object-cover" /> : getInitials(report.authorName)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{report.anonymous ? "Noma'lum foydalanuvchi" : report.authorName}</p>
                  <p className="text-xs text-gray-500">{formatFullDate(report.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Completion detail card (when no completionPhotos but has description) */}
            {isCompleted && !completionPhotos.length && report.completionDescription && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-green-800">Muammo hal qilindi</h3>
                </div>
                <p className="text-sm text-green-800 leading-relaxed">{report.completionDescription}</p>
                {report.solvedBy && <p className="text-xs text-green-600 mt-2 font-medium">✅ Hal qildi: {report.solvedBy}</p>}
                {report.completionDate && <p className="text-xs text-green-600 mt-0.5">📅 {formatDate(report.completionDate)}</p>}
              </div>
            )}

            {/* Urgent warning */}
            {report.priority === 'urgent' && !isCompleted && (
              <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Shoshilinch holat</p>
                  <p className="text-xs text-red-600 mt-0.5">Bu muammo tezkor hal etishni talab qiladi</p>
                </div>
              </div>
            )}

            {/* Sponsor Section */}
            <SponsorSection
              reportId={report.id}
              reportTitle={report.title}
              sponsors={report.sponsors || []}
              isCompleted={isCompleted}
            />

            {/* Citizen Resolution Panel */}
            {citizenResolutions.length > 0 && (
              <CitizenResolutionPanel reportId={report.id} resolutions={citizenResolutions} />
            )}

            {/* Hint when no resolutions yet */}
            {!isCompleted && citizenResolutions.length === 0 && (
              <div className="p-4 rounded-2xl border border-dashed border-green-300 bg-green-50/50">
                <p className="text-sm text-green-700 font-semibold mb-0.5">👋 Siz ham yordam bera olasiz!</p>
                <p className="text-xs text-green-600">Agar bu muammoni o'zingiz hal qilsangiz — "Men hal qildim" tugmasini bosing. Jamoat tasdiqlaydi va isming ko'rsatiladi.</p>
              </div>
            )}

            {/* Status update (for org/admin) */}
            {canUpdateStatus && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-5">
                <button onClick={() => setShowStatusUpdate(!showStatusUpdate)} className="flex items-center justify-between w-full">
                  <span className="font-semibold text-gray-900">Holat yangilash</span>
                  {showStatusUpdate ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showStatusUpdate && (
                  <div className="mt-4 space-y-3 animate-fade-in">
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="city-input">
                      <option value="">Yangi holatni tanlang...</option>
                      {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)} rows={3}
                      className="city-input resize-none" placeholder="Izoh kiriting (majburiy)..." />
                    <button
                      onClick={handleStatusUpdate}
                      disabled={!newStatus || !statusNote}
                      className="city-btn-primary w-full justify-center disabled:opacity-40"
                    >
                      Holatni yangilash
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Comments */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-5 sm:p-6">
              <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#2563EB]" /> Izohlar ({report.comments.length})
              </h3>

              {isAuthenticated ? (
                <form onSubmit={handleComment} className="flex gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] text-xs font-bold flex-shrink-0">
                    {currentUser?.avatar
                      ? <img src={currentUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      : getInitials(currentUser?.name || '')}
                  </div>
                  <div className="flex-1 relative">
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      className="city-input pr-12 text-sm"
                      placeholder="Izoh yozing..."
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2563EB] disabled:text-gray-300 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mb-5 p-3 bg-gray-50 rounded-xl text-sm text-center text-gray-500">
                  Izoh yozish uchun{' '}
                  <button onClick={() => openAuthModal('login')} className="text-[#2563EB] font-semibold hover:underline">
                    kiring
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {report.comments.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Hali izoh yo'q. Birinchi bo'ling!</p>
                  </div>
                )}
                {report.comments.map(c => (
                  <div key={c.id} className={cn('flex gap-3', c.authorRole === 'organization' && 'bg-blue-50 rounded-xl p-3 -mx-3')}>
                    <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] text-xs font-bold">
                      {c.authorAvatar ? <img src={c.authorAvatar} alt="" className="w-full h-full object-cover" /> : getInitials(c.authorName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{c.authorName}</span>
                        {c.authorRole === 'organization' && (
                          <span className="text-[10px] bg-[#2563EB] text-white px-1.5 py-0.5 rounded-full font-semibold">Tashkilot</span>
                        )}
                        {c.authorRole === 'admin' && (
                          <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-semibold">Admin</span>
                        )}
                        <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{c.text}</p>
                      <button
                        onClick={() => likeComment(report.id, c.id)}
                        className={cn('flex items-center gap-1 mt-2 text-xs transition-colors', c.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400')}
                      >
                        <Heart className={cn('w-3.5 h-3.5', c.isLiked && 'fill-current')} /> {c.likes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className="space-y-4">

            {/* Organization */}
            {org && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#2563EB]" />Mas'ul tashkilot
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center font-bold text-[#2563EB] text-sm flex-shrink-0">
                    {getInitials(org.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{org.name}</p>
                    {org.verified && <span className="text-xs text-[#2563EB] font-medium">✓ Tasdiqlangan</span>}
                  </div>
                </div>
                <div className="space-y-2 text-xs text-gray-600">
                  {org.phone && <p>📞 {org.phone}</p>}
                  {org.email && <p>📧 {org.email}</p>}
                  <p>⏱️ O'rtacha javob: {org.avgResponseTime}</p>
                  <p>✅ Bajarilgan: {org.completedReports}</p>
                </div>
                <button
                  onClick={() => navigate(`/organizations/${org.id}`)}
                  className="city-btn-secondary w-full justify-center mt-4 text-xs py-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Batafsil ko'rish
                </button>
              </div>
            )}

            {/* Map */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-glass overflow-hidden">
              <div className="h-44">
                <MapView
                  reports={[report]}
                  center={[report.location.lat, report.location.lng]}
                  zoom={15}
                  height="100%"
                />
              </div>
              <div className="px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />{report.location.address}
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-glass p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Holat tarixi</h3>
                {report.timeline.length > 3 && (
                  <button
                    onClick={() => setShowAllTimeline(!showAllTimeline)}
                    className="text-xs text-[#2563EB] hover:underline"
                  >
                    {showAllTimeline ? 'Qisqartirish' : `Ko'rish (${report.timeline.length})`}
                  </button>
                )}
              </div>
              <div className="relative space-y-4">
                <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-100" />
                {timeline.map(entry => {
                  const conf = STATUS_CONFIG[entry.status];
                  return (
                    <div key={entry.id} className="relative pl-8">
                      <div className="absolute left-2 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: conf.markerColor }} />
                      <div>
                        <StatusBadge status={entry.status} size="sm" />
                        <p className="text-xs text-gray-700 mt-1 leading-relaxed">{entry.note}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{entry.authorName} · {formatDate(entry.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Citizen Resolution Modal */}
      {showResolutionModal && (
        <CitizenResolutionModal
          reportId={report.id}
          reportTitle={report.title}
          onClose={() => setShowResolutionModal(false)}
        />
      )}
    </div>
  );
}
