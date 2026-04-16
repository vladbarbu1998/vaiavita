import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ──────────────────────────────────────────────
// KNOWLEDGE BASE
// ──────────────────────────────────────────────

interface Product {
  name: string;
  description: { ro: string; en: string };
  price: string;
  details: { ro: string; en: string };
}

interface KnowledgeBase {
  products: Product[];
  company: { ro: string; en: string };
  delivery: { ro: string; en: string };
  payment: { ro: string; en: string };
  returns: { ro: string; en: string };
  ingredients: { ro: string; en: string };
  promotions: { ro: string; en: string };
  reviews: { ro: string; en: string };
  testimonials: { ro: string; en: string };
  dentalmed: { ro: string; en: string };
  websiteCreator: { ro: string; en: string };
}

const KB: KnowledgeBase = {
  products: [
    {
      name: "Dent-Tastic Fresh Mint",
      description: {
        ro: "Pastă de dinți naturală, formulă brevetată în SUA, creată după 10 ani de cercetare.",
        en: "Natural toothpaste, patented formula in the USA, created after 10 years of research.",
      },
      price: "32.99 RON (~6.50 EUR)",
      details: {
        ro: "Fără fluor, fără triclosan, fără substanțe chimice agresive. Ingrediente active brevetate: Quercetin 1%, Paeoniflorine 0.5%. Beneficii: sănătatea gingiilor, reduce inflamația și sângerarea, protecție antibacteriană naturală. Greutate: 100g. Origine: SUA. Aromă Fresh Mint. Recomandată de specialiști stomatologi.",
        en: "No fluoride, no triclosan, no harsh chemicals. Patented active ingredients: Quercetin 1%, Paeoniflorine 0.5%. Benefits: gum health, reduces inflammation and bleeding, natural antibacterial protection. Weight: 100g. Origin: USA. Fresh Mint flavor. Recommended by dental specialists.",
      },
    },
    {
      name: "Periuța de dinți VAIAVITA",
      description: {
        ro: "Periuță de dinți premium, disponibilă individual sau CADOU la achiziția a 2+ paste Dent-Tastic.",
        en: "Premium toothbrush, available individually or FREE when purchasing 2+ Dent-Tastic toothpastes.",
      },
      price: "7.99 RON (~1.60 EUR)",
      details: {
        ro: "Periuță premium disponibilă în magazin. Primești GRATUIT o periuță la achiziția a 2 sau mai multe paste Dent-Tastic.",
        en: "Premium toothbrush available in the shop. You get a FREE toothbrush when purchasing 2 or more Dent-Tastic toothpastes.",
      },
    },
    {
      name: "Qivaro Premium Supplements",
      description: {
        ro: "Suplimente nutriționale premium fabricate în SUA. Disponibile în curând.",
        en: "Premium nutritional supplements manufactured in USA. Coming soon.",
      },
      price: "TBA",
      details: {
        ro: "Suplimente nutriționale de elită fabricate în SUA, în laboratoare avansate. Formule inovatoare pentru sănătate optimă. Disponibile în curând!",
        en: "Elite nutritional supplements manufactured in USA, in advanced laboratories. Innovative formulas for optimal health. Coming soon!",
      },
    },
  ],

  company: {
    ro: "VAIAVITA S.R.L.\n- CUI: 49945945\n- Reg. Com: J8/1310/2024\n- Email: office@vaiavita.com\n- Telefon / WhatsApp: 0732 111 117\n- Locație: Brașov, România\n- Ridicare personală disponibilă din Brașov (detalii exacte comunicate prin email după plasarea comenzii)\n- Website: vaiavita.ro",
    en: "VAIAVITA S.R.L.\n- CUI: 49945945\n- Reg. Com: J8/1310/2024\n- Email: office@vaiavita.com\n- Phone / WhatsApp: 0732 111 117\n- Location: Brașov, Romania\n- Personal pickup available in Brașov (exact details communicated via email after placing the order)\n- Website: vaiavita.ro",
  },

  delivery: {
    ro: "**Livrare România:**\n- Curier la adresă: 19 RON (1-3 zile lucrătoare)\n- Poșta Română: 15 RON (3-5 zile lucrătoare)\n- EasyBox/Locker: 15 RON (1-2 zile lucrătoare)\n- Ridicare personală Brașov: GRATUITĂ\n- Ridicare de la DentalMed Brașov: GRATUITĂ (doar plată cu cardul, doar pentru județul Brașov) — Strada Lungă 14, Brașov 500058 — [DentalMed pe Google Maps](https://maps.app.goo.gl/TyE5CozicKWBfeK9A?g_st=ic)\n- Livrare GRATUITĂ pentru comenzi peste 150 RON\n- Transport GRATUIT cu 4+ paste Dent-Tastic (doar România)\n\n**Livrare internațională (UE + UK):**\n- Curier internațional: 25 RON\n- Livrare în 3-7 zile lucrătoare\n- Disponibilă în toate țările UE și Regatul Unit",
    en: "**Delivery Romania:**\n- Courier to address: 19 RON (1-3 business days)\n- Romanian Post: 15 RON (3-5 business days)\n- EasyBox/Locker: 15 RON (1-2 business days)\n- Personal pickup Brașov: FREE\n- Pickup from DentalMed Brașov: FREE (card payment only, Brașov county only) — Strada Lungă 14, Brașov 500058 — [DentalMed on Google Maps](https://maps.app.goo.gl/TyE5CozicKWBfeK9A?g_st=ic)\n- FREE delivery for orders over 150 RON\n- FREE shipping with 4+ Dent-Tastic toothpastes (Romania only)\n\n**International delivery (EU + UK):**\n- International courier: 25 RON\n- Delivery in 3-7 business days\n- Available in all EU countries and United Kingdom",
  },

  payment: {
    ro: "Metode de plată acceptate:\n- Card online (Visa, Mastercard, Apple Pay, Google Pay) prin Stripe\n- Ramburs la livrare (doar România, doar curier la adresă)\n- EasyBox și ridicare personală: doar plată cu cardul",
    en: "Accepted payment methods:\n- Online card (Visa, Mastercard, Apple Pay, Google Pay) via Stripe\n- Cash on delivery (Romania only, courier to address only)\n- EasyBox and personal pickup: card payment only",
  },

  returns: {
    ro: "Politica de retur:\n- 14 zile pentru returnarea produselor nedeschise\n- Produsul trebuie să fie neutilizat, în ambalajul original\n- Contactați-ne la office@vaiavita.com sau 0732 111 117 pentru a iniția un retur\n- Rambursarea se face în maxim 14 zile lucrătoare",
    en: "Return policy:\n- 14 days to return unopened products\n- Product must be unused, in original packaging\n- Contact us at office@vaiavita.com or 0732 111 117 to initiate a return\n- Refund processed within 14 business days",
  },

  ingredients: {
    ro: "Ingrediente Dent-Tastic Fresh Mint:\n- Formulă naturală brevetată în SUA\n- Ingrediente active brevetate: Quercetin 1%, Paeoniflorine 0.5%\n- Fără fluor\n- Fără triclosan\n- Fără substanțe chimice agresive sau controversate\n- Aromă Fresh Mint\n- Beneficii: sănătatea gingiilor, reduce inflamația și sângerarea, protecție antibacteriană naturală",
    en: "Dent-Tastic Fresh Mint ingredients:\n- Natural formula patented in the USA\n- Patented active ingredients: Quercetin 1%, Paeoniflorine 0.5%\n- No fluoride\n- No triclosan\n- No harsh or controversial chemicals\n- Fresh Mint flavor\n- Benefits: gum health, reduces inflammation and bleeding, natural antibacterial protection",
  },

  promotions: {
    ro: "Promoții active:\n- 2+ paste Dent-Tastic = periuță VAIAVITA GRATUITĂ\n- 4+ paste Dent-Tastic = transport GRATUIT în România\n- După fiecare recenzie verificată = cupon de reducere 15% pentru următoarea comandă",
    en: "Active promotions:\n- 2+ Dent-Tastic toothpastes = FREE VAIAVITA toothbrush\n- 4+ Dent-Tastic toothpastes = FREE shipping in Romania\n- After each verified review = 15% discount coupon for next order",
  },

  reviews: {
    ro: "Recenzii:\n- Poți lăsa o recenzie doar după ce ai primit comanda\n- Trebuie să folosești același email ca la comandă\n- După recenzie primești automat un cupon de reducere de 15% pentru următoarea comandă",
    en: "Reviews:\n- You can leave a review only after receiving your order\n- You must use the same email as the order\n- After your review you automatically receive a 15% discount coupon for your next order",
  },

  testimonials: {
    ro: "Testimoniale profesionale pentru Dent-Tastic:\n- Prof. Bakr Rabie (Profesor de Ortodonție, Universitatea din Hong Kong, MSc, PhD): A publicat pe LinkedIn despre eficacitatea produsului și îl recomandă pacienților săi.\n- Dr. Diana Moldovan (Stomatolog): \"Recomand această pastă de dinți tuturor pacienților mei care suferă de sensibilitate gingivală.\"\n- Dr. Alexandru Pop (Ortodont): \"Ingredientele naturale și rezultatele clinice m-au convins să o includ în recomandările mele zilnice.\"",
    en: "Professional testimonials for Dent-Tastic:\n- Prof. Bakr Rabie (Professor of Orthodontics, University of Hong Kong, MSc, PhD): Published on LinkedIn about the product's efficacy and recommends it to his patients.\n- Dr. Diana Moldovan (Dentist): \"I recommend this toothpaste to all my patients suffering from gum sensitivity.\"\n- Dr. Alexandru Pop (Orthodontist): \"The natural ingredients and clinical results convinced me to include it in my daily recommendations.\"",
  },

  dentalmed: {
    ro: "DentalMed Com Brașov este unul dintre partenerii noștri de încredere în stomatologia modernă. Clinica oferă servicii stomatologice complete, cu o echipă cu peste 25 de ani de experiență.\n- Locație: Strada Lungă nr. 14, Brașov\n- [DentalMed pe Google Maps](https://maps.app.goo.gl/TyE5CozicKWBfeK9A?g_st=ic)\n- Poți ridica comanda VAIAVITA de la clinica DentalMed (disponibil doar pentru județul Brașov, doar plată cu cardul)\n- Pasta noastră Dent-Tastic este disponibilă și la clinica DentalMed",
    en: "DentalMed Com Brașov is one of our trusted partners in modern dentistry. The clinic offers complete dental services, with a team with over 25 years of experience.\n- Location: Strada Lungă nr. 14, Brașov\n- [DentalMed on Google Maps](https://maps.app.goo.gl/TyE5CozicKWBfeK9A?g_st=ic)\n- You can pick up your VAIAVITA order from DentalMed clinic (Brașov county only, card payment only)\n- Our Dent-Tastic toothpaste is also available at DentalMed clinic",
  },

  websiteCreator: {
    ro: "Acest website a fost creat de Loren Stanoi.\n- Telefon: [0775236749](tel:0775236749)\n- Email: [stanoiloren20@gmail.com](mailto:stanoiloren20@gmail.com)\n- Servicii: poate crea orice tip de website (magazine online, site-uri de prezentare, landing pages, web apps, etc.)",
    en: "This website was created by Loren Stanoi.\n- Phone: [0775236749](tel:0775236749)\n- Email: [stanoiloren20@gmail.com](mailto:stanoiloren20@gmail.com)\n- Services: can create any type of website (online stores, presentation sites, landing pages, web apps, etc.)",
  },
};

