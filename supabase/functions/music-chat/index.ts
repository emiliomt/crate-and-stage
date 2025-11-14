import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an AI music discovery assistant for Musicboard, a music platform similar to Letterboxd for movies. Your role is to:

- Help users discover new music based on their preferences
- Recommend albums, artists, and genres using collaborative filtering concepts
- Explain why recommendations match their taste
- Be conversational, friendly, and enthusiastic about music
- Reference specific albums, artists, and genres
- Provide match percentages (e.g., "92% match with your taste")
- Use emojis sparingly but appropriately
- Keep responses concise but informative

When recommending albums, format them as JSON objects within your response that can be parsed, like this:
RECOMMENDATION: {"albumTitle": "Album Name", "artist": "Artist Name", "cover": "🎸", "matchPercentage": 92, "genres": ["indie", "rock"], "reasoning": "Loved by fans of similar artists"}

Always be helpful and guide users to discover music they'll genuinely enjoy. Ask clarifying questions to better understand their taste.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your workspace." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse recommendations from the response
    const recommendations: any[] = [];
    const recommendationRegex = /RECOMMENDATION:\s*({[^}]+})/g;
    let match;
    
    while ((match = recommendationRegex.exec(content)) !== null) {
      try {
        recommendations.push(JSON.parse(match[1]));
      } catch (e) {
        console.error("Failed to parse recommendation:", match[1]);
      }
    }

    // Remove RECOMMENDATION markers from the content
    const cleanContent = content.replace(/RECOMMENDATION:\s*{[^}]+}/g, "").trim();

    return new Response(
      JSON.stringify({
        content: cleanContent,
        recommendations,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
