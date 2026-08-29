import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ThumbsUp, MessageCircle, MapPin, Clock, Eye, AlertTriangle,
  ChevronRight, Send, ArrowLeft, ArrowRight, ExternalLink, CheckCheck
} from 'lucide-react';
import { Report } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { getCategoryById, STATUS_CONFIG } from '@/constants/categories';
import { formatRelativeTime, formatDate, getInitials } from '@/lib/utils';
import StatusBadge from '../reports/StatusBadge';
import CategoryBadge from '../reports/CategoryBadge';
import { cn } from '@/lib/utils';

interface Props {
  report: Report;
  onClose: () => void;
}

export default function MapReportPanel({ report, onClose }: Props) {
  const navigate = useNavigate();
  const { voteReport, addComment } = useAppStore();
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [photoIdx, setPhotoIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'info' | 'comments'>('info');

  const cat = getCategoryById(report.categoryId);
  const isCompleted = report.status === 'completed';

  // Combine main photos + completion photos for carousel
  const completionPhotos = report.completionPhotos || [];
  const allPhotos = isCompleted && completionPhotos.length > 0
    ? [...completionPhotos, ...report.photos]
    : report.photos;
  const hasPhotos = allPhotos.length > 0;

  const handleVote = () => {
    if (!isAuthenticated) { openAuthModal('login'); return; }
    voteReport(report.id);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!isAuthenticated) { openAuthModal('login'); return; }
    addComment(report.id, {
      id: `cmt-${Date.now()}`,
      reportId: report.id,
      authorId: currentUser!.id,
      authorName: currentUser!.name,
      authorAvatar: currentUser!.avatar,
      authorRole: currentUser!.role,
      text: commentText.trim(),
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    });
    setCommentText('');
  };

  return (
    <div className="w-full h-full bg-white border-l border-gray-100 flex flex-col shadow-glass-lg overflow-hidden">

      {/* ── COMPLETED BANNER (top) ── */}
      {isCompleted && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white flex-shrink-0">
          <CheckCheck className="w-4 h-4 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold">Muammo muvaffaqiyatli hal qilindi ✅</p>
            {report.solvedBy && <p className="text-[10px] text-green-100">{report.solvedBy}</p>}
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── PHOTO / HEADER ── */}
      <div className="relative flex-shrink-0">
        {hasPhotos ? (
          <div className="h-48 sm:h-52 bg-gray-100 relative overflow-hidden">
            <img src={allPhotos[photoIdx]} alt={report.title} className="w-full h-full object-cover" />

            {/* "Natija" badge for completion photos */}
            {isCompleted && photoIdx < completionPhotos.length && (
              <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                ✅ Natija rasmi
              </div>
            )}

            {allPhotos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIdx(i => Math.max(0, i - 1))}
                  disabled={photoIdx === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPhotoIdx(i => Math.min(allPhotos.length - 1, i + 1))}
                  disabled={photoIdx === allPhotos.length - 1}
                  className="absolute right-10 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {allPhotos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i === photoIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/50',
                        // Green dots for completion photos
                        i < completionPhotos.length && isCompleted ? 'bg-green-300' : ''
                      )}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-2 left-3 right-10">
              <div className="flex gap-1.5 flex-wrap">
                <CategoryBadge categoryId={report.categoryId} size="sm" />
                <StatusBadge status={report.status} size="sm" />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-14 flex items-center px-4 gap-2 border-b border-gray-100" style={{ backgroundColor: isCompleted ? '#F0FDF4' : cat.bgColor }}>
            <span className="text-2xl">{isCompleted ? '✅' : cat.icon}</span>
            <div className="flex gap-1.5">
              <CategoryBadge categoryId={report.categoryId} size="sm" />
              <StatusBadge status={report.status} size="sm" />
            </div>
          </div>
        )}

        {/* Close button (only when no completed banner) */}
        {!isCompleted && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Urgent */}
        {report.priority === 'urgent' && !isCompleted && (
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 border-b border-red-100">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-600">Shoshilinch muammo</span>
          </div>
        )}
      </div>

      {/* ── TITLE + META ── */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <h2 className="font-bold text-gray-900 text-base leading-snug mb-2">{report.title}</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            {report.location.address}
            {report.location.district && <span className="text-gray-400"> · {report.location.district}</span>}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-400" />
            {formatRelativeTime(report.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-gray-400" />
            {report.viewCount}
          </span>
        </div>
      </div>

      {/* ── ACTION BAR ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={handleVote}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all flex-1 justify-center',
            report.isVoted
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE]'
          )}
        >
          <ThumbsUp className="w-4 h-4" />
          {report.isVoted ? 'Berildi' : 'Ovoz'}
          <span className="font-bold">{report.votes}</span>
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'comments' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
          )}
        >
          <MessageCircle className="w-4 h-4" />
          {report.comments.length}
        </button>
        <button
          onClick={() => navigate(`/reports/${report.id}`)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          title="To'liq sahifada ochish"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* ── TABS ── */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        {(['info', 'comments'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              'flex-1 py-2.5 text-xs font-semibold transition-colors',
              activeTab === t
                ? 'text-[#2563EB] border-b-2 border-[#2563EB]'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t === 'info' ? "Ma'lumot" : `Izohlar (${report.comments.length})`}
          </button>
        ))}
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' ? (
          <div className="p-4 space-y-4">

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tavsif</p>
              <p className="text-sm text-gray-700 leading-relaxed">{report.description}</p>
            </div>

            {/* Completion info when completed */}
            {isCompleted && report.completionDescription && (
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <p className="text-xs font-bold text-green-700 mb-1.5 flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Hal qilish haqida
                </p>
                <p className="text-xs text-green-800 leading-relaxed">{report.completionDescription}</p>
                {report.solvedBy && (
                  <p className="text-xs text-green-600 mt-1.5 font-semibold">👤 {report.solvedBy}</p>
                )}
                {report.completionDate && (
                  <p className="text-xs text-green-500 mt-0.5">📅 {formatDate(report.completionDate)}</p>
                )}
              </div>
            )}

            {/* Organization */}
            <div className="flex items-center gap-2.5 p-3 bg-blue-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 flex items-center justify-center text-[#2563EB] text-sm flex-shrink-0">🏢</div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium">Mas'ul tashkilot</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {report.organizationId.replace('org-', '').charAt(0).toUpperCase() + report.organizationId.replace('org-', '').slice(1)}
                </p>
              </div>
            </div>

            {/* Author */}
            {!report.anonymous && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#2563EB]/20 flex items-center justify-center text-[#2563EB] text-xs font-bold overflow-hidden flex-shrink-0">
                  {report.authorAvatar
                    ? <img src={report.authorAvatar} alt="" className="w-full h-full object-cover" />
                    : getInitials(report.authorName)
                  }
                </div>
                <p className="text-sm font-medium text-gray-800">{report.authorName}</p>
              </div>
            )}

            {/* Timeline */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tarix</p>
              <div className="space-y-2">
                {[...report.timeline].reverse().slice(0, 4).map(entry => (
                  <div key={entry.id} className="flex gap-2.5">
                    <div className="flex flex-col items-center flex-shrink-0 mt-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_CONFIG[entry.status].markerColor }} />
                      <div className="w-px flex-1 bg-gray-200 mt-1" />
                    </div>
                    <div className="pb-2 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={entry.status} size="sm" dot={false} />
                        <span className="text-[10px] text-gray-400">{formatDate(entry.createdAt)}</span>
                      </div>
                      {entry.note && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{entry.note}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">{entry.authorName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sponsors */}
            {(report.sponsors?.filter(s => s.status !== 'cancelled').length || 0) > 0 && (
              <div className="p-3 rounded-xl border" style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
                <p className="text-xs font-bold text-[#2563EB] mb-2.5 flex items-center gap-1.5">
                  🤝 <span>{report.sponsors!.filter(s => s.status !== 'cancelled').length} ta tadbirkor zimmasiga oldi</span>
                </p>
                <div className="space-y-2">
                  {report.sponsors!.filter(s => s.status !== 'cancelled').map(sponsor => (
                    <div key={sponsor.id} className="flex items-start gap-2 bg-white rounded-lg p-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 font-bold"
                        style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}
                      >
                        {sponsor.businessName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{sponsor.businessName}</p>
                        <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{sponsor.pledgeMessage}</p>
                      </div>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 whitespace-nowrap mt-0.5"
                        style={{
                          backgroundColor: sponsor.status === 'in_progress' ? '#EFF6FF' : sponsor.status === 'completed' ? '#F0FDF4' : '#FEF3C7',
                          color: sponsor.status === 'in_progress' ? '#2563EB' : sponsor.status === 'completed' ? '#16A34A' : '#D97706',
                        }}
                      >
                        {sponsor.status === 'in_progress' ? 'Bajarmoqda' : sponsor.status === 'completed' ? 'Bajarildi' : 'Zimmasiga oldi'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full page link */}
            <button
              onClick={() => navigate(`/reports/${report.id}`)}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors border',
                isCompleted
                  ? 'border-green-300 text-green-700 hover:bg-green-50'
                  : 'border-[#2563EB]/30 text-[#2563EB] hover:bg-[#EFF6FF]'
              )}
            >
              To'liq sahifani ko'rish
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {report.comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Hali izoh yo'q</p>
                  <p className="text-xs text-gray-400 mt-1">Birinchi izoh qoldiring!</p>
                </div>
              ) : (
                report.comments.map(comment => (
                  <div key={comment.id} className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 overflow-hidden">
                      {comment.authorAvatar
                        ? <img src={comment.authorAvatar} alt="" className="w-full h-full object-cover" />
                        : getInitials(comment.authorName)
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <span className="text-xs font-semibold text-gray-800">{comment.authorName}</span>
                        {comment.authorRole === 'organization' && (
                          <span className="text-[10px] bg-[#EFF6FF] text-[#2563EB] px-1.5 py-0.5 rounded-full font-semibold">Tashkilot</span>
                        )}
                        <span className="text-[10px] text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 rounded-xl px-3 py-2">{comment.text}</p>
                      <div className="flex items-center gap-3 mt-1 px-1">
                        <span className="text-[10px] text-gray-400">👍 {comment.likes}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
              {isAuthenticated ? (
                <form onSubmit={handleComment} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#2563EB]/20 flex items-center justify-center text-[#2563EB] text-xs font-bold overflow-hidden flex-shrink-0 self-center">
                    {currentUser?.avatar
                      ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                      : getInitials(currentUser?.name || 'U')
                    }
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Izoh yozing..."
                      className="flex-1 city-input py-2 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 self-center"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => openAuthModal('login')}
                  className="w-full py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm text-gray-600 font-medium transition-colors border border-gray-200"
                >
                  Izoh yozish uchun kiring →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
