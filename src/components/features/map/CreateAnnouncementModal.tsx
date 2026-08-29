import { useState } from 'react';
import {
  X, MapPin, Route, ArrowRight, AlertCircle, Trash2,
  Plus, Calendar, CheckCircle2, Info, Navigation
} from 'lucide-react';
import { MapAnnouncement, AnnouncementType } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { ANNOUNCEMENT_TYPE_CONFIG } from '@/constants/categories';
import { generateId } from '@/lib/utils';
import { cn } from '@/lib/utils';
import MapView from './MapView';

interface Props {
  onClose: () => void;
}

type DrawMode = 'main' | 'alt' | null;

export default function CreateAnnouncementModal({ onClose }: Props) {
  const { addAnnouncement, organizations } = useAppStore();
  const { currentUser } = useAuth();

  const [type, setType] = useState<AnnouncementType>('road_closure');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [altDescription, setAltDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState('');
  const [mainRoute, setMainRoute] = useState<[number, number][]>([]);
  const [altRoute, setAltRoute] = useState<[number, number][]>([]);
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'info' | 'route' | 'preview'>('info');

  const org = organizations.find(o => o.id === currentUser?.id?.replace('user-', 'org-'))
    || organizations.find(() => currentUser?.role === 'admin')
    || organizations[0];

  const handleMapClick = (lat: number, lng: number) => {
    if (drawMode === 'main') {
      setMainRoute(prev => [...prev, [lat, lng]]);
    } else if (drawMode === 'alt') {
      setAltRoute(prev => [...prev, [lat, lng]]);
    }
  };

  const removeLastPoint = (mode: 'main' | 'alt') => {
    if (mode === 'main') setMainRoute(p => p.slice(0, -1));
    else setAltRoute(p => p.slice(0, -1));
  };

  const clearRoute = (mode: 'main' | 'alt') => {
    if (mode === 'main') setMainRoute([]);
    else setAltRoute([]);
  };

  const canSubmit = title.trim().length >= 5 && description.trim().length >= 10 && mainRoute.length >= 2;

  const handleSubmit = () => {
    if (!canSubmit || !currentUser) return;
    setSubmitting(true);

    const orgForUser = organizations.find(o =>
      currentUser.role === 'organization'
        ? o.id === `org-${currentUser.id.replace('user-', '')}`
        : true
    ) || organizations[0];

    const announcement: MapAnnouncement = {
      id: generateId(),
      organizationId: orgForUser?.id || 'org-roads',
      organizationName: orgForUser?.name || "Toshkent Yo'l Boshqarmasi",
      type,
      title: title.trim(),
      description: description.trim(),
      route: mainRoute,
      alternativeRoute: altRoute.length >= 2 ? altRoute : undefined,
      alternativeDescription: altDescription.trim() || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      status: new Date(startDate) <= new Date() ? 'active' : 'planned',
      createdAt: new Date().toISOString(),
    };

    addAnnouncement(announcement);
    setTimeout(() => { setSubmitting(false); onClose(); }, 400);
  };

  const typeKeys = Object.keys(ANNOUNCEMENT_TYPE_CONFIG) as AnnouncementType[];

  const conf = ANNOUNCEMENT_TYPE_CONFIG[type];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg"
              style={{ backgroundColor: conf.color }}>
              {conf.icon}
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Xarita e'loni qo'shish</h2>
              <p className="text-xs text-gray-500">Xaritada yo'nalish chizing</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {[
            { id: 'info', label: "Ma'lumot", icon: <Info className="w-3.5 h-3.5" /> },
            { id: 'route', label: 'Xaritada belgilash', icon: <Route className="w-3.5 h-3.5" /> },
            { id: 'preview', label: 'Ko\'rib chiqish', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStep(s.id as typeof step)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2',
                step === s.id
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">

          {/* ── Step 1: Info ── */}
          {step === 'info' && (
            <div className="p-6 space-y-5">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">E'lon turi</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {typeKeys.map(t => {
                    const tc = ANNOUNCEMENT_TYPE_CONFIG[t];
                    return (
                      <button
                        key={t}
                        onClick={() => setType(t)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-semibold transition-all',
                          type === t ? 'border-current' : 'border-gray-200 hover:border-gray-300'
                        )}
                        style={type === t ? { borderColor: tc.color, backgroundColor: tc.bgColor, color: tc.color } : {}}
                      >
                        <span className="text-xl">{tc.icon}</span>
                        <span className="text-center leading-tight">{tc.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Sarlavha <span className="text-red-500">*</span>
                </label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="city-input"
                  placeholder="Masalan: Amir Temur ko'chasi yo'li yopilgan"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Batafsil tavsif <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="city-input resize-none"
                  placeholder="Fuqarolarga qanday ma'lumot beriladi? Nima uchun yopilgan/ta'mirlanmoqda?"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" /> Boshlanish
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="city-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 inline mr-1" /> Tugash
                    <span className="text-gray-400 font-normal ml-1">(ixtiyoriy)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="city-input text-sm"
                  />
                </div>
              </div>

              {/* Alt description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Muqobil yo'nalish tavsifi
                  <span className="text-gray-400 font-normal ml-1">(ixtiyoriy)</span>
                </label>
                <input
                  value={altDescription}
                  onChange={e => setAltDescription(e.target.value)}
                  className="city-input"
                  placeholder="Masalan: Navoiy ko'chasi orqali aylanib o'ting"
                />
              </div>

              <button
                onClick={() => setStep('route')}
                disabled={title.trim().length < 5 || description.trim().length < 10}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all',
                  title.trim().length >= 5 && description.trim().length >= 10
                    ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                Davom etish — Xaritada belgilash <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Route drawing ── */}
          {step === 'route' && (
            <div className="flex flex-col h-full">
              {/* Controls */}
              <div className="p-4 space-y-3 border-b border-gray-100">
                {/* Main route */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm font-bold text-red-700">
                        {conf.label} yo'nalishi
                        {mainRoute.length > 0 && <span className="ml-1.5 text-xs font-normal">({mainRoute.length} nuqta)</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {mainRoute.length > 0 && (
                        <button onClick={() => removeLastPoint('main')}
                          className="text-xs text-red-600 hover:underline px-2 py-1 rounded">
                          Oxirgisini o'chir
                        </button>
                      )}
                      {mainRoute.length > 0 && (
                        <button onClick={() => clearRoute('main')}
                          className="w-7 h-7 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center text-red-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setDrawMode(drawMode === 'main' ? null : 'main')}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                          drawMode === 'main'
                            ? 'bg-red-600 text-white'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        )}
                      >
                        <Navigation className="w-3 h-3" />
                        {drawMode === 'main' ? 'Belgilash jarayonida...' : 'Xaritada belgilash'}
                      </button>
                    </div>
                  </div>
                  {drawMode === 'main' && (
                    <p className="text-xs text-red-600 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Xaritaga bosib yo'nalish nuqtalarini qo'shing. Tugatgach "To'xtatish" tugmasini bosing.
                    </p>
                  )}
                </div>

                {/* Alt route */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm font-bold text-green-700">
                        Muqobil yo'nalish
                        <span className="text-gray-400 font-normal ml-1">(ixtiyoriy)</span>
                        {altRoute.length > 0 && <span className="ml-1.5 text-xs font-normal text-green-600">({altRoute.length} nuqta)</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {altRoute.length > 0 && (
                        <button onClick={() => removeLastPoint('alt')}
                          className="text-xs text-green-600 hover:underline px-2 py-1 rounded">
                          Oxirgisini o'chir
                        </button>
                      )}
                      {altRoute.length > 0 && (
                        <button onClick={() => clearRoute('alt')}
                          className="w-7 h-7 rounded-lg bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-600 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setDrawMode(drawMode === 'alt' ? null : 'alt')}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                          drawMode === 'alt'
                            ? 'bg-green-600 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        )}
                      >
                        <Plus className="w-3 h-3" />
                        {drawMode === 'alt' ? 'Belgilash jarayonida...' : 'Muqobil belgilash'}
                      </button>
                    </div>
                  </div>
                  {drawMode === 'alt' && (
                    <p className="text-xs text-green-600 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" /> Muqobil yo'l nuqtalarini belgilang (yashil chiziq bilan ko'rsatiladi).
                    </p>
                  )}
                </div>
              </div>

              {/* Map */}
              <div className="h-72 relative">
                {drawMode && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-white rounded-full shadow px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                    style={{ color: drawMode === 'main' ? '#DC2626' : '#16A34A' }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: drawMode === 'main' ? '#DC2626' : '#16A34A' }} />
                    Xaritaga bosing — nuqta qo'shiladi
                  </div>
                )}
                <MapView
                  reports={[]}
                  height="100%"
                  onMapClick={handleMapClick}
                  drawingPoints={mainRoute}
                  drawingAltPoints={altRoute}
                />
              </div>

              {/* Bottom actions */}
              <div className="p-4 border-t border-gray-100 flex gap-3">
                <button onClick={() => setStep('info')}
                  className="flex-1 city-btn-secondary justify-center text-sm">
                  ← Orqaga
                </button>
                <button
                  onClick={() => setStep('preview')}
                  disabled={mainRoute.length < 2}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all',
                    mainRoute.length >= 2
                      ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  Ko'rib chiqish <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Preview ── */}
          {step === 'preview' && (
            <div className="p-5 space-y-4">
              {/* Summary card */}
              <div className="rounded-2xl border-2 p-4 space-y-3" style={{ borderColor: conf.color + '40', backgroundColor: conf.bgColor }}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{conf.icon}</span>
                  <div>
                    <p className="font-bold text-gray-900">{title}</p>
                    <p className="text-xs font-semibold" style={{ color: conf.color }}>{conf.label}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  <span>📅 {new Date(startDate).toLocaleString('uz-UZ')}</span>
                  {endDate && <span>→ {new Date(endDate).toLocaleString('uz-UZ')}</span>}
                </div>
                {altDescription && (
                  <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <ArrowRight className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-green-700">{altDescription}</p>
                  </div>
                )}
              </div>

              {/* Route summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="font-medium">Asosiy yo'nalish:</span>
                  <span className="text-gray-500">{mainRoute.length} ta nuqta belgilangan</span>
                </div>
                {altRoute.length >= 2 && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="font-medium">Muqobil yo'nalish:</span>
                    <span className="text-gray-500">{altRoute.length} ta nuqta belgilangan</span>
                  </div>
                )}
              </div>

              {/* Preview map */}
              <div className="h-52 rounded-xl overflow-hidden border border-gray-200">
                <MapView
                  reports={[]}
                  announcements={[{
                    id: 'preview',
                    organizationId: '',
                    organizationName: '',
                    type,
                    title,
                    description,
                    route: mainRoute,
                    alternativeRoute: altRoute.length >= 2 ? altRoute : undefined,
                    startDate: new Date(startDate).toISOString(),
                    status: 'active',
                    createdAt: new Date().toISOString(),
                  }]}
                  center={mainRoute.length > 0 ? mainRoute[0] : [41.2995, 69.2401]}
                  zoom={14}
                  height="100%"
                />
              </div>

              {/* Info notice */}
              <div className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  E'lon xaritada ko'rsatiladi va barcha fuqarolar ko'rishi mumkin bo'ladi. Keyinroq tahrirlab yoki o'chirib tashlashingiz mumkin.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep('route')} className="flex-1 city-btn-secondary justify-center">
                  ← Orqaga
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all',
                    canSubmit ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  )}
                >
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saqlanmoqda...</>
                    : <><CheckCircle2 className="w-4 h-4" /> E'lonni e'lon qilish</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
