import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Upload, X, ArrowLeft, ArrowRight, Check, Crosshair, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES, DEFAULT_ROUTING_RULES } from '@/constants/categories';
import { CategoryId, Priority, Report } from '@/types';
import { generateId, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import MapView from '@/components/features/map/MapView';

const TASHKENT_DISTRICTS = ['Yunusobod', 'Chilonzor', "Mirzo Ulug'bek", 'Yakkasaroy', 'Shayxontohur', 'Olmazar', 'Sergeli', 'Uchtepa', 'Yashnobod', 'Bektemir'];

const STEPS = ['Kategoriya', 'Joylashuv', "Ma'lumot", 'Tasdiqlash'];

export default function CreateReportPage() {
  const { currentUser, openAuthModal } = useAuth();
  const { addReport, reports, routingRules } = useAppStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [location, setLocation] = useState({ lat: 41.2995, lng: 69.2401, address: '', district: '' });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [anonymous, setAnonymous] = useState(false);
  const [photos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdId, setCreatedId] = useState('');

  const nearbyReport = category ? reports.find(r => {
    const dist = Math.sqrt(Math.pow(r.location.lat - location.lat, 2) + Math.pow(r.location.lng - location.lng, 2));
    return dist < 0.003 && r.categoryId === category;
  }) : null;

  const getOrgForCategory = (catId: CategoryId) => {
    return routingRules.find(r => r.categoryId === catId)?.organizationId || 'org-admin';
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-2xl shadow-glass p-10 max-w-sm w-full mx-4">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Kirish talab qilinadi</h2>
          <p className="text-sm text-gray-500 mb-6">Muammo bildirish uchun tizimga kiring</p>
          <button onClick={() => openAuthModal('login')} className="city-btn-primary w-full justify-center">Kirish</button>
        </div>
      </div>
    );
  }

  const canNext = () => {
    if (step === 0) return !!category;
    if (step === 1) return !!location.address && !!location.district;
    if (step === 2) return title.length >= 10 && description.length >= 20;
    return true;
  };

  const handleSubmit = async () => {
    if (!category) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    const id = 'rep-' + generateId();
    const report: Report = {
      id,
      title,
      description,
      categoryId: category,
      status: 'new',
      location: { lat: location.lat, lng: location.lng, address: location.address, district: location.district },
      photos: photos.length > 0 ? photos : [],
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      anonymous,
      organizationId: getOrgForCategory(category),
      votes: 0,
      isVoted: false,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [{ id: 'tl-0', status: 'new', note: "Muammo bildirilib, tizimga qo'shildi", authorId: currentUser.id, authorName: currentUser.name, authorRole: currentUser.role, createdAt: new Date().toISOString() }],
      priority,
      viewCount: 0,
    };
    addReport(report);
    setCreatedId(id);
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-2xl shadow-glass p-10 max-w-sm w-full mx-4 animate-scale-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Muvaffaqiyatli yuborildi!</h2>
          <p className="text-sm text-gray-500 mb-6">Muammongiz ro'yxatga olindi va mas'ul tashkilotga yuborildi.</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate(`/reports/${createdId}`)} className="city-btn-primary w-full justify-center">Muammoni ko'rish</button>
            <button onClick={() => navigate('/reports')} className="city-btn-secondary w-full justify-center">Barchasiga qaytish</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="city-btn-ghost p-2 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Muammo bildirish</h1>
            <p className="text-sm text-gray-500">{step + 1}/{STEPS.length}: {STEPS[step]}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={cn('h-1.5 rounded-full transition-all', i <= step ? 'bg-[#2563EB]' : 'bg-gray-200')} />
              <p className={cn('text-xs mt-1.5 font-medium text-center hidden sm:block', i <= step ? 'text-[#2563EB]' : 'text-gray-400')}>{s}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-glass border border-gray-100 p-6 animate-fade-in">
          {/* Step 0: Category */}
          {step === 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Kategoriya tanlang</h2>
              <p className="text-sm text-gray-500 mb-5">Muammo turiga mos kategoriyani belgilang</p>
              <div className="grid grid-cols-3 gap-2.5">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setCategory(cat.id as CategoryId)}
                    className={cn('p-3 rounded-xl border-2 text-center transition-all hover:scale-105',
                      category === cat.id ? 'border-[#2563EB]' : 'border-gray-100 hover:border-gray-300')}
                    style={category === cat.id ? { backgroundColor: cat.bgColor, borderColor: cat.color } : {}}>
                    <div className="text-2xl mb-1.5">{cat.icon}</div>
                    <div className={cn('text-xs font-semibold leading-tight', category === cat.id ? '' : 'text-gray-700')}
                      style={category === cat.id ? { color: cat.color } : {}}>{cat.name}</div>
                  </button>
                ))}
              </div>
              {category && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#1D4ED8]">
                    Mas'ul: <strong>{routingRules.find(r => r.categoryId === category)?.organizationName || "Shahar Ma'muriyati"}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Joylashuvni belgilang</h2>
              <p className="text-sm text-gray-500 mb-4">Xaritada bosing yoki manzilni kiriting</p>
              <div className="h-56 rounded-xl overflow-hidden mb-4 border border-gray-200">
                <MapView
                  reports={[]}
                  center={[location.lat, location.lng]}
                  zoom={13}
                  height="100%"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Aniq manzil *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={location.address} onChange={e => setLocation(l => ({ ...l, address: e.target.value }))}
                      className="city-input pl-10" placeholder="Ko'cha nomi, uy raqami..." />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Tuman *</label>
                  <select value={location.district} onChange={e => setLocation(l => ({ ...l, district: e.target.value }))}
                    className="city-input">
                    <option value="">Tumanni tanlang...</option>
                    {TASHKENT_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <button className="city-btn-secondary w-full justify-center gap-2">
                  <Crosshair className="w-4 h-4" /> GPS orqali avtomatik aniqlash
                </button>
              </div>
              {nearbyReport && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Shunga o'xshash muammo mavjud</p>
                  <p className="text-xs text-amber-700 mb-3">"{nearbyReport.title}" — bu yaqinda allaqachon bildirilgan.</p>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/reports/${nearbyReport.id}`)} className="flex-1 text-xs py-2 bg-amber-100 text-amber-800 rounded-lg font-medium hover:bg-amber-200 transition-colors">Mavjudni ko'rish</button>
                    <button className="flex-1 text-xs py-2 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors">Yangi muammo</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Muammo haqida yozing</h2>
              <p className="text-sm text-gray-500 mb-5">Batafsil ma'lumot tezroq hal qilishga yordam beradi</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Sarlavha * <span className="text-gray-400 font-normal">({title.length}/100)</span></label>
                  <input value={title} onChange={e => setTitle(e.target.value)} maxLength={100}
                    className="city-input" placeholder="Qisqa va aniq sarlavha kiriting..." />
                  {title.length > 0 && title.length < 10 && <p className="text-xs text-red-500 mt-1">Kamida 10 ta belgi</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Batafsil tavsif * <span className="text-gray-400 font-normal">({description.length}/1000)</span></label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} rows={5}
                    className="city-input resize-none" placeholder="Muammoni batafsil tasvirlang: qachondan beri, qanchalik jiddiy, kimlar ta'sirlanmoqda..." />
                  {description.length > 0 && description.length < 20 && <p className="text-xs text-red-500 mt-1">Kamida 20 ta belgi</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">Muhimlik darajasi</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[{ value: 'low', label: 'Past', color: '#6B7280' }, { value: 'medium', label: "O'rta", color: '#D97706' }, { value: 'high', label: 'Yuqori', color: '#EA580C' }, { value: 'urgent', label: 'Shoshilinch', color: '#DC2626' }].map(p => (
                      <button key={p.value} onClick={() => setPriority(p.value as Priority)}
                        className={cn('py-2 px-1 rounded-xl border-2 text-xs font-semibold transition-all', priority === p.value ? 'border-current' : 'border-gray-200 text-gray-500 hover:border-gray-300')}
                        style={priority === p.value ? { color: p.color, backgroundColor: p.color + '15', borderColor: p.color } : {}}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-2 block">Rasmlar yuklash</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#2563EB] transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Rasm tanlash yoki sudrab tashlang</p>
                    <p className="text-xs text-gray-400 mt-1">Maksimal 10 ta rasm, JPG/PNG/MP4</p>
                  </div>
                </div>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="w-4 h-4 rounded" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Anonim yuborish</p>
                    <p className="text-xs text-gray-500">Ismingiz ko'rsatilmaydi</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Tasdiqlang</h2>
              <p className="text-sm text-gray-500 mb-5">Ma'lumotlarni tekshirib, yuboring</p>
              <div className="space-y-3">
                {[
                  { label: 'Kategoriya', value: CATEGORIES.find(c => c.id === category)?.name || '' },
                  { label: 'Manzil', value: `${location.address}, ${location.district}` },
                  { label: "Mas'ul tashkilot", value: routingRules.find(r => r.categoryId === category)?.organizationName || "Shahar Ma'muriyati" },
                  { label: 'Sarlavha', value: title },
                  { label: 'Muhimlik', value: priority },
                  { label: 'Yuborilish', value: anonymous ? "Anonim" : currentUser.name },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                    <span className="text-xs font-semibold text-gray-500">{label}</span>
                    <span className="text-sm text-gray-900 font-medium text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <p className="text-xs text-[#1D4ED8]">📋 Muammongiz yuborilgandan so'ng mas'ul tashkilot xabardor qilinadi va holat yangilanadi.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="city-btn-secondary flex-1 justify-center py-3">
              <ArrowLeft className="w-4 h-4" /> Orqaga
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canNext()} className="city-btn-primary flex-1 justify-center py-3 disabled:opacity-40">
              Davom etish <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="city-btn-primary flex-1 justify-center py-3">
              {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Yuborilmoqda...</> : <><Check className="w-4 h-4" />Yuborish</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
