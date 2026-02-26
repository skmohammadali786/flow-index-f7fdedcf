import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { month, monthLogs, periodDays, loggedDays, avgSleep, avgWater, totalExercise, topSymptoms, topMoods, stats, currentPhase } = body;

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('API key not configured');

    const systemPrompt = `You are a women's health specialist. Analyze the monthly health data and provide a comprehensive, personalized monthly report. Return ONLY valid JSON with this structure:
{
  "wellnessScore": number (0-100),
  "summary": "2-3 sentence overview of the month",
  "highlights": ["positive observations"],
  "concerns": ["areas needing attention"],
  "recommendations": ["actionable advice for next month"],
  "sleepAnalysis": "brief sleep pattern analysis",
  "exerciseAnalysis": "brief exercise analysis",
  "cycleAnalysis": "brief cycle regularity analysis"
}`;

    const userPrompt = `Monthly data for ${month}:
- Days logged: ${loggedDays}, Period days: ${periodDays}
- Avg sleep: ${avgSleep}h, Avg water: ${avgWater} cups
- Total exercise: ${totalExercise} min
- Current phase: ${currentPhase || 'unknown'}
- Top symptoms: ${topSymptoms?.map((s: any) => `${s[0]}(${s[1]}d)`).join(', ') || 'none'}
- Top moods: ${topMoods?.map((m: any) => `${m[0]}(${m[1]}d)`).join(', ') || 'none'}
- Cycle stats: avg ${stats?.averageCycleLength || 28}d, ${stats?.totalCycles || 0} cycles tracked
- Log entries: ${monthLogs?.length || 0}`;

    const response = await fetch('https://lovable.dev/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`API error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');

    const parsed = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
