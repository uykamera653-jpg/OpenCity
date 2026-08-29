import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, MessageCircle, ThumbsUp, Eye, Clock, AlertTriangle } from 'lucide-react';
import { Report } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import StatusBadge from './StatusBadge';
import CategoryBadge from './CategoryBadge';
import { cn } from '@/lib/utils';
import { PRIORITY_CONFIG } from '@/constants/categories';

interface Props {
  report: Report;
  compact?: boolean;
}

const ReportCard = memo(({ report, compact = false }: Props) => {
  const navigate = useNavigate();
  const { voteReport } = useAppStore();
  const { isAuthenticated, openAuthModal } = useAuth();
  const priority = PRIORITY_CONFIG[report.priority];

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { openAuthModal('login'); return; }
    voteReport(report.id);
  };

  return (
    <article
      onClick={() => navigate(`/reports/${report.id}`)}
      className={cn(
        'bg-white rounded-xl border border-gray-100 hover:border-[#2563EB]/30 hover:shadow-glass transition-all duration-200 cursor-pointer group overflow-hidden',
        report.priority === 'urgent' && 'border-red-200 hover:border-red-300'
      )}>
      {/* Priority banner */}
      {report.priority === 'urgent' && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-red-50 border-b border-red-100">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          <span className="text-xs font-semibold text-red-600">Shoshilinch muammo</span>
        </div>
      )}

      {/* Photo */}
      {!compact && report.photos.length > 0 && (
        <div className="h-44 overflow-hidden bg-gray-50">
          <img src={report.photos[0]} alt={report.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap gap-1.5">
            <CategoryBadge categoryId={report.categoryId} size="sm" />
            <StatusBadge status={report.status} size="sm" />
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
            <Clock className="w-3 h-3" />{formatDate(report.createdAt)}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1.5 line-clamp-2 group-hover:text-[#2563EB] transition-colors">
          {report.title}
        </h3>

        {!compact && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{report.description}</p>
        )}

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0 text-gray-400" />
          <span className="truncate">{report.location.address}</span>
          {report.location.district && <span className="text-gray-400 flex-shrink-0">· {report.location.district}</span>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleVote}
              className={cn('flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all',
                report.isVoted ? 'bg-[#2563EB] text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-[#2563EB]')}>
              <ThumbsUp className="w-3.5 h-3.5" />{report.votes}
            </button>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MessageCircle className="w-3.5 h-3.5" />{report.comments.length}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye className="w-3.5 h-3.5" />{report.viewCount}
            </span>
            {(report.sponsors?.filter(s => s.status !== 'cancelled').length || 0) > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                🤝 {report.sponsors!.filter(s => s.status !== 'cancelled').length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {!report.anonymous ? (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-[#2563EB]/20 flex items-center justify-center text-[#2563EB] text-[9px] font-bold">
                  {report.authorAvatar ? (
                    <img src={report.authorAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : getInitials(report.authorName)}
                </div>
                <span className="text-xs text-gray-500">{report.authorName.split(' ')[0]}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Noma'lum</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});

ReportCard.displayName = 'ReportCard';
export default ReportCard;
