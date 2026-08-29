import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Users, ShieldCheck, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { CitizenResolution } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const REQUIRED_CONFIRMATIONS = 3;

interface Props {
  reportId: string;
  resolutions: CitizenResolution[];
}

export default function CitizenResolutionPanel({ reportId, resolutions }: Props) {
  const { voteOnCitizenResolution, adminReviewCitizenResolution } = useAppStore();
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(
    resolutions.find(r => r.status === 'pending')?.id || null
  );
  const [photoIdx, setPhotoIdx] = useState<Record<string, number>>({});

  const canAdminOverride = currentUser?.role === 'admin' || currentUser?.role === 'organization';

  const handleVote = (resolutionId: string, vote: 'confirm' | 'deny') => {
    if (!isAuthenticated) { openAuthModal('login'); return; }
    voteOnCitizenResolution(reportId, resolutionId, vote);
  };

  const pendingResolutions = resolutions.filter(r => r.status === 'pending');
  const approvedResolutions = resolutions.filter(r => r.status === 'approved');
  const rejectedResolutions = resolutions.filter(r => r.status === 'rejected');

  if (resolutions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-glass overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Fuqaro hal qilish takliflari</h3>
              <p className="text-xs text-gray-500">
                {pendingResolutions.length > 0
                  ? `${pendingResolutions.length} ta taklif ko'rib chiqilmoqda`
                  : `${approvedResolutions.length} ta taklif tasdiqlandi`
                }
              </p>
            </div>
          </div>
          {pendingResolutions.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Clock className="w-3 h-3" />
              Jamoat ovozi kutilmoqda
            </div>
          )}
        </div>
      </div>

      {/* Resolutions */}
      <div className="divide-y divide-gray-50">
        {resolutions.map(resolution => {
          const isExpanded = expandedId === resolution.id;
          const confirmedCount = resolution.confirmedBy.length;
          const deniedCount = resolution.deniedBy.length;
          const totalVotes = confirmedCount + deniedCount;
          const confirmPercent = totalVotes > 0 ? (confirmedCount / totalVotes) * 100 : 0;
          const remaining = Math.max(0, REQUIRED_CONFIRMATIONS - confirmedCount);

          const myUserId = currentUser?.id;
          const hasConfirmed = myUserId ? resolution.confirmedBy.includes(myUserId) : false;
          const hasDenied = myUserId ? resolution.deniedBy.includes(myUserId) : false;
          const hasVoted = hasConfirmed || hasDenied;
          const isMySolution = myUserId === resolution.solverId;

          const currentPhotoIdx = photoIdx[resolution.id] || 0;

          const statusConfig = {
            pending: { label: "Ko'rib chiqilmoqda", color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
            approved: { label: '✅ Tasdiqlandi', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
            rejected: { label: '❌ Rad etildi', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          }[resolution.status];

          return (
            <div key={resolution.id} className={cn(
              resolution.status === 'approved' && 'bg-green-50/40',
              resolution.status === 'rejected' && 'bg-gray-50/60 opacity-70'
            )}>
              {/* Resolution header — clickable to expand */}
              <button
                className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : resolution.id)}
              >
                {/* Solver avatar */}
                <div className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] text-xs font-bold overflow-hidden flex-shrink-0 mt-0.5">
                  {resolution.solverAvatar
                    ? <img src={resolution.solverAvatar} alt="" className="w-full h-full object-cover" />
                    : getInitials(resolution.solverName)
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-gray-900">{resolution.solverName}</span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-semibold', statusConfig.bg, statusConfig.color)}>
                      {statusConfig.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatDate(resolution.createdAt)}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{resolution.description}</p>

                  {/* Compact vote summary */}
                  {resolution.status === 'pending' && (
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {confirmedCount}
                      </div>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${confirmPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                        <XCircle className="w-3.5 h-3.5" /> {deniedCount}
                      </div>
                      {remaining > 0 && (
                        <span className="text-[10px] text-gray-400">
                          +{remaining} kerak
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 text-gray-400 mt-1">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 animate-fade-in">

                  {/* Photos */}
                  {resolution.photos.length > 0 && (
                    <div className="relative h-52 rounded-xl overflow-hidden bg-gray-100">
                      <img
                        src={resolution.photos[currentPhotoIdx]}
                        alt="Isbot rasmi"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                        📸 Isbot
                      </div>
                      {resolution.photos.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {resolution.photos.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setPhotoIdx(p => ({ ...p, [resolution.id]: i }))}
                              className={cn('h-1.5 rounded-full transition-all', i === currentPhotoIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/60')}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Full description */}
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">Qilgan ishi:</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{resolution.description}</p>
                  </div>

                  {/* Voting section (pending only) */}
                  {resolution.status === 'pending' && (
                    <div className="space-y-3">
                      {/* Progress toward auto-approval */}
                      <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-blue-800">Avtomatik tasdiqlash</p>
                          <span className="text-xs text-blue-600 font-bold">{confirmedCount}/{REQUIRED_CONFIRMATIONS}</span>
                        </div>
                        <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (confirmedCount / REQUIRED_CONFIRMATIONS) * 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-blue-600 mt-1.5">
                          {remaining > 0
                            ? `${remaining} ta fuqaro yana tasdiqlasa muammo yopiladi`
                            : '✅ Yetarli ovoz olindi, tekshirilmoqda...'
                          }
                        </p>
                      </div>

                      {/* Vote buttons */}
                      {!isMySolution ? (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            Bu muammo haqiqatan hal qilindimi?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVote(resolution.id, 'confirm')}
                              disabled={hasVoted}
                              className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                                hasConfirmed
                                  ? 'bg-green-600 text-white border-green-600'
                                  : hasVoted
                                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'border-green-300 text-green-700 hover:bg-green-50'
                              )}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Ha, hal qilindi
                              {confirmedCount > 0 && <span className="text-xs opacity-70">({confirmedCount})</span>}
                            </button>
                            <button
                              onClick={() => handleVote(resolution.id, 'deny')}
                              disabled={hasVoted}
                              className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all',
                                hasDenied
                                  ? 'bg-red-500 text-white border-red-500'
                                  : hasVoted
                                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                    : 'border-red-300 text-red-600 hover:bg-red-50'
                              )}
                            >
                              <XCircle className="w-4 h-4" />
                              Yo'q, hali bor
                              {deniedCount > 0 && <span className="text-xs opacity-70">({deniedCount})</span>}
                            </button>
                          </div>
                          {hasVoted && (
                            <p className="text-xs text-center text-gray-400 mt-1.5">
                              {hasConfirmed ? '✅ Tasdiqlash ovozingiz qabul qilindi' : '❌ Rad etish ovozingiz qabul qilindi'}
                            </p>
                          )}
                          {!isAuthenticated && (
                            <p className="text-xs text-center text-gray-500 mt-1.5">
                              Ovoz berish uchun{' '}
                              <button onClick={() => openAuthModal('login')} className="text-[#2563EB] font-semibold hover:underline">kiring</button>
                            </p>
                          )}
                          {isMySolution && (
                            <p className="text-xs text-center text-amber-600 mt-1.5">Siz bu taklifni yuborgansiz — o'z taklifingizga ovoz bera olmaysiz</p>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-700 text-center">
                          Siz bu taklifni yuborgansiz. Boshqa fuqarolar ovoz berishini kuting.
                        </div>
                      )}

                      {/* Admin override */}
                      {canAdminOverride && (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" /> Tashkilot/Admin boshqaruvi
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => adminReviewCitizenResolution(reportId, resolution.id, 'approve')}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-green-300 text-green-700 text-xs font-semibold hover:bg-green-50 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Tasdiqlash
                            </button>
                            <button
                              onClick={() => adminReviewCitizenResolution(reportId, resolution.id, 'reject')}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Rad etish
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Approved state */}
                  {resolution.status === 'approved' && (
                    <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-center">
                      <p className="text-sm font-bold text-green-700">✅ Bu taklif tasdiqlandi!</p>
                      <p className="text-xs text-green-600 mt-1">
                        {confirmedCount} fuqaro tasdiqladi · Muammo "Bajarildi" holatiga o'tdi
                      </p>
                    </div>
                  )}

                  {/* Rejected state */}
                  {resolution.status === 'rejected' && (
                    <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-center">
                      <p className="text-sm font-bold text-red-600">❌ Bu taklif rad etildi</p>
                      <p className="text-xs text-red-500 mt-1">Muammo hali hal qilinmagan</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint for pending */}
      {pendingResolutions.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <ArrowRight className="w-3 h-3" />
            {REQUIRED_CONFIRMATIONS} ta tasdiqlash + 1.5:1 nisbat bo'lganda muammo avtomatik yopiladi
          </p>
        </div>
      )}
    </div>
  );
}
