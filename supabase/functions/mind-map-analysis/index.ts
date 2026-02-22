import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { healthData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert women's health advisor and wellness coach. Analyze the provided health data comprehensively and return a structured JSON response. Be empathetic, evidence-based, and actionable.

IMPORTANT: Return ONLY valid JSON with this exact structure:
{
  "overallScore": <number 0-100>,
  "scoreLabel": "<string: Excellent/Good/Fair/Needs Attention>",
  "summary": "<2-3 sentence personalized health summary>",
  "cycleHealth": {
    "score": <number 0-100>,
    "status": "<string>",
    "insight": "<string>"
  },
  "mentalHealth": {
    "score": <number 0-100>,
    "status": "<string>",
    "insight": "<string>"
  },
  "physicalHealth": {
    "score": <number 0-100>,
    "status": "<string>",
    "insight": "<string>"
  },
  "sleepHealth": {
    "score": <number 0-100>,
    "status": "<string>",
    "insight": "<string>"
  },
  "predictions": [
    {"title": "<string>", "description": "<string>", "confidence": "<high/medium/low>", "timeframe": "<string>"}
  ],
  "doList": [
    {"title": "<string>", "description": "<string>", "priority": "<high/medium/low>", "category": "<nutrition/exercise/wellness/sleep/mood>"}
  ],
  "dontList": [
    {"title": "<string>", "reason": "<string>", "severity": "<high/medium/low>"}
  ],
  "weeklyPlan": [
    {"day": "<Monday-Sunday>", "focus": "<string>", "tip": "<string>"}
  ],
  "phaseAdvice": {
    "currentPhase": "<string>",
    "daysRemaining": "<string>",
    "nutrition": ["<string>"],
    "exercise": ["<string>"],
    "selfCare": ["<string>"]
  }
}

Base analysis on: cycle regularity, symptom patterns, mood trends, sleep quality, exercise habits, hydration, and overall wellness. Be specific and personalized.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this health data and provide comprehensive insights:\n\n${JSON.stringify(healthData)}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";
    
    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    let analysis;
    try {
      analysis = JSON.parse(jsonStr);
    } catch {
      // Try to find any JSON object in the response
      const objMatch = content.match(/\{[\s\S]*\}/);
      if (objMatch) {
        analysis = JSON.parse(objMatch[0]);
      } else {
        throw new Error("Failed to parse AI response as JSON");
      }
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mind-map error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
