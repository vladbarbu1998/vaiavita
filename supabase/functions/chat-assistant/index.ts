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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Build conversation history for Gemini
    const contents = [
      {
        role: "user",
        parts: [{ text: SITE_CONTEXT }]
      },
      {
        role: "model",
        parts: [{ text: "Înțeleg. Sunt asistentul virtual VAIAVITA și voi răspunde doar la întrebări despre companie, produse, livrare și plăți. Cum te pot ajuta?" }]
      }
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
    }

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    console.log("Sending request to Gemini API...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded",
            reply: "Sistemul este momentan ocupat. Te rog să încerci din nou în câteva momente."
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini response received");

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
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