// ──────────────────────────────────────────────
// LANGUAGE DETECTION
// ──────────────────────────────────────────────

const RO_MARKERS = [
  "bună", "buna", "salut", "cât", "cat", "costă", "costa",
  "produse", "livrare", "livrarea", "plată", "plata", "retur",
  "comandă", "comanda", "ingredients", "pastă", "pasta",
  "periuță", "periuta", "dinți", "dinti", "mulțumesc", "multumesc",
  "întrebare", "intrebare", "vreau", "doresc", "cum", "unde",
  "când", "cand", "ce", "sunt", "este", "aveți", "aveti",
  "puteți", "puteti", "informații", "informatii", "produs",
  "preț", "pret", "reducere", "ofertă", "oferta", "promoție", "promotie",
  "curățare", "curatare", "gingii", "gură", "gura",
  "ajutor", "nevoie", "spune", "spuneți", "spuneti",
  "ziua", "seara", "dimineața", "dimineata", "noapte",
  "da", "nu", "bine", "mersi", "ok", "vă", "va", "îmi", "imi",
  "mă", "ma", "te", "contacta", "telefon", "email",
  "ambalaj", "original", "rambursare", "curier",
  "gratuit", "gratuită", "gratuita", "suplimente",
  "recenzie", "recenzii", "cupon", "discount",
  "hei", "helo", "alo",
];

