import { supabase } from '@/lib/supabase';

export type AIReportSuggestion = {
  categoryId?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  title?: string;
  description?: string;
  confidence?: number;
  reason?: string;
};

export async function analyzeReportWithAI(input: {
  title?: string;
  description: string;
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  imageUrls?: string[];
}): Promise<AIReportSuggestion | null> {
  const { data, error } = await supabase.functions.invoke('opencity-ai', { body: input });
  if (error) throw error;
  return data?.suggestion ?? null;
}
