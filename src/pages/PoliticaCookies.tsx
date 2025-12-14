import { MainLayout } from "@/components/layout";
import { useLanguage } from "@/context/LanguageContext";
import { Helmet } from "react-helmet-async";

const PoliticaCookies = () => {
  const { language } = useLanguage();
  const isRo = language === 'ro';

  const breadcrumbItems = [
    { label: isRo ? "Politica de Cookie-uri" : "Cookie Policy", labelEn: "Cookie Policy", href: "/politica-cookie-uri" }
  ];

  return (
    <MainLayout breadcrumbItems={breadcrumbItems}>
      <Helmet>
        <title>{isRo ? "Politica de Cookie-uri | VAIAVITA" : "Cookie Policy | VAIAVITA"}</title>
        <meta name="description" content={isRo 
          ? "Politica de cookie-uri VAIAVITA - Află ce cookie-uri folosim și cum le poți gestiona." 
          : "VAIAVITA Cookie Policy - Learn what cookies we use and how you can manage them."
        } />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-8">
          {isRo ? "Politica de Cookie-uri" : "Cookie Policy"}
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground text-sm">
            {isRo ? "Ultima actualizare: 18.11.2025" : "Last updated: November 18, 2025"}
          </p>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "1. Ce sunt cookie-urile?" : "1. What Are Cookies?"}
            </h2>
            <p className="text-foreground leading-relaxed">
              {isRo 
                ? "Cookie-urile sunt fișiere text de mici dimensiuni care sunt stocate pe dispozitivul dumneavoastră (computer, telefon, tabletă) atunci când vizitați un site web. Acestea permit site-ului să rețină informații despre vizita dumneavoastră, facilitând navigarea și făcând site-ul mai util pentru dumneavoastră."
                : "Cookies are small text files that are stored on your device (computer, phone, tablet) when you visit a website. They allow the site to remember information about your visit, facilitating navigation and making the site more useful to you."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "2. Tipuri de cookie-uri utilizate" : "2. Types of Cookies Used"}
            </h2>
            
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {isRo ? "Cookie-uri strict necesare" : "Strictly Necessary Cookies"}
                </h3>
                <p className="text-muted-foreground mb-2">
                  {isRo 
                    ? "Aceste cookie-uri sunt esențiale pentru funcționarea site-ului și nu pot fi dezactivate. Acestea includ:"
                    : "These cookies are essential for the website to function and cannot be disabled. They include:"
                  }
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>{isRo ? "Cookie-uri de sesiune pentru coșul de cumpărături" : "Session cookies for shopping cart"}</li>
                  <li>{isRo ? "Cookie-uri pentru preferințele de limbă" : "Language preference cookies"}</li>
                  <li>{isRo ? "Cookie-uri pentru consimțământul cookie-urilor" : "Cookie consent cookies"}</li>
                  <li>{isRo ? "Cookie-uri pentru tema site-ului (dark/light mode)" : "Site theme cookies (dark/light mode)"}</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {isRo ? "Cookie-uri analitice" : "Analytical Cookies"}
                </h3>
                <p className="text-muted-foreground mb-2">
                  {isRo 
                    ? "Acestea ne ajută să înțelegem cum folosesc vizitatorii site-ul nostru, permițându-ne să îl îmbunătățim. Utilizăm:"
                    : "These help us understand how visitors use our website, allowing us to improve it. We use:"
                  }
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Google Analytics 4 ({isRo ? "statistici anonime despre trafic" : "anonymous traffic statistics"})</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {isRo ? "Cookie-uri de marketing" : "Marketing Cookies"}
                </h3>
                <p className="text-muted-foreground mb-2">
                  {isRo 
                    ? "Aceste cookie-uri sunt folosite pentru a vă afișa reclame relevante. Sunt setate doar cu consimțământul dumneavoastră și pot include:"
                    : "These cookies are used to display relevant ads to you. They are set only with your consent and may include:"
                  }
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Facebook Pixel</li>
                  <li>Google Ads</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "3. Durata de stocare" : "3. Storage Duration"}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>{isRo ? "Cookie-uri de sesiune" : "Session cookies"}</strong>: {isRo ? "se șterg automat la închiderea browserului" : "automatically deleted when browser is closed"}</li>
              <li><strong>{isRo ? "Cookie-uri persistente" : "Persistent cookies"}</strong>: {isRo ? "rămân stocate pentru o perioadă determinată (de la câteva zile până la 2 ani)" : "remain stored for a specific period (from a few days to 2 years)"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "4. Gestionarea cookie-urilor" : "4. Managing Cookies"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Puteți gestiona preferințele cookie-urilor în orice moment prin:"
                : "You can manage your cookie preferences at any time by:"
              }
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>{isRo ? "Banner-ul de consimțământ cookie-uri de pe site" : "The cookie consent banner on the site"}</li>
              <li>{isRo ? "Setările browserului dumneavoastră" : "Your browser settings"}</li>
            </ul>
            <p className="text-foreground leading-relaxed">
              {isRo 
                ? "Rețineți că dezactivarea anumitor cookie-uri poate afecta funcționalitatea site-ului."
                : "Please note that disabling certain cookies may affect the website functionality."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "5. Cookie-uri terță parte" : "5. Third-Party Cookies"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Unele cookie-uri sunt setate de servicii terțe care apar pe paginile noastre. Nu avem control asupra cookie-urilor setate de aceste servicii."
                : "Some cookies are set by third-party services that appear on our pages. We do not have control over cookies set by these services."
              }
            </p>
            <div className="bg-muted/50 rounded-xl p-6">
              <p className="font-semibold text-foreground mb-2">{isRo ? "Servicii terțe utilizate:" : "Third-party services used:"}</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Stripe ({isRo ? "procesare plăți" : "payment processing"})</li>
                <li>Google Analytics ({isRo ? "analiză trafic" : "traffic analysis"})</li>
                <li>Google Maps ({isRo ? "hărți locker-e" : "locker maps"})</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "6. Cum să ștergeți cookie-urile" : "6. How to Delete Cookies"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Puteți șterge cookie-urile deja stocate din setările browserului dumneavoastră:"
                : "You can delete already stored cookies from your browser settings:"
              }
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Chrome</strong>: {isRo ? "Setări > Confidențialitate și securitate > Șterge datele de navigare" : "Settings > Privacy and security > Clear browsing data"}</li>
              <li><strong>Firefox</strong>: {isRo ? "Setări > Confidențialitate și securitate > Cookie-uri și date ale site-urilor" : "Settings > Privacy & Security > Cookies and Site Data"}</li>
              <li><strong>Safari</strong>: {isRo ? "Preferințe > Confidențialitate > Gestionează datele site-urilor" : "Preferences > Privacy > Manage Website Data"}</li>
              <li><strong>Edge</strong>: {isRo ? "Setări > Confidențialitate și servicii > Șterge datele de navigare" : "Settings > Privacy and services > Clear browsing data"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "7. Modificări ale politicii" : "7. Policy Changes"}
            </h2>
            <p className="text-foreground leading-relaxed">
              {isRo 
                ? "Ne rezervăm dreptul de a actualiza această Politică de Cookie-uri. Versiunea actualizată va fi publicată pe această pagină cu data ultimei actualizări."
                : "We reserve the right to update this Cookie Policy. The updated version will be published on this page with the date of the last update."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "8. Contact" : "8. Contact"}
            </h2>
            <p className="text-foreground leading-relaxed">
              {isRo 
                ? "Pentru întrebări despre această politică, contactați-ne la:"
                : "For questions about this policy, contact us at:"
              }
            </p>
            <div className="bg-muted/50 rounded-xl p-6 mt-4">
              <p className="text-muted-foreground">Email: <a href="mailto:office@vaiavita.com" className="text-primary hover:underline">office@vaiavita.com</a></p>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default PoliticaCookies;
