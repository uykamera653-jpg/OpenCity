import { useState } from 'react';
import { X, Mail, Lock, User, Chrome } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(authModalTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'register') {
        await registerWithEmail(email, password, name);
        toast.success('Ro‘yxatdan o‘tish muvaffaqiyatli. Emailingizni tasdiqlang.');
      } else {
        await loginWithEmail(email, password);
        toast.success('Xush kelibsiz!');
      }
      closeAuthModal();
    } catch (error: any) {
      toast.error(error?.message || 'Amalni bajarib bo‘lmadi');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try { await loginWithGoogle(); }
    catch (error: any) { toast.error(error?.message || 'Google orqali kirib bo‘lmadi'); setGoogleLoading(false); }
  };

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
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Ism familiya</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={name} onChange={e => setName(e.target.value)} required className="city-input pl-10" placeholder="Ism familiya" /></div></div>}
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="city-input pl-10" placeholder="email@example.com" /></div></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1.5">Parol</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="city-input pl-10" placeholder="••••••••" /></div></div>
            <button type="submit" disabled={loading} className="city-btn-primary w-full justify-center py-3">{loading ? 'Yuklanmoqda...' : tab === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}</button>
          </form>
          <div className="flex items-center gap-3 my-5"><div className="h-px flex-1 bg-gray-200" /><span className="text-xs text-gray-400">yoki</span><div className="h-px flex-1 bg-gray-200" /></div>
          <button onClick={handleGoogle} disabled={googleLoading} className="city-btn-secondary w-full justify-center mt-3 gap-2"><Chrome className="w-4 h-4 text-red-500" /> {googleLoading ? 'Google ochilmoqda...' : 'Google orqali kirish'}</button>
          <p className="text-center text-xs text-gray-500 mt-4">{tab === 'login' ? "Akkaunt yo'qmi? " : 'Akkaunt bormi? '}<button onClick={() => setTab(tab === 'login' ? 'register' : 'login')} className="text-[#2563EB] font-semibold hover:underline">{tab === 'login' ? "Ro'yxatdan o'tish" : 'Kirish'}</button></p>
        </div>
      </div>
    </div>
  );
}
