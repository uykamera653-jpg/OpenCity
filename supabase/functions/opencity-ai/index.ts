import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM = `You are OpenCity AI, a civic-issue triage assistant. Analyze a citizen report. Return ONLY valid JSON with: title, description, categoryId, priority, confidence, reason. priority must be low, medium, high, or urgent. urgent means immediate danger to people/property (fire, gas leak, exposed live wires, major flooding, collapse). high means serious public-safety or major infrastructure issue. medium is a normal service issue. low is minor/cosmetic. Never invent facts. confidence is 0 to 1. Keep reason under 180 characters.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'POST required' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } });
  try {
    const body = await req.json();
    const key = Deno.env.get('OPENAI_API_KEY');
    if (!key) throw new Error('OPENAI_API_KEY is not configured');
    const user = `Citizen report:\nTitle: ${body.title ?? ''}\nDescription: ${body.description ?? ''}\nExisting category: ${body.categoryId ?? 'none'}\nLocation: ${body.latitude ?? ''}, ${body.longitude ?? ''}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }], temperature: 0.1, response_format: { type: 'json_object' } }),
    });
    if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
    const result = await response.json();
    const text = result?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty OpenAI response');
    const suggestion = JSON.parse(text);
    return new Response(JSON.stringify({ suggestion }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'AI analysis failed' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
