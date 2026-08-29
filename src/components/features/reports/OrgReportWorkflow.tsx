import { useState } from 'react';
import { X, CheckCircle2, PlayCircle, CheckCheck, XCircle, Eye, AlertTriangle, Camera, Plus, Trash2, ChevronRight, ClipboardCheck } from 'lucide-react';
import { Report, ReportStatus } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { useAuth } from '@/hooks/useAuth';
import { STATUS_CONFIG } from '@/constants/categories';
import StatusBadge from './StatusBadge';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';

interface Props {
  report: Report;
  onClose: () => void;
}

type WorkflowStep = 'choose' | 'complete';

// Status flow: what actions are available for each status
const WORKFLOW_ACTIONS: Record<string, { status: ReportStatus; label: string; icon: React.ReactNode; color: string; bg: string; border: string; description: string }[]> = {
  new: [
    { status: 'review', label: 'Ko\'rib chiqishga olish', icon: <Eye className="w-4 h-4" />, color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', description: 'Muammo ko\'rib chiqilayotganini bildiradi' },
    { status: 'accepted', label: 'Qabul qilish', icon: <CheckCircle2 className="w-4 h-4" />, color: '#CA8A04', bg: '#FEFCE8', border: '#FDE68A', description: 'Muammo qabul qilinib, navbatga olindi' },
    { status: 'inprogress', label: 'Ishni boshlash', icon: <PlayCircle className="w-4 h-4" />, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', description: 'Hozirda ishlov berilmoqda' },
    { status: 'rejected', label: 'Rad etish', icon: <XCircle className="w-4 h-4" />, color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB', description: 'Muammo bizning vazifamiz emas' },
  ],
  review: [
    { status: 'accepted', label: 'Qabul qilish', icon: <CheckCircle2 className="w-4 h-4" />, color: '#CA8A04', bg: '#FEFCE8', border: '#FDE68A', description: 'Muammo qabul qilinib, navbatga olindi' },
    { status: 'inprogress', label: 'Ishni boshlash', icon: <PlayCircle className="w-4 h-4" />, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', description: 'Hozirda ishlov berilmoqda' },
    { status: 'rejected', label: 'Rad etish', icon: <XCircle className="w-4 h-4" />, color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB', description: 'Muammo bizning vazifamiz emas' },
  ],
  accepted: [
    { status: 'inprogress', label: 'Ishni boshlash', icon: <PlayCircle className="w-4 h-4" />, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', description: 'Hozirda ishlov berilmoqda' },
    { status: 'rejected', label: 'Rad etish', icon: <XCircle className="w-4 h-4" />, color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB', description: 'Muammo bizning vazifamiz emas' },
  ],
  inprogress: [
    { status: 'completed', label: 'Tugatib yopish', icon: <CheckCheck className="w-4 h-4" />, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0', description: 'Muammo muvaffaqiyatli hal qilindi' },
    { status: 'rejected', label: 'Bekor qilish', icon: <XCircle className="w-4 h-4" />, color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB', description: 'Muammoni hal qilib bo\'lmadi' },
  ],
  completed: [],
  rejected: [
    { status: 'review', label: 'Qayta ko\'rib chiqish', icon: <Eye className="w-4 h-4" />, color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', description: 'Rad etish qarorini qayta ko\'rib chiqish' },
  ],
  ignored: [
    { status: 'review', label: 'Qayta ko\'rib chiqish', icon: <Eye className="w-4 h-4" />, color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', description: 'Muammoni qayta ko\'rib chiqish' },
  ],
};

export default function OrgReportWorkflow({ report, onClose }: Props) {
  const { updateReportStatus, reports } = useAppStore();
  const { currentUser } = useAuth();
  const [step, setStep] = useState<WorkflowStep>('choose');
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | null>(null);
  const [note, setNote] = useState('');
  // Completion specific
  const [completionDesc, setCompletionDesc] = useState('');
  const [completionPhotos, setCompletionPhotos] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);

  // Live report data
  const liveReport = reports.find(r => r.id === report.id) || report;
  const actions = WORKFLOW_ACTIONS[liveReport.status] || [];
  const currentStatusConf = STATUS_CONFIG[liveReport.status];
  const isCompleted = liveReport.status === 'completed';

  const handleChooseStatus = (status: ReportStatus) => {
    setSelectedStatus(status);
    if (status === 'completed') {
      setStep('complete');
    }
  };

  const handleQuickAction = (status: ReportStatus, autoNote: string) => {
    if (!currentUser) return;
    setSubmitting(true);
    updateReportStatus(liveReport.id, status, autoNote);
    setTimeout(() => { setSubmitting(false); setStep('choose'); setSelectedStatus(null); setNote(''); }, 300);
  };

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionDesc.trim() || !currentUser) return;
    setSubmitting(true);
    const validPhotos = completionPhotos.filter(p => p.trim() !== '');

    // Update status + attach completion data
    useAppStore.setState(state => ({
      reports: state.reports.map(r => {
        if (r.id !== liveReport.id) return r;
        const newEntry = {
          id: generateId(),
          status: 'completed' as ReportStatus,
          note: completionDesc,
          authorId: currentUser!.id,
          authorName: currentUser!.name,
          authorRole: currentUser!.role,
          createdAt: new Date().toISOString(),
        };
        return {
          ...r,
          status: 'completed' as ReportStatus,
          completionDescription: completionDesc,
          completionPhotos: validPhotos,
          completionDate: new Date().toISOString(),
          solvedBy: currentUser!.name,
          updatedAt: new Date().toISOString(),
          timeline: [...r.timeline, newEntry],
        };
      }),
    }));

    setTimeout(() => {
      setSubmitting(false);
      setStep('choose');
      setSelectedStatus(null);
      setNote('');
      setCompletionDesc('');
      setCompletionPhotos(['']);
    }, 300);
  };

  const addPhotoSlot = () => {
    if (completionPhotos.length < 5) setCompletionPhotos(p => [...p, '']);
  };
  const removePhotoSlot = (i: number) => setCompletionPhotos(p => p.filter((_, idx) => idx !== i));
  const updatePhoto = (i: number, val: string) => setCompletionPhotos(p => p.map((url, idx) => idx === i ? val : url));

  return (
    <div className="bg-white rounded-2xl border-2 border-[#2563EB]/20 shadow-glass overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#EFF6FF] border-b border-[#BFDBFE]">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-[#2563EB]" />
          <span className="text-sm font-bold text-[#1D4ED8]">Muammo boshqaruvi</span>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-500 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Report info */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-500 mb-0.5">Tanlangan muammo</p>
        <p className="text-sm font-bold text-gray-900 line-clamp-1">{liveReport.title}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-gray-500">Hozirgi holat:</span>
          <StatusBadge status={liveReport.status} size="sm" />
          {liveReport.priority === 'urgent' && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600">
              <AlertTriangle className="w-3 h-3" /> Shoshilinch
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isCompleted ? (
          <div className="text-center py-4">
            <CheckCheck className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-green-700">Muammo muvaffaqiyatli yopildi</p>
            <p className="text-xs text-green-600 mt-1">Bu muammo allaqachon bajarilgan holatda</p>
          </div>
        ) : step === 'choose' ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kerakli amalni tanlang</p>

            {actions.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Hozircha amal yo'q</p>
            ) : (
              <div className="space-y-2">
                {actions.map(action => (
                  <button
                    key={action.status}
                    onClick={() => {
                      if (action.status === 'completed') {
                        handleChooseStatus(action.status);
                      } else {
                        // Quick actions with auto-note prompt
                        setSelectedStatus(action.status);
                      }
                    }}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left',
                      selectedStatus === action.status
                        ? 'ring-2 ring-offset-1'
                        : 'hover:shadow-sm'
                    )}
                    style={{
                      backgroundColor: action.bg,
                      borderColor: selectedStatus === action.status ? action.color : action.border,
                      ...(selectedStatus === action.status ? { '--tw-ring-color': action.color } as React.CSSProperties : {}),
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: action.color + '20', color: action.color }}>
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: action.color }}>{action.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{action.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: action.color }} />
                  </button>
                ))}
              </div>
            )}

            {/* Note input for non-complete actions */}
            {selectedStatus && selectedStatus !== 'completed' && (
              <div className="space-y-2 pt-1 animate-fade-in">
                <label className="block text-xs font-semibold text-gray-700">
                  Izoh <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  className="city-input resize-none text-sm"
                  placeholder="Nima bo'ldi? Qanday qaror qilindi?..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedStatus(null); setNote(''); }}
                    className="flex-1 city-btn-secondary justify-center text-sm py-2"
                  >
                    Bekor
                  </button>
                  <button
                    onClick={() => handleQuickAction(selectedStatus, note || `${STATUS_CONFIG[selectedStatus].label} — ${currentUser?.name}`)}
                    disabled={!note.trim() || submitting}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold transition-all',
                      note.trim()
                        ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '✓'} Saqlash
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Completion form */
          <form onSubmit={handleComplete} className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => { setStep('choose'); setSelectedStatus(null); }}
                className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
                ← Orqaga
              </button>
              <span className="text-xs text-gray-400">|</span>
              <span className="text-xs font-semibold text-green-700">✅ Tugatib yopish</span>
            </div>

            {/* Completion description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Bajarilgan ish tavsifi <span className="text-red-500">*</span>
              </label>
              <textarea
                value={completionDesc}
                onChange={e => setCompletionDesc(e.target.value)}
                rows={3}
                className="city-input resize-none text-sm"
                placeholder="Qanday ish bajarildi? Nima o'zgartirildi yoki tuzatildi?..."
              />
              {completionDesc.length > 0 && completionDesc.trim().length < 10 && (
                <p className="text-xs text-red-500 mt-1">Kamida 10 ta belgi</p>
              )}
            </div>

            {/* Completion photos */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Natija rasmlari <span className="text-gray-400 font-normal">(ixtiyoriy — tavsiya etiladi)</span>
              </label>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5" /> Rasm URL manzili (to'liq versiyada fayl yuklash bo'ladi)
              </p>
              <div className="space-y-2">
                {completionPhotos.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={e => updatePhoto(i, e.target.value)}
                      className="city-input flex-1 py-2 text-sm"
                      placeholder={`https://... natija rasmi ${i + 1}`}
                    />
                    {completionPhotos.length > 1 && (
                      <button type="button" onClick={() => removePhotoSlot(i)}
                        className="w-9 h-9 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-300 flex items-center justify-center flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {completionPhotos.length < 5 && (
                  <button type="button" onClick={addPhotoSlot}
                    className="flex items-center gap-1.5 text-xs text-[#2563EB] hover:underline">
                    <Plus className="w-3.5 h-3.5" /> Rasm qo'shish
                  </button>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!completionDesc.trim() || completionDesc.trim().length < 10 || submitting}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all',
                completionDesc.trim().length >= 10
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {submitting
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saqlanmoqda...</>
                : <><CheckCheck className="w-4 h-4" /> Muammoni yopish</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
