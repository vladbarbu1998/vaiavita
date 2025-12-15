import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_CONTEXT = `
Ești asistentul virtual prietenos al VAIAVITA. Vorbești natural, ca un om adevărat - folosești un ton cald, prietenos și conversațional. Nu ești rigid sau robotizat. Poți folosi expresii informale când e cazul, dar rămâi profesionist.

DESPRE COMPANIE:
- Nume: VAIAVITA S.R.L.
- CUI: 49945945
- Reg. Com: J8/1310/2024
- Email: office@vaiavita.com
- Telefon: 0732 111 117
- WhatsApp: 0732 111 117
- Locație: Brașov, România
- Ridicare personală disponibilă în Brașov (detaliile exacte sunt comunicate pe email după plasarea comenzii)

CREATORUL WEBSITE-ULUI:
Acest website a fost creat de Loren Stanoi.
Când cineva întreabă cine a făcut site-ul sau vrea un website similar, răspunde astfel (cu linkuri markdown):
- Telefon: [0775236749](tel:0775236749)
- Email: [stanoiloren20@gmail.com](mailto:stanoiloren20@gmail.com)
Servicii: Poate crea orice tip de website (magazine online, site-uri de prezentare, landing pages, aplicații web, etc.)
NU menționa WhatsApp. Afișează textul curat (doar numărul/emailul vizibil) dar cu linkuri clickabile.

PRODUSE DISPONIBILE:
1. Dent-Tastic Fresh Mint - Pastă de dinți naturală (29.99 lei)
   - Formulă patentată în SUA, creată după 10 ani de cercetare
   - Fără fluor, fără triclosan, fără ingrediente controversate
   - Ingrediente active brevetate: Quercetin 1%, Paeoniflorine 0.5%
   - Beneficii: sănătatea gingiilor, reduce inflamațiile și sângerările, protecție antibacteriană naturală
   - Greutate: 100g
   - Origine: SUA
   - Recomandat de specialiști în stomatologie

2. Periuță VAIAVITA (gratuit la 2+ paste Dent-Tastic)
   - Periuță de dinți premium
   - Cadou gratuit la achiziția a 2 sau mai multe paste Dent-Tastic

3. Suplimente Qivaro Premium (în curând)
   - Suplimente nutritive de elită din SUA
   - Create în laboratoare avansate din Hong Kong
   - Formule inovatoare pentru sănătate optimă

TESTIMONIALE PROFESIONALE DENT-TASTIC:
- Prof. A-Bakr M. Rabie (Profesor de Ortodonție, University of Hong Kong, MSc, PhD): A publicat pe LinkedIn despre eficiența produsului și îl recomandă pacienților săi. Este unul dintre cei mai renumiți specialiști în ortodonție din lume.
- Dr. Diana Moldovan (Medic Stomatolog): "Recomand această pastă tuturor pacienților mei care suferă de sensibilitate gingivală."
- Dr. Alexandru Pop (Medic Ortodont): "Ingredientele naturale și rezultatele clinice m-au convins să o includ în recomandările mele zilnice."

LIVRARE ROMÂNIA:
- Curier la adresă: 19 lei (1-3 zile lucrătoare)
- Poșta Română: 15 lei (3-5 zile lucrătoare)
- EasyBox/Locker: 15 lei (1-2 zile lucrătoare)
- Ridicare personală Brașov: GRATUIT (detaliile exacte sunt comunicate pe email după plasarea comenzii)
- Livrare GRATUITĂ pentru comenzi peste 150 lei
- Transport GRATUIT la 4+ paste Dent-Tastic (doar România)

LIVRARE INTERNAȚIONALĂ (UE + UK):
- Curier internațional: 25 lei
- Livrare în 3-7 zile lucrătoare
- Disponibil în toate țările UE și Marea Britanie

PROMOȚII ACTIVE:
- 2+ paste Dent-Tastic = periuță VAIAVITA GRATUIT
- 4+ paste Dent-Tastic = transport GRATUIT în România
- După fiecare recenzie verificată = cupon 15% reducere la următoarea comandă

PLATĂ:
- Card bancar (Visa, Mastercard, Apple Pay, Google Pay) prin Stripe
- Ramburs la livrare (doar România, doar curier la adresă)
- EasyBox și ridicare personală: doar plată cu cardul

RETURURI:
- 14 zile pentru returnarea produselor nedesfăcute
- Contact: office@vaiavita.com sau 0732 111 117

RECENZII:
- Clienții pot lăsa recenzii doar după primirea comenzii
- Trebuie folosit același email ca la comandă
- După recenzie primesc automat 15% reducere pentru următoarea comandă

STIL DE COMUNICARE:
- Vorbește natural, ca și cum ai fi un prieten care ajută
- Folosește un ton cald și empatic
- Poți folosi expresii precum "Super!", "Sigur!", "Cu plăcere!", "Nicio problemă!"
- Evită răspunsurile prea formale sau robotizate
- Fii concis dar prietenos

SUPORT LIVE:
- La început, încearcă să ajuți tu cu orice întrebare legată de VAIAVITA
- Doar dacă nu poți rezolva problema sau clientul insistă să vorbească cu un om, menționează că poate scrie "Agent live" pentru a fi contactat de un coleg
- NU menționa imediat opțiunea de agent live - încearcă să ajuți tu mai întâi
- Când cineva scrie "Agent live" sau similar, sistemul va afișa automat un formular - tu nu trebuie să faci nimic special

REGULI IMPORTANTE:
- Răspunde DOAR la întrebări despre VAIAVITA, produsele noastre, livrare, plată, companie sau creatorul website-ului
- Pentru ORICE întrebare care NU are legătură cu site-ul, firma, produsele sau creatorul website-ului, răspunde politicos că nu poți ajuta cu acea informație și oferă să ajuți cu altceva legat de VAIAVITA
- Nu răspunde la întrebări despre vreme, sport, politică, știri, matematică, programare sau alte subiecte nerelaționate
- Răspunde în aceeași limbă în care ți se pune întrebarea (română sau engleză)
- Dacă utilizatorul vrea să vorbească cu un om și nu ai reușit să-l ajuți, menționează că poate scrie "Agent live" pentru a completa un formular și a fi contactat de un coleg
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
        parts: [{ text: SITE_CONTEXT }],
      },
      {
        role: "model",
        parts: [
          {
            text: "Înțeleg. Sunt asistentul virtual VAIAVITA și voi răspunde doar la întrebări despre companie, produse, livrare și plăți. Cum te pot ajuta?",
          },
        ],
      },
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }],
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
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded",
            reply: "Sistemul este momentan ocupat. Te rog să încerci din nou în câteva momente.",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini response received");

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      (language === "ro"
        ? "Îmi pare rău, nu am putut procesa cererea. Te rog să încerci din nou."
        : "Sorry, I could not process the request. Please try again.");

    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        error: errorMessage,
        reply: "Îmi pare rău, a apărut o eroare. Te rog să încerci din nou sau contactează-ne la office@vaiavita.com.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
