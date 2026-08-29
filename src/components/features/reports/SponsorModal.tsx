import { useState } from 'react';
import {
  X, Globe, Phone, Mail, Building2, CheckCircle2, Info,
  ArrowRight, ChevronRight
} from 'lucide-react';
import { BusinessSponsor } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { generateId } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
  reportId: string;
  reportTitle: string;
  onClose: () => void;
}

const SPONSOR_TYPES = [
  {
    id: 'full' as const,
    label: "To'liq zimmasiga olish",
    description: "Muammoni to'liq hal qilishni o'z zimmangizga olasiz",
    icon: '🏆',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  {
    id: 'partial' as const,
    label: 'Qisman yordam',
    description: 'Muammoni hal qilishda qisman ishtirok etasiz',
    icon: '🤝',
    color: '#7C3AED',
    bg: '#EDE9FE',
    border: '#DDD6FE',
  },
  {
    id: 'material' as const,
    label: 'Material / moliyaviy yordam',
    description: 'Materiallar, asbob-uskunalar yoki moliyaviy yordam berasiz',
    icon: '📦',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
  },
];

export default function SponsorModal({ reportId, reportTitle, onClose }: Props) {
  const { addSponsor } = useAppStore();
  const { currentUser } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [pledgeMessage, setPledgeMessage] = useState('');
  const [sponsorType, setSponsorType] = useState<'full' | 'partial' | 'material'>('full');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = businessName.trim().length >= 2 && pledgeMessage.trim().length >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    const sponsor: BusinessSponsor = {
      id: generateId(),
      reportId,
      businessName: businessName.trim(),
      businessDescription: businessDescription.trim() || undefined,
      website: website.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      pledgeMessage: pledgeMessage.trim(),
      sponsorType,
      status: 'pledged',
      pledgedAt: new Date().toISOString(),
      userId: currentUser?.id,
    };

    addSponsor(reportId, sponsor);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 500);
  };

  if (submitted) {
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Rahmat, {businessName}! 🎉</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">
            Muammoni zimmasiga olganingiz uchun katta rahmat!
          </p>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Brendingiz endi muammo sahifasida va xaritada ko'rsatiladi. 
            Bu qo'llab-quvvatlash shahar fuqarolariga juda muhim!
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 city-btn-secondary justify-center">
              Yopish
            </button>
            <button onClick={onClose} className="flex-1 city-btn-primary justify-center">
              Zo'r! <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🤝</div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900">Muammoni zimmaga olish</h2>
            <p className="text-xs text-gray-500 mt-0.5">Brendingizni reklamaga emas, ijtimoiy loyihaga sarflang</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Promo banner */}
        <div className="px-5 py-3 bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white flex-shrink-0">
          <p className="text-xs font-bold mb-0.5 opacity-80">Muammo:</p>
          <p className="text-sm font-semibold line-clamp-1">"{reportTitle}"</p>
          <p className="text-[11px] text-blue-200 mt-1">
            Reklamaga ketadigan pulni yaxshi ishga sarflang — brendingiz muammo sahifasida va xaritada ko'rsatiladi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-5 space-y-5">

            {/* Support type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Yordam turi</label>
              <div className="space-y-2">
                {SPONSOR_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSponsorType(t.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                      sponsorType === t.id ? '' : 'border-gray-200 hover:border-gray-300'
                    )}
                    style={sponsorType === t.id ? { borderColor: t.color, backgroundColor: t.bg } : {}}
                  >
                    <span className="text-xl flex-shrink-0">{t.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: sponsorType === t.id ? t.color : '#374151' }}>
                        {t.label}
                      </p>
                      <p className="text-xs text-gray-500">{t.description}</p>
                    </div>
                    {sponsorType === t.id && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: t.color }}
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Business name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Biznes / kompaniya nomi <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="city-input pl-10"
                  placeholder="Masalan: AKFA Group, Hamkor Bank, GreenCity..."
                  required
                />
              </div>
            </div>

            {/* Business description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Kompaniya haqida qisqacha
                <span className="text-gray-400 font-normal ml-1">(ixtiyoriy)</span>
              </label>
              <input
                value={businessDescription}
                onChange={e => setBusinessDescription(e.target.value)}
                className="city-input"
                placeholder="Masalan: Qurilish materiallari yetkazib berish kompaniyasi"
              />
            </div>

            {/* Pledge message */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nima qilishni rejalashtirmoqdasiz? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={pledgeMessage}
                onChange={e => setPledgeMessage(e.target.value.slice(0, 250))}
                rows={3}
                className="city-input resize-none"
                placeholder="Masalan: Maktabning 20 ta derazasini bepul almashtirish va o'rnatish ishlarini bajaramiz. Material va ish kuchi bizdan."
              />
              <div className="flex justify-between mt-1">
                {pledgeMessage.length < 10 && pledgeMessage.length > 0 && (
                  <p className="text-xs text-red-500">Kamida 10 ta belgi kiriting</p>
                )}
                <p className="text-xs text-gray-400 ml-auto">{pledgeMessage.length}/250</p>
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Aloqa ma'lumotlari
                <span className="text-gray-400 font-normal ml-1">(ixtiyoriy)</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  className="city-input pl-10"
                  placeholder="https://yourcompany.uz"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    className="city-input pl-10"
                    placeholder="email@company.uz"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    className="city-input pl-10"
                    placeholder="+998 90 000-00-00"
                  />
                </div>
              </div>
            </div>

            {/* Info notice */}
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Zimmasiga olingan muammo sahifasida kompaniyangiz nomi, majburiyat xabari va aloqa ma'lumotlari ko'rsatiladi. 
                Muammo hal etilganda brend yanada ko'proq e'tiborga tushadi.
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button type="button" onClick={onClose} className="flex-1 city-btn-secondary justify-center">
            Bekor qilish
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all',
              canSubmit
                ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              <>🤝 Zimmaga olish</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
