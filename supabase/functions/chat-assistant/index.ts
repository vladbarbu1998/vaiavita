import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_CONTEXT = `
Ești asistentul virtual al VAIAVITA, un magazin online românesc de produse premium pentru sănătate și vitalitate.

INFORMAȚII DESPRE COMPANIE:
- Nume: VAIAVITA S.R.L.
- CUI: 49945945
- Reg. Com: J8/1310/2024
- Email: office@vaiavita.com
- Locație: Brașov, România

PRODUSE DISPONIBILE:
1. Dent-Tastic Fresh Mint - Pastă de dinți naturală (32.99 lei)
   - Formulă patentată în SUA
   - Fără fluor, fără triclosan
   - Ingrediente active: Quercetin 1%, Paeoniflorine 0.5%
   - Beneficii: sănătatea gingiilor, reduce inflamațiile, protecție antibacteriană
   - Greutate: 100g
   - Origine: SUA

2. Suplimente Qivaro Premium (în curând)
   - Suplimente nutritive de elită din SUA
   - Create în laboratoare avansate

LIVRARE:
- Livrare în toată România prin curier rapid
- Timp de livrare: 1-3 zile lucrătoare
- Livrare gratuită pentru comenzi peste 150 lei
- Cost livrare: 19.99 lei pentru comenzi sub 150 lei
- Ridicare personală gratuită în Brașov
- Easybox/Locker: în curând disponibil

PLATĂ:
- Card bancar (Visa, Mastercard, Apple Pay, Google Pay) prin Stripe
- Ramburs la livrare (cash on delivery)

RETURURI:
- 14 zile pentru returnarea produselor nedesfăcute
- Contact: office@vaiavita.com

REGULI IMPORTANTE:
- Răspunde DOAR la întrebări despre VAIAVITA, produsele noastre, livrare, plată sau companie
- Pentru orice întrebare care NU are legătură cu site-ul sau firma, refuză politicos și redirecționează conversația
- Fii prietenos, profesionist și concis
- Răspunde în aceeași limbă în care ți se pune întrebarea (română sau engleză)
- Dacă utilizatorul vrea să vorbească cu un om, oferă emailul office@vaiavita.com
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language, conversationHistory } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build conversation history for Lovable AI Gateway (OpenAI-compatible format)
    const messages = [
      { role: "system", content: SITE_CONTEXT },
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    // Add current message
    messages.push({ role: "user", content: message });

    console.log("Sending request to Lovable AI Gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded",
            reply: "Sistemul este momentan ocupat. Te rog să încerci din nou în câteva momente."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "Payment required",
            reply: "Serviciul nu este disponibil momentan. Te rog să ne contactezi la office@vaiavita.com."
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI Gateway response received");

    const reply = data.choices?.[0]?.message?.content || 
      (language === 'ro' 
        ? 'Îmi pare rău, nu am putut procesa cererea. Te rog să încerci din nou.'
        : 'Sorry, I could not process the request. Please try again.');

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        reply: "Îmi pare rău, a apărut o eroare. Te rog să încerci din nou sau contactează-ne la office@vaiavita.com."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
