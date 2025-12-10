import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ro' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ro: {
    // Navigation
    'nav.home': 'Acasă',
    'nav.about': 'Despre',
    'nav.products': 'Produse',
    'nav.contact': 'Contact',
    'nav.cart': 'Coș',
    
    // Hero
    'hero.title': 'VAIAVITA – Vitalitate, Energie și Echilibru',
    'hero.subtitle': 'Descoperă produsele exclusive VAIAVITA, selectate riguros din SUA și Hong Kong pentru rezultate excepționale. Formule premium, inaccesibile pe piața locală, create să îți aducă produse de cea mai înaltă calitate.',
    'hero.cta.products': 'Descoperă produsele',
    'hero.cta.about': 'Despre noi',
    
    // USP
    'usp.exclusivity.title': 'Exclusivitate',
    'usp.exclusivity.desc': 'Produse rare, inaccesibile altfel pe piața locală.',
    'usp.quality.title': 'Calitate',
    'usp.quality.desc': 'Selecție riguroasă la cele mai înalte standarde.',
    'usp.innovation.title': 'Inovație',
    'usp.innovation.desc': 'Soluții care simplifică viața și oferă rafinament.',
    
    // Featured Product
    'featured.title': 'DENT-TASTIC: Combate problemele gingivale',
    'featured.description': 'DENT-TASTIC Fresh Mint oferă o experiență de îngrijire orală superioară, asigurând o respirație proaspătă de lungă durată datorită combinației sale unice de ingrediente naturale. Cu o formulă avansată, protejează împotriva bacteriilor și formării plăcii dentare, menținând dinții curați și sănătoși pe tot parcursul zilei.',
    'featured.description2': 'Îngrijirea gingiilor este o prioritate, iar extractele naturale din compoziție ajută la prevenirea inflamațiilor și reduc sângerările, oferind o senzație de confort și prospețime. Fără fluor și substanțe chimice agresive, această pastă de dinți este o alegere ideală pentru cei care își doresc o alternativă naturală, eficientă și delicată.',
    'featured.cta': 'Cumpără acum',
    
    // Qivaro Section
    'qivaro.title': 'Qivaro: Transformăm vieți, supliment cu supliment',
    'qivaro.description': 'VAIAVITA vă aduce brandul premium Qivaro, recunoscut pentru formulele sale inovatoare și ingredientele de calitate superioară. Suplimentele Qivaro reprezintă vârful excelenței în nutriție targetată, fiind create în laboratoare avansate din SUA după standarde stricte de calitate. Fiecare produs Qivaro combină știința modernă cu ingrediente naturale potente pentru rezultate remarcabile.',
    'qivaro.description2': 'VAIAVITA a selectat brandul Qivaro pentru angajamentul său față de puritate, eficacitate și inovație continuă în domeniul suplimentelor nutritive de elită.',
    'qivaro.cta': 'Comandă acum pentru vitalitate fără compromisuri (în curând)',
    
    // Why Choose Us
    'why.title': 'De ce să ne alegi?',
    'why.description': 'Ne mândrim cu capacitatea de a identifica și aduce pe piața locală produse rare și greu accesibile. VAIAVITA este poarta dumneavoastră către branduri prestigioase și formule inovatoare care, până acum, erau inaccesibile consumatorilor români. Această exclusivitate vă oferă avantajul de a beneficia de cele mai avansate soluții disponibile la nivel global.',
    'why.description2': 'Filosofia VAIAVITA se bazează pe convingerea că luxul autentic nu înseamnă doar rafinament, ci și utilitate remarcabilă. Produsele noastre sunt selectate pentru a îmbina perfect eleganța cu funcționalitatea, transformând astfel luxul într-o experiență practică de zi cu zi.',
    'why.cta': 'Despre noi',
    
    // Reviews
    'reviews.title': 'Recenzii Google',
    'reviews.viewAll': 'Vezi toate recenziile pe Google',
    'reviews.leave': 'Lasă o recenzie pe Google',
    
    // Contact
    'contact.title': 'Contactează-ne',
    'contact.description': 'Dacă ai întrebări, sugestii sau vrei să colaborezi cu noi, nu ezita să ne contactezi! Suntem aici să îți oferim suport și să răspundem rapid la orice solicitare. Fie că ai nevoie de informații suplimentare sau vrei să descoperi mai multe despre serviciile noastre, te așteptăm să ne scrii.',
    'contact.cta': 'Mergi la pagina de contact',
    
    // Footer
    'footer.privacy': 'Politica de confidențialitate',
    'footer.terms': 'Termeni și condiții',
    'footer.cookies': 'Politica cookie-uri',
    
    // Breadcrumbs
    'breadcrumb.home': 'Acasă',
    'breadcrumb.about': 'Despre',
    'breadcrumb.products': 'Produse',
    'breadcrumb.contact': 'Contact',
    'breadcrumb.cart': 'Coș',
    'breadcrumb.checkout': 'Finalizare comandă',
    
    // Common
    'common.inStock': 'În stoc',
    'common.outOfStock': 'Stoc epuizat',
    'common.comingSoon': 'În curând',
    'common.addToCart': 'Adaugă în coș',
    'common.buyNow': 'Cumpără acum',
    'common.viewProduct': 'Vezi produsul',
    'common.price': 'Preț',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.products': 'Products',
    'nav.contact': 'Contact',
    'nav.cart': 'Cart',
    
    // Hero
    'hero.title': 'VAIAVITA – Vitality, Energy and Balance',
    'hero.subtitle': 'Discover exclusive VAIAVITA products, carefully selected from the USA and Hong Kong for exceptional results. Premium formulas, unavailable on the local market, created to bring you the highest quality products.',
    'hero.cta.products': 'Discover products',
    'hero.cta.about': 'About us',
    
    // USP
    'usp.exclusivity.title': 'Exclusivity',
    'usp.exclusivity.desc': 'Rare products, otherwise inaccessible on the local market.',
    'usp.quality.title': 'Quality',
    'usp.quality.desc': 'Rigorous selection at the highest standards.',
    'usp.innovation.title': 'Innovation',
    'usp.innovation.desc': 'Solutions that simplify life and offer refinement.',
    
    // Featured Product
    'featured.title': 'DENT-TASTIC: Combat gum problems',
    'featured.description': 'DENT-TASTIC Fresh Mint offers a superior oral care experience, ensuring long-lasting fresh breath thanks to its unique combination of natural ingredients. With an advanced formula, it protects against bacteria and plaque formation, keeping teeth clean and healthy throughout the day.',
    'featured.description2': 'Gum care is a priority, and the natural extracts in the composition help prevent inflammation and reduce bleeding, providing a feeling of comfort and freshness. Without fluoride and aggressive chemicals, this toothpaste is an ideal choice for those who want a natural, effective and gentle alternative.',
    'featured.cta': 'Buy now',
    
    // Qivaro Section
    'qivaro.title': 'Qivaro: Transforming lives, supplement by supplement',
    'qivaro.description': 'VAIAVITA brings you the premium Qivaro brand, recognized for its innovative formulas and superior quality ingredients. Qivaro supplements represent the pinnacle of excellence in targeted nutrition, created in advanced laboratories in the USA following strict quality standards. Each Qivaro product combines modern science with potent natural ingredients for remarkable results.',
    'qivaro.description2': 'VAIAVITA selected the Qivaro brand for its commitment to purity, efficacy and continuous innovation in the field of elite nutritional supplements.',
    'qivaro.cta': 'Order now for uncompromised vitality (coming soon)',
    
    // Why Choose Us
    'why.title': 'Why choose us?',
    'why.description': 'We pride ourselves on our ability to identify and bring to the local market rare and hard-to-access products. VAIAVITA is your gateway to prestigious brands and innovative formulas that, until now, were inaccessible to Romanian consumers. This exclusivity gives you the advantage of benefiting from the most advanced solutions available globally.',
    'why.description2': 'VAIAVITA\'s philosophy is based on the belief that authentic luxury means not only refinement, but also remarkable usefulness. Our products are selected to perfectly combine elegance with functionality, thus transforming luxury into a practical daily experience.',
    'why.cta': 'About us',
    
    // Reviews
    'reviews.title': 'Google Reviews',
    'reviews.viewAll': 'View all reviews on Google',
    'reviews.leave': 'Leave a review on Google',
    
    // Contact
    'contact.title': 'Contact us',
    'contact.description': 'If you have questions, suggestions or want to collaborate with us, don\'t hesitate to contact us! We are here to offer you support and respond quickly to any request. Whether you need additional information or want to discover more about our services, we are waiting for you to write to us.',
    'contact.cta': 'Go to contact page',
    
    // Footer
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms and Conditions',
    'footer.cookies': 'Cookie Policy',
    
    // Breadcrumbs
    'breadcrumb.home': 'Home',
    'breadcrumb.about': 'About',
    'breadcrumb.products': 'Products',
    'breadcrumb.contact': 'Contact',
    'breadcrumb.cart': 'Cart',
    'breadcrumb.checkout': 'Checkout',
    
    // Common
    'common.inStock': 'In stock',
    'common.outOfStock': 'Out of stock',
    'common.comingSoon': 'Coming soon',
    'common.addToCart': 'Add to cart',
    'common.buyNow': 'Buy now',
    'common.viewProduct': 'View product',
    'common.price': 'Price',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('vaiavita-language');
    return (saved as Language) || 'ro';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('vaiavita-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
