import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SpecificationItem {
  label_ro: string;
  label_en: string;
  value_ro: string;
  value_en: string;
  type: 'text' | 'list' | 'highlight';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, productDescription, existingSpecs } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const existingLabels = existingSpecs?.map((s: SpecificationItem) => s.label_ro).join(', ') || 'none';

    const systemPrompt = `You are a product specification generator for a Romanian e-commerce site selling health and wellness products.
Generate product specifications in both Romanian and English.

Return a JSON object with this exact structure:
{
  "specifications": [
    {
      "label_ro": "Romanian label",
      "label_en": "English label",
      "value_ro": "Romanian value",
      "value_en": "English value",
      "type": "text" | "list" | "highlight"
    }
  ]
}

Types:
- "text": Single value (weight, origin, etc.)
- "list": Multiple values, one per line (ingredients)
- "highlight": Important certifications or badges

Always include these if applicable:
1. Ingrediente/Ingredients (type: list)
2. Greutate netă/Net weight (type: text)
3. Origine/Origin (type: text)
4. Mod de administrare/Usage instructions (type: text) - if it's a supplement or medicine
5. Certificări/Certifications (type: highlight) - if any

Keep values concise but informative. For ingredients, list each on a new line.`;

    const userPrompt = `Generate specifications for this product:

Product Name: ${productName}
Description: ${productDescription || 'Not provided'}
Existing specifications to improve/expand: ${existingLabels}

Generate appropriate specifications based on the product type. If it's a toothpaste, include dental-specific details. If it's a supplement, include dosage and usage. Be factual and professional.`;

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
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limită de utilizare depășită. Încearcă din nou în câteva secunde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credit AI insuficient. Contactează administratorul." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let parsedContent;
    try {
      // Clean potential markdown formatting
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedContent = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(
      JSON.stringify({ specifications: parsedContent.specifications || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
