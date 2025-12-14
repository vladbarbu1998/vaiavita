import { MainLayout } from "@/components/layout";
import { useLanguage } from "@/context/LanguageContext";
import { Helmet } from "react-helmet-async";

const TermeniConditii = () => {
  const { language } = useLanguage();
  const isRo = language === 'ro';

  const breadcrumbItems = [
    { label: isRo ? "Termeni și Condiții" : "Terms and Conditions", labelEn: "Terms and Conditions", href: "/termeni-si-conditii" }
  ];

  return (
    <MainLayout breadcrumbItems={breadcrumbItems}>
      <Helmet>
        <title>{isRo ? "Termeni și Condiții | VAIAVITA" : "Terms and Conditions | VAIAVITA"}</title>
        <meta name="description" content={isRo 
          ? "Termeni și condiții de utilizare a magazinului online VAIAVITA." 
          : "Terms and conditions for using the VAIAVITA online store."
        } />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-8">
          {isRo ? "Termeni și Condiții" : "Terms and Conditions"}
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground text-sm">
            {isRo ? "Ultima actualizare: 18.11.2025" : "Last updated: November 18, 2025"}
          </p>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "1. Informații generale" : "1. General Information"}
            </h2>
            <p className="text-foreground leading-relaxed">
              {isRo 
                ? "Prezentele Termeni și Condiții reglementează utilizarea site-ului web VAIAVITA.ro și achiziționarea produselor comercializate prin intermediul acestuia. Prin accesarea și utilizarea acestui site, sunteți de acord să respectați acești termeni."
                : "These Terms and Conditions govern the use of the VAIAVITA.ro website and the purchase of products sold through it. By accessing and using this site, you agree to comply with these terms."
              }
            </p>
            <div className="bg-muted/50 rounded-xl p-6 mt-4 space-y-2">
              <p className="font-semibold text-foreground">VAIAVITA S.R.L.</p>
              <p className="text-muted-foreground">{isRo ? "Sediu social" : "Registered office"}: Municipiul Brașov, Strada Căliman, Nr. 25, Casa 2, Camera 1, Jud. Brașov</p>
              <p className="text-muted-foreground">{isRo ? "Nr. Registrul Comerțului" : "Trade Registry No."}: J8/1310/2024</p>
              <p className="text-muted-foreground">CUI: 49945945</p>
              <p className="text-muted-foreground">Email: <a href="mailto:office@vaiavita.com" className="text-primary hover:underline">office@vaiavita.com</a></p>
              <p className="text-muted-foreground">{isRo ? "Telefon" : "Phone"}: 0732 111 117</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "2. Definiții" : "2. Definitions"}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>{isRo ? "Vânzător" : "Seller"}</strong>: VAIAVITA S.R.L.</li>
              <li><strong>{isRo ? "Cumpărător/Client" : "Buyer/Customer"}</strong>: {isRo ? "persoană fizică sau juridică care plasează o comandă" : "natural or legal person who places an order"}</li>
              <li><strong>{isRo ? "Comandă" : "Order"}</strong>: {isRo ? "solicitarea de achiziție a produselor disponibile pe site" : "request to purchase products available on the site"}</li>
              <li><strong>{isRo ? "Contract" : "Contract"}</strong>: {isRo ? "acordul încheiat la distanță între Vânzător și Cumpărător" : "agreement concluded remotely between Seller and Buyer"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "3. Produse și prețuri" : "3. Products and Prices"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Produsele comercializate pe VAIAVITA.ro sunt produse de îngrijire personală și suplimente alimentare. Prețurile afișate includ TVA și sunt exprimate în RON. Ne rezervăm dreptul de a modifica prețurile în orice moment, fără notificare prealabilă, însă prețul aplicabil este cel din momentul plasării comenzii."
                : "Products sold on VAIAVITA.ro are personal care products and dietary supplements. Displayed prices include VAT and are expressed in RON. We reserve the right to modify prices at any time without prior notice, but the applicable price is the one at the time of order placement."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "4. Plasarea și confirmarea comenzii" : "4. Placing and Confirming Orders"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Comenzile pot fi plasate direct pe site, completând formularul de comandă. După finalizarea comenzii, veți primi un email de confirmare cu detaliile acesteia. Contractul se consideră încheiat în momentul în care primiți confirmarea comenzii."
                : "Orders can be placed directly on the site by completing the order form. After completing the order, you will receive a confirmation email with its details. The contract is considered concluded when you receive the order confirmation."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "5. Modalități de plată" : "5. Payment Methods"}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>{isRo ? "Card bancar" : "Bank card"}</strong>: {isRo ? "prin Stripe (Visa, Mastercard, Apple Pay, Google Pay)" : "via Stripe (Visa, Mastercard, Apple Pay, Google Pay)"}</li>
              <li><strong>{isRo ? "Ramburs" : "Cash on Delivery"}</strong>: {isRo ? "plata la livrare (disponibil doar în România)" : "payment on delivery (available only in Romania)"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "6. Livrare" : "6. Delivery"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Livrarea se efectuează prin servicii de curierat în România și internațional (UE și UK). Termenele de livrare sunt orientative și pot varia în funcție de disponibilitatea produselor și zona de livrare."
                : "Delivery is carried out through courier services in Romania and internationally (EU and UK). Delivery times are indicative and may vary depending on product availability and delivery area."
              }
            </p>
            <div className="bg-muted/50 rounded-xl p-6 space-y-2">
              <p className="font-semibold text-foreground">{isRo ? "Costuri de livrare România:" : "Delivery costs Romania:"}</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>{isRo ? "Curier la adresă: 19 RON" : "Courier to address: 19 RON"}</li>
                <li>{isRo ? "Poșta Română: 15 RON" : "Romanian Post: 15 RON"}</li>
                <li>EasyBox/Locker: 15 RON</li>
                <li>{isRo ? "Ridicare personală Brașov: Gratuit" : "Personal pickup Brașov: Free"}</li>
              </ul>
              <p className="font-semibold text-foreground mt-4">{isRo ? "Transport gratuit:" : "Free shipping:"}</p>
              <p className="text-muted-foreground">{isRo ? "Pentru comenzi peste 150 RON în România" : "For orders over 150 RON in Romania"}</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "7. Dreptul de retragere" : "7. Right of Withdrawal"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Conform OUG 34/2014, aveți dreptul de a vă retrage din contract în termen de 14 zile calendaristice de la primirea produselor, fără a invoca vreun motiv. Pentru a exercita acest drept, trebuie să ne informați despre decizia dumneavoastră printr-o declarație neechivocă (email la office@vaiavita.com)."
                : "According to Government Emergency Ordinance 34/2014, you have the right to withdraw from the contract within 14 calendar days from receiving the products, without stating any reason. To exercise this right, you must inform us of your decision through an unequivocal statement (email to office@vaiavita.com)."
              }
            </p>
            <p className="text-foreground leading-relaxed">
              {isRo 
                ? "Produsele trebuie returnate în stare originală, nefolosite, cu ambalajul intact. Costurile de returnare sunt suportate de cumpărător."
                : "Products must be returned in original condition, unused, with intact packaging. Return costs are borne by the buyer."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "8. Garanție și reclamații" : "8. Warranty and Complaints"}
            </h2>
            <p className="text-foreground leading-relaxed">
              {isRo 
                ? "Produsele beneficiază de garanția legală de conformitate. În cazul primirii unui produs defect sau diferit de cel comandat, vă rugăm să ne contactați în maximum 48 de ore de la recepție la office@vaiavita.com."
                : "Products benefit from the legal conformity guarantee. If you receive a defective product or one different from what was ordered, please contact us within 48 hours of receipt at office@vaiavita.com."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "9. Limitarea răspunderii" : "9. Limitation of Liability"}
            </h2>
            <p className="text-foreground leading-relaxed">
              {isRo 
                ? "VAIAVITA S.R.L. nu răspunde pentru daunele rezultate din utilizarea necorespunzătoare a produselor sau din nerespectarea instrucțiunilor de utilizare. Informațiile despre produse sunt furnizate de producători și au caracter informativ."
                : "VAIAVITA S.R.L. is not liable for damages resulting from improper use of products or failure to follow usage instructions. Product information is provided by manufacturers and is for informational purposes."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "10. Proprietate intelectuală" : "10. Intellectual Property"}
            </h2>
            <p className="text-foreground leading-relaxed">
              {isRo 
                ? "Întregul conținut al site-ului (texte, imagini, logo-uri, grafică) este proprietatea VAIAVITA S.R.L. și este protejat de legislația privind drepturile de autor. Reproducerea fără acord scris este interzisă."
                : "The entire content of the site (texts, images, logos, graphics) is the property of VAIAVITA S.R.L. and is protected by copyright law. Reproduction without written consent is prohibited."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "11. Soluționarea litigiilor" : "11. Dispute Resolution"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "În cazul unor neînțelegeri, vom încerca soluționarea pe cale amiabilă. Dacă aceasta nu este posibilă, litigiile vor fi soluționate de instanțele competente din România."
                : "In case of disputes, we will try to resolve them amicably. If this is not possible, disputes will be resolved by the competent courts in Romania."
              }
            </p>
            <p className="text-foreground leading-relaxed">
              {isRo 
                ? "Pentru soluționarea alternativă a litigiilor, puteți apela la platforma europeană SOL: "
                : "For alternative dispute resolution, you can use the European ODR platform: "
              }
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "12. Modificări ale termenilor" : "12. Changes to Terms"}
            </h2>
            <p className="text-foreground leading-relaxed">
              {isRo 
                ? "Ne rezervăm dreptul de a modifica acești Termeni și Condiții în orice moment. Versiunea actualizată va fi publicată pe această pagină."
                : "We reserve the right to modify these Terms and Conditions at any time. The updated version will be published on this page."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "13. Contact" : "13. Contact"}
            </h2>
            <p className="text-foreground leading-relaxed">
              {isRo 
                ? "Pentru orice întrebări sau nelămuriri, ne puteți contacta la:"
                : "For any questions or concerns, you can contact us at:"
              }
            </p>
            <div className="bg-muted/50 rounded-xl p-6 mt-4 space-y-2">
              <p className="text-muted-foreground">Email: <a href="mailto:office@vaiavita.com" className="text-primary hover:underline">office@vaiavita.com</a></p>
              <p className="text-muted-foreground">{isRo ? "Telefon" : "Phone"}: <a href="tel:0732111117" className="text-primary hover:underline">0732 111 117</a></p>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default TermeniConditii;
