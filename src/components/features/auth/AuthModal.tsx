import { useState } from 'react';
import { X, Mail, Lock, User, Building2, Shield, Chrome } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, loginWithEmail, registerWithEmail, loginAsDemo } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(authModalTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('citizen');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'register') {
        const user = await registerWithEmail(email, password, name, role);
        if (!user) return;
        toast.success('Ro‘yxatdan o‘tish muvaffaqiyatli');
      } else {
        await loginWithEmail(email, password);
        toast.success('Xush kelibsiz!');
      }
      closeAuthModal();
    } catch (error: any) {
      toast.error(error?.message || 'Amalni bajarib bo‘lmadi');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions: { value: UserRole; label: string; icon: React.ElementType; desc: string }[] = [
    { value: 'citizen', label: 'Fuqaro', icon: User, desc: 'Muammo bildirish va ovoz berish' },
    { value: 'organization', label: 'Tashkilot', icon: Building2, desc: 'Muammolarni hal qilish' },
    { value: 'admin', label: 'Administrator', icon: Shield, desc: 'Tizimni boshqarish' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAuthModal} />
      <div className="relative bg-white rounded-2xl shadow-glass-lg w-full max-w-md animate-scale-in overflow-hidden">
        <div className="bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] px-6 py-5">
          <div className="flex items-center justify-between">
            <div><h2 className="text-white font-bold text-xl">OpenCity</h2><p className="text-blue-100 text-sm mt-0.5">Aqlli Shahar Platformasi</p></div>
            <button onClick={closeAuthModal} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30"><X className="w-4 h-4 text-white" /></button>
          </div>
          <div className="flex mt-4 bg-white/20 rounded-lg p-1">
            {(['login', 'register'] as const).map(t => <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-1.5 text-sm font-medium rounded-md', tab === t ? 'bg-white text-[#2563EB]' : 'text-white/80')}>{t === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}</button>)}
          </div>
        </div>
        <div className="p-6">
          <div className="mb-5"><p className="text-xs text-gray-500 mb-2 font-medium">Demo sifatida kirish:</p><div className="flex gap-2">{roleOptions.map(({ value, label, icon: Icon }) => <button key={value} onClick={() => loginAsDemo(value)} className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border border-gray-200 hover:border-[#2563EB] hover:bg-blue-50 text-xs font-medium text-gray-700"><Icon className="w-4 h-4" />{label}</button>)}</div></div>
          <div className="flex items-center gap-3 mb-5"><div className="h-px flex-1 bg-gray-200" /><span className="text-xs text-gray-400">yoki</span><div className="h-px flex-1 bg-gray-200" /></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Ism familiya</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={name} onChange={e => setName(e.target.value)} required className="city-input pl-10" placeholder="Alisher Nazarov" /></div></div>}
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="city-input pl-10" placeholder="email@example.com" /></div></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Parol</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="city-input pl-10" placeholder="••••••••" /></div></div>
            {tab === 'register' && <div><label className="block text-xs font-semibold text-gray-700 mb-2">Rol</label><div className="grid grid-cols-3 gap-2">{roleOptions.map(({ value, label, icon: Icon, desc }) => <button key={value} type="button" onClick={() => setRole(value)} className={cn('p-2.5 rounded-xl border-2 text-xs text-center', role === value ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]' : 'border-gray-200 text-gray-600')}><Icon className="w-4 h-4 mx-auto mb-1" /><div className="font-semibold">{label}</div><div className="text-[10px] mt-0.5 opacity-70">{desc}</div></button>)}</div></div>}
            <button type="submit" disabled={loading} className="city-btn-primary w-full justify-center py-3">{loading ? 'Yuklanmoqda...' : tab === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}</button>
          </form>
          <button onClick={() => loginAsDemo('citizen')} className="city-btn-secondary w-full justify-center mt-3 gap-2"><Chrome className="w-4 h-4 text-red-500" /> Google orqali kirish</button>
          <p className="text-center text-xs text-gray-500 mt-4">{tab === 'login' ? "Akkaunt yo'qmi? " : 'Akkaunt bormi? '}<button onClick={() => setTab(tab === 'login' ? 'register' : 'login')} className="text-[#2563EB] font-semibold hover:underline">{tab === 'login' ? "Ro'yxatdan o'tish" : 'Kirish'}</button></p>
        </div>
      </div>
    </div>
  );
}