function detectLanguage(message: string, languageHint?: string): "ro" | "en" {
  const lower = message.toLowerCase();
  const words = lower.split(/\s+/);

  let roScore = 0;
  for (const word of words) {
    const clean = word.replace(/[^a-zăâîșțéèêë]/gi, "");
    if (RO_MARKERS.includes(clean)) {
      roScore++;
    }
  }

  // If at least 1 Romanian marker found, treat as Romanian
  if (roScore > 0) return "ro";

  // Fall back to language hint from frontend
  if (languageHint === "ro") return "ro";

  return "en";
}

// ──────────────────────────────────────────────
// INTENT DETECTION
// ──────────────────────────────────────────────

type Intent =
  | "greeting"
  | "product_info"
  | "price"
  | "delivery"
  | "payment"
  | "return_policy"
  | "ingredients"
  | "contact"
  | "promotions"
  | "reviews"
  | "testimonials"
  | "dentalmed"
  | "website_creator"
  | "live_agent"
  | "thanks"
  | "goodbye"
  | "supplements"
  | "toothbrush"
  | "ordering"
  | "other";

interface IntentPattern {
  intent: Intent;
  keywords: string[];
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: "live_agent",
    keywords: ["agent live", "agent uman", "persoana reala", "persoană reală", "vorbesc cu cineva", "human agent", "real person", "talk to someone", "live agent", "live support"],
  },
  {
    intent: "greeting",
    keywords: ["bună", "buna", "salut", "hei", "hello", "hi", "hey", "good morning", "good evening", "buna ziua", "bună ziua", "buna seara", "bună seara", "neata", "alo", "helo"],
  },
  {
    intent: "thanks",
    keywords: ["mulțumesc", "multumesc", "mersi", "merci", "thank", "thanks", "thank you", "apreciez"],
  },
  {
    intent: "goodbye",
    keywords: ["la revedere", "pa", "bye", "goodbye", "pe curând", "pe curand", "noapte bună", "noapte buna"],
  },
  {
    intent: "price",
    keywords: ["preț", "pret", "cât costă", "cat costa", "price", "cost", "how much", "lei", "ron", "eur", "euro", "bani", "money", "cât e", "cat e", "cât face", "cat face"],
  },
  {
    intent: "ingredients",
    keywords: ["ingrediente", "ingredients", "compoziție", "compozitie", "composition", "conține", "contine", "contains", "fluor", "fluoride", "triclosan", "quercetin", "paeoniflorine", "chimice", "chemical", "natural", "naturale"],
  },
  {
    intent: "delivery",
    keywords: ["livrare", "livrarea", "delivery", "shipping", "transport", "curier", "courier", "easybox", "locker", "fan courier", "fancourier", "dpd", "gls", "cargus", "sameday", "ridicare", "pickup", "pick up", "expediez", "trimit", "trimite", "când ajunge", "cand ajunge", "zile lucrătoare", "zile lucratoare", "internațional", "international"],
  },
  {
    intent: "payment",
    keywords: ["plată", "plata", "payment", "plătesc", "platesc", "pay", "card", "stripe", "ramburs", "cash on delivery", "apple pay", "google pay", "visa", "mastercard"],
  },
  {
    intent: "return_policy",
    keywords: ["retur", "return", "returnez", "schimb", "exchange", "rambursare", "refund", "înapoi", "inapoi", "back", "politica retur", "return policy"],
  },
  {
    intent: "promotions",
    keywords: ["promoție", "promotie", "promoții", "promotii", "ofertă", "oferta", "discount", "reducere", "cupon", "coupon", "promotion", "deal", "offer", "cadou", "gift", "gratuit", "free"],
  },
  {
    intent: "reviews",
    keywords: ["recenzie", "recenzii", "review", "reviews", "părere", "parere", "păreri", "pareri", "feedback", "opinie", "opinii"],
  },
  {
    intent: "testimonials",
    keywords: ["testimonial", "testimoniale", "doctor", "dentist", "ortodont", "specialist", "recomand", "recommend", "bakr rabie", "diana moldovan", "alexandru pop"],
  },
  {
    intent: "dentalmed",
    keywords: ["dentalmed", "dental med", "clinica", "clinic", "strada lunga", "strada lungă"],
  },
  {
    intent: "website_creator",
    keywords: ["cine a făcut", "cine a facut", "who made", "who created", "who built", "website similar", "site similar", "creat site", "făcut site", "facut site", "creatorul", "creator", "loren", "stanoi"],
  },
  {
    intent: "supplements",
    keywords: ["supliment", "suplimente", "supplement", "supplements", "qivaro", "nutrițional", "nutritional", "vitamine", "vitamins"],
  },
  {
    intent: "toothbrush",
    keywords: ["periuță", "periuta", "periuța", "toothbrush", "brush"],
  },
  {
    intent: "ordering",
    keywords: ["cum comand", "cum pot comanda", "cum comandă", "cum plasez", "cum fac o comandă", "cum fac o comanda", "how to order", "how do i order", "how can i order", "place order", "vreau să comand", "vreau sa comand", "doresc să comand", "doresc sa comand", "comanda online", "comandă online", "cumpăr", "cumpar", "cum cumpăr", "cum cumpar", "how to buy", "quero comprar"],
  },
  {
    intent: "product_info",
    keywords: ["produs", "produse", "product", "products", "dent-tastic", "denttastic", "dent tastic", "pastă", "pasta", "toothpaste", "ce vindeți", "ce vindeti", "what do you sell", "ce aveți", "ce aveti", "catalog", "gamă", "gama", "range"],
  },
  {
    intent: "contact",
    keywords: ["contact", "email", "telefon", "phone", "whatsapp", "adresă", "adresa", "address", "locație", "locatie", "location", "unde sunteți", "unde sunteti", "where are you", "brașov", "brasov"],
  },
];

