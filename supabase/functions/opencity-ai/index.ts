import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM = `You are OpenCity AI, a civic-issue triage assistant. Analyze a citizen report and return ONLY valid JSON. Do not invent facts. Suggest one category only when evidence is sufficient. Priority: urgent means immediate danger to people/property (fire, gas leak, exposed live wires, major flooding, collapse); high means serious public-safety or major infrastructure issue; medium means normal service issue; low means cosmetic/minor issue. Output: {"title":string,"description":string,"categoryId":string|null,"priority":"low"|"medium"|"high"|"urgent","confidence":number,"reason":string}. Keep reason under 180 characters.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'POST required' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } });
  try {
    const body = await req.json();
    const key = Deno.env.get('GEMINI_API_KEY');
    if (!key) throw new Error('GEMINI_API_KEY is not configured');
    const prompt = `${SYSTEM}\n\nCitizen report:\nTitle: ${body.title ?? ''}\nDescription: ${body.description ?? ''}\nExisting category: ${body.categoryId ?? 'none'}\nLocation: ${body.latitude ?? ''}, ${body.longitude ?? ''}`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, responseMimeType: 'application/json' } }),
    });
    if (!response.ok) throw new Error(`AI provider error: ${response.status}`);
    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty AI response');
    const suggestion = JSON.parse(text);
    return new Response(JSON.stringify({ suggestion }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'AI analysis failed' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
