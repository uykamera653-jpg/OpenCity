import { useEffect } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/stores/appStore';

export default function SupabaseBootstrap() {
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void useAppStore.getState().refresh();
  }, []);
  return null;
}
