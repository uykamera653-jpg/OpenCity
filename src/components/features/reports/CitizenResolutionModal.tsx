import { useState } from 'react';
import { X, UserCheck, Camera, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { generateId, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Props {
  reportId: string;
  reportTitle: string;
  onClose: () => void;
}

export default function CitizenResolutionModal({ reportId, reportTitle, onClose }: Props) {
  const { submitCitizenResolution } = useAppStore();
  const { currentUser } = useAuth();
  const [description, setDescription] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);

  const addPhotoSlot = () => {
    if (photoUrls.length < 3) setPhotoUrls(p => [...p, '']);
  };

  const removePhotoSlot = (i: number) => {
    setPhotoUrls(p => p.filter((_, idx) => idx !== i));
  };

  const updatePhoto = (i: number, val: string) => {
    setPhotoUrls(p => p.map((url, idx) => idx === i ? val : url));
  };

  const validPhotos = photoUrls.filter(u => u.trim() !== '');
  const canSubmit = description.trim().length >= 15 && currentUser;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !currentUser) return;
    setSubmitting(true);
    submitCitizenResolution(reportId, {
      solverId: currentUser.id,
      solverName: currentUser.name,
      solverAvatar: currentUser.avatar,
      description: description.trim(),
      photos: validPhotos,
    });
    setTimeout(() => { setSubmitting(false); onClose(); }, 400);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Men bu muammoni hal qildim</h2>
                <p className="text-green-100 text-xs mt-0.5">Isbotingizni yuboring — jamoat tasdiqlaydi</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report title */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-500">Muammo:</p>
          <p className="text-sm font-semibold text-gray-800 line-clamp-1">{reportTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Solver info */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="w-9 h-9 rounded-full bg-[#2563EB]/20 flex items-center justify-center text-[#2563EB] text-sm font-bold overflow-hidden flex-shrink-0">
              {currentUser?.avatar
                ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                : getInitials(currentUser?.name || 'U')
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{currentUser?.name}</p>
              <p className="text-xs text-gray-500">Hal qiluvchi sifatida belgilanadi</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nima qildingiz? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className={cn('city-input resize-none text-sm', description.length > 0 && description.trim().length < 15 && 'border-red-300')}
              placeholder="Masalan: Daraxtlarni sugordim, xaridkor idishlar bilan suv oldim va har birini yetarlicha sugordim..."
            />
            <div className="flex justify-between mt-1">
              {description.trim().length < 15 && description.length > 0 && (
                <p className="text-xs text-red-500">Kamida 15 ta belgi kiriting</p>
              )}
              <p className="text-xs text-gray-400 ml-auto">{description.length} belgi</p>
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Isbot rasmlari <span className="text-gray-400 font-normal">(ixtiyoriy, lekin tavsiya etiladi)</span>
            </label>
            <p className="text-xs text-gray-500 mb-2.5 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" /> Rasm URL manzilini kiriting (to'liq ilovada fayl yuklash mavjud bo'ladi)
            </p>
            <div className="space-y-2">
              {photoUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={e => updatePhoto(i, e.target.value)}
                    className="city-input flex-1 py-2 text-sm"
                    placeholder={`https://... rasm ${i + 1}`}
                  />
                  {photoUrls.length > 1 && (
                    <button type="button" onClick={() => removePhotoSlot(i)}
                      className="w-9 h-9 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 flex items-center justify-center transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {photoUrls.length < 3 && (
                <button type="button" onClick={addPhotoSlot}
                  className="flex items-center gap-1.5 text-xs text-[#2563EB] hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Rasm qo'shish
                </button>
              )}
            </div>
          </div>

          {/* Notice */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Taklifingiz <strong>3 ta fuqaro tomonidan tasdiqlangach</strong> muammo avtomatik "Bajarildi" holatiga o'tadi. Siz hal qiluvchi sifatida ko'rsatilasiz.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 city-btn-secondary justify-center">
              Bekor qilish
            </button>
            <button type="submit" disabled={!canSubmit || submitting}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all',
                canSubmit
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}>
              {submitting ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yuborilmoqda...</span>
              ) : (
                <><UserCheck className="w-4 h-4" /> Taklif yuborish</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
