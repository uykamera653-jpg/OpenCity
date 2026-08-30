import { useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/appStore';

export default function SupabaseBootstrap() {
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const refresh = () => { void useAppStore.getState().refresh(); };
    refresh();

    const channel = supabase
      .channel('opencity-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'report_votes' }, refresh)
      .subscribe();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => refresh());

    return () => {
      authListener.subscription.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
