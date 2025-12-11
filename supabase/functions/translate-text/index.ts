import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranslationRequest {
  texts: Record<string, string>;
  sourceLanguage?: 'ro' | 'en';
  targetLanguage?: 'ro' | 'en';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, sourceLanguage = 'ro', targetLanguage = 'en' }: TranslationRequest = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Build the fields to translate
    const fieldsToTranslate = Object.entries(texts)
      .filter(([_, value]) => value && value.trim())
      .map(([key, value]) => `${key}: "${value}"`);

    if (fieldsToTranslate.length === 0) {
      return new Response(
        JSON.stringify({ translations: {} }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sourceLang = sourceLanguage === 'ro' ? 'Romanian' : 'English';
    const targetLang = targetLanguage === 'ro' ? 'Romanian' : 'English';

    const prompt = `Translate the following ${sourceLang} text fields to ${targetLang}. 
Return ONLY a valid JSON object with the translated fields. Do not include any explanation or markdown.
Keep the same keys but with translated values.

${sourceLang} text:
${fieldsToTranslate.join("\n")}

Return format example:
{${Object.keys(texts).map(k => `"${k}": "Translated text"`).join(", ")}}`;

    console.log("Translation request:", { sourceLanguage, targetLanguage, fieldsCount: fieldsToTranslate.length });

    // Use Gemini API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a professional translator. Translate ${sourceLang} to ${targetLang} accurately while maintaining the original tone and meaning. Return only valid JSON.\n\n${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Translation service unavailable");
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Clean up the response - remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.slice(7);
    }
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith("```")) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    console.log("Translation result:", cleanContent);

    const translations = JSON.parse(cleanContent);

    return new Response(
      JSON.stringify({ translations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Translation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
