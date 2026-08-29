import { useState } from 'react';
import {
  X, Building2, Calendar, Route, ArrowRight,
  ChevronDown, ChevronUp, Trash2, Clock, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { MapAnnouncement } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { ANNOUNCEMENT_TYPE_CONFIG } from '@/constants/categories';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
  announcement: MapAnnouncement;
  onClose: () => void;
}

export default function AnnouncementPanel({ announcement: ann, onClose }: Props) {
  const { deleteAnnouncement, updateAnnouncement } = useAppStore();
  const { currentUser } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const conf = ANNOUNCEMENT_TYPE_CONFIG[ann.type] || ANNOUNCEMENT_TYPE_CONFIG.other;
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'organization';

  const statusConfig = {
    active: { label: 'Aktiv', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    planned: { label: 'Rejalashtirilgan', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    expired: { label: 'Muddati o\'tgan', color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB' },
  }[ann.status];

  const isExpired = ann.endDate && new Date(ann.endDate) < new Date();
  const daysLeft = ann.endDate
    ? Math.ceil((new Date(ann.endDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="h-full bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-4 border-b border-gray-100 flex-shrink-0"
        style={{ backgroundColor: conf.bgColor }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xl flex-shrink-0 mt-0.5"
          style={{ backgroundColor: conf.color }}
        >
          {conf.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{ann.title}</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-500 flex-shrink-0 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
              style={{ color: conf.color, backgroundColor: 'white', borderColor: conf.color + '40' }}
            >
              {conf.icon} {conf.label}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
              style={{ color: statusConfig.color, backgroundColor: statusConfig.bg, borderColor: statusConfig.border }}
            >
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">

          {/* Organization */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Mas'ul tashkilot</p>
              <p className="text-sm font-semibold text-gray-900">{ann.organizationName}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-[10px] text-blue-600 font-semibold mb-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Boshlanish
              </p>
              <p className="text-xs font-bold text-gray-900">
                {new Date(ann.startDate).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-[10px] text-gray-500">
                {new Date(ann.startDate).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {ann.endDate ? (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                <p className="text-[10px] text-orange-600 font-semibold mb-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {isExpired ? 'Tugadi' : 'Tugash'}
                </p>
                <p className="text-xs font-bold text-gray-900">
                  {new Date(ann.endDate).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}
                </p>
                {!isExpired && daysLeft !== null && daysLeft >= 0 && (
                  <p className="text-[10px] text-orange-600 font-semibold">{daysLeft === 0 ? 'Bugun tugaydi' : `${daysLeft} kun qoldi`}</p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-[10px] text-gray-500 font-semibold mb-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Tugash
                </p>
                <p className="text-xs text-gray-400">Belgilanmagan</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <p className="text-xs font-semibold text-gray-700">Batafsil ma'lumot</p>
              {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
            </button>
            {expanded && (
              <p className="text-sm text-gray-700 leading-relaxed mt-2">{ann.description}</p>
            )}
          </div>

          {/* Route info */}
          <div className="space-y-2">
            <div
              className="flex items-center gap-2.5 p-3 rounded-xl border"
              style={{ backgroundColor: conf.bgColor, borderColor: conf.color + '30' }}
            >
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: conf.color }}>
                <Route className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: conf.color }}>
                  {conf.label} yo'nalishi
                </p>
                <p className="text-xs text-gray-500">{ann.route.length} ta nuqta orqali belgilangan</p>
              </div>
            </div>

            {ann.alternativeRoute && ann.alternativeRoute.length >= 2 && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <ArrowRight className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs font-bold text-green-800">Muqobil yo'nalish mavjud</p>
                </div>
                {ann.alternativeDescription && (
                  <p className="text-xs text-green-700 leading-relaxed">{ann.alternativeDescription}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-8 h-1.5 rounded-full bg-green-400" style={{ background: 'repeating-linear-gradient(90deg, #16A34A 0, #16A34A 8px, transparent 8px, transparent 13px)' }} />
                  <span className="text-[10px] text-green-600">yashil chiziq xaritada</span>
                </div>
              </div>
            )}
          </div>

          {/* Warning box */}
          {ann.status === 'active' && !isExpired && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800">Diqqat!</p>
                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                  {ann.type === 'road_closure' && 'Bu yo\'l hozirda yopiq. Iltimos muqobil yo\'ldan foydalaning.'}
                  {ann.type === 'road_repair' && 'Bu yo\'lda ta\'mirlash ishlari olib borilmoqda. Ehtiyot bo\'ling.'}
                  {ann.type === 'water_cutoff' && 'Ko\'rsatilgan hududda suv ta\'minoti vaqtincha to\'xtatiladi.'}
                  {ann.type === 'electricity_cutoff' && 'Ko\'rsatilgan hududda elektr ta\'minoti vaqtincha to\'xtatiladi.'}
                  {ann.type === 'gas_cutoff' && 'Ko\'rsatilgan hududda gaz ta\'minoti vaqtincha to\'xtatiladi.'}
                  {ann.type === 'event' && 'Bu hududda tadbir o\'tkazilmoqda.'}
                  {ann.type === 'road_diversion' && 'Harakatni ushbu ko\'rsatilgan yo\'nalish bo\'yicha davom ettiring.'}
                  {ann.type === 'other' && 'Iltimos e\'lon tafsilotlariga e\'tibor bering.'}
                </p>
              </div>
            </div>
          )}

          {/* Completed state */}
          {(ann.status === 'expired' || isExpired) && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200">
              <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-500">Bu e'lon muddati tugagan</p>
            </div>
          )}

          {/* Posted time */}
          <p className="text-[11px] text-gray-400">
            📢 E'lon qilingan: {formatDate(ann.createdAt)}
          </p>
        </div>
      </div>

      {/* Admin/Org actions */}
      {canManage && (
        <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-2">
          {ann.status !== 'expired' && (
            <button
              onClick={() => updateAnnouncement(ann.id, { status: 'expired' })}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Tugatildi deb belgilash
            </button>
          )}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> E'lonni o'chirish
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600"
              >
                Bekor
              </button>
              <button
                onClick={() => { deleteAnnouncement(ann.id); onClose(); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
              >
                Ha, o'chirish
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