function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();

  for (const pattern of INTENT_PATTERNS) {
    for (const keyword of pattern.keywords) {
      if (lower.includes(keyword)) {
        return pattern.intent;
      }
    }
  }

  return "other";
}

// ──────────────────────────────────────────────
// RESPONSE GENERATION
// ──────────────────────────────────────────────

function generateResponse(intent: Intent, lang: "ro" | "en"): string {
  switch (intent) {
    case "greeting":
      return lang === "ro"
        ? "Bună! 😊 Sunt asistentul virtual VAIAVITA. Cu ce te pot ajuta? Pot să îți dau informații despre produsele noastre, livrare, prețuri sau orice altceva legat de VAIAVITA."
        : "Hi there! 😊 I'm VAIAVITA's virtual assistant. How can I help you? I can give you information about our products, delivery, prices, or anything else related to VAIAVITA.";

    case "thanks":
      return lang === "ro"
        ? "Cu plăcere! Dacă mai ai întrebări, nu ezita să mă întrebi. 😊"
        : "You're welcome! If you have any other questions, don't hesitate to ask. 😊";

    case "goodbye":
      return lang === "ro"
        ? "La revedere! O zi frumoasă și nu ezita să ne contactezi dacă mai ai nevoie de ajutor! 😊"
        : "Goodbye! Have a great day and don't hesitate to contact us if you need any help! 😊";

    case "product_info": {
      const products = KB.products
        .map((p) => `**${p.name}** — ${p.price}\n${p.description[lang]}`)
        .join("\n\n");
      const intro = lang === "ro"
        ? "Iată produsele noastre disponibile:"
        : "Here are our available products:";
      return `${intro}\n\n${products}`;
    }

    case "price": {
      const prices = KB.products
        .map((p) => `- **${p.name}**: ${p.price}`)
        .join("\n");
      const intro = lang === "ro" ? "Prețurile noastre:" : "Our prices:";
      const promo = lang === "ro"
        ? "\n\n💡 Nu uita de promoțiile noastre! 2+ paste Dent-Tastic = periuță GRATUITĂ, iar 4+ paste = transport GRATUIT în România."
        : "\n\n💡 Don't forget our promotions! 2+ Dent-Tastic toothpastes = FREE toothbrush, and 4+ toothpastes = FREE shipping in Romania.";
      return `${intro}\n${prices}${promo}`;
    }

    case "delivery":
      return KB.delivery[lang];

    case "payment":
      return KB.payment[lang];

    case "return_policy":
      return KB.returns[lang];

    case "ingredients":
      return KB.ingredients[lang];

    case "contact":
      return KB.company[lang];

    case "promotions":
      return KB.promotions[lang];

    case "reviews":
      return KB.reviews[lang];

    case "testimonials":
      return KB.testimonials[lang];

    case "dentalmed":
      return KB.dentalmed[lang];

    case "website_creator":
      return KB.websiteCreator[lang];

    case "supplements": {
      const qivaro = KB.products.find((p) => p.name.includes("Qivaro"));
      return qivaro ? qivaro.details[lang] : (lang === "ro"
        ? "Suplimentele Qivaro vor fi disponibile în curând! Revino pentru noutăți."
        : "Qivaro supplements will be available soon! Check back for updates.");
    }

    case "toothbrush": {
      const brush = KB.products.find((p) => p.name.includes("Periuț") || p.name.includes("VAIAVITA"));
      if (brush) {
        return `**${brush.name}** — ${brush.price}\n${brush.details[lang]}`;
      }
      return lang === "ro"
        ? "Periuța VAIAVITA costă 7.99 RON și o primești GRATUIT la achiziția a 2+ paste Dent-Tastic!"
        : "The VAIAVITA toothbrush costs 7.99 RON and you get it FREE when purchasing 2+ Dent-Tastic toothpastes!";
    }

    case "ordering":
      return lang === "ro"
        ? "Poți comanda direct de pe site-ul nostru vaiavita.ro:\n\n1. Mergi la pagina produsului dorit\n2. Selectează cantitatea și apasă \"Adaugă în coș\"\n3. Mergi la coș și apasă \"Finalizează comanda\"\n4. Completează datele de livrare\n5. Alege metoda de plată (card online sau ramburs)\n6. Confirmă comanda\n\nLivrare standard: 19.99 RON | Gratuită la 4+ paste Dent-Tastic!\nRidicare personală din Brașov: GRATUITĂ"
        : "You can order directly from our website vaiavita.ro:\n\n1. Go to the desired product page\n2. Select the quantity and click \"Add to cart\"\n3. Go to cart and click \"Checkout\"\n4. Fill in your delivery details\n5. Choose payment method (card or cash on delivery)\n6. Confirm your order\n\nStandard shipping: 19.99 RON | Free with 4+ Dent-Tastic toothpastes!\nPersonal pickup in Brașov: FREE";

    case "live_agent":
      return lang === "ro"
        ? "Înțeleg că dorești să vorbești cu un coleg. Scrie **\"Agent live\"** și vei putea completa un formular pentru a fi contactat de echipa noastră."
        : "I understand you'd like to speak with a team member. Type **\"Agent live\"** and you'll be able to fill out a form to be contacted by our team.";

    case "other":
    default:
      return lang === "ro"
        ? "Îmi pare rău, nu am o informație specifică despre asta. Pot să te ajut cu informații despre produsele VAIAVITA, prețuri, livrare, plată, retur sau date de contact.\n\nPentru mai multe informații, ne poți contacta la office@vaiavita.com sau 0732 111 117."
        : "I'm sorry, I don't have specific information about that. I can help you with information about VAIAVITA products, prices, delivery, payment, returns, or contact details.\n\nFor more information, you can contact us at office@vaiavita.com or 0732 111 117.";
  }
}

// ──────────────────────────────────────────────
// EDGE FUNCTION HANDLER
// ──────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language, conversationHistory } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({
          reply: language === "ro"
            ? "Te rog să scrii un mesaj."
            : "Please type a message.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const trimmed = message.trim();
    const lang = detectLanguage(trimmed, language);
    const intent = detectIntent(trimmed);

    console.log(`[chat-assistant] lang=${lang}, intent=${intent}, message="${trimmed.substring(0, 80)}"`);

    const reply = generateResponse(intent, lang);

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
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
