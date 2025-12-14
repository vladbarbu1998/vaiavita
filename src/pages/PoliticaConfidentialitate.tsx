import { MainLayout } from "@/components/layout";
import { useLanguage } from "@/context/LanguageContext";
import { Helmet } from "react-helmet-async";

const PoliticaConfidentialitate = () => {
  const { language } = useLanguage();
  const isRo = language === 'ro';

  const breadcrumbItems = [
    { label: isRo ? "Politica de Confidențialitate" : "Privacy Policy", labelEn: "Privacy Policy", href: "/politica-confidentialitate" }
  ];

  return (
    <MainLayout customBreadcrumbs={breadcrumbItems}>
      <Helmet>
        <title>{isRo ? "Politica de Confidențialitate | VAIAVITA" : "Privacy Policy | VAIAVITA"}</title>
        <meta name="description" content={isRo 
          ? "Politica de confidențialitate VAIAVITA - Află cum protejăm datele tale personale conform GDPR." 
          : "VAIAVITA Privacy Policy - Learn how we protect your personal data in compliance with GDPR."
        } />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-8">
          {isRo ? "Politica de Confidențialitate" : "Privacy Policy"}
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground text-sm">
            {isRo ? "Ultima actualizare: 18.11.2025" : "Last updated: November 18, 2025"}
          </p>

          <p className="text-foreground leading-relaxed">
            {isRo 
              ? "Website-ul VAIAVITA.ro este operat de VAIAVITA S.R.L., companie înregistrată în România și conformă cu Regulamentul (UE) 2016/679 (GDPR). Protejarea datelor personale este o prioritate pentru noi, iar această politică explică modul în care colectăm, folosim și protejăm informațiile dumneavoastră."
              : "The website VAIAVITA.ro is operated by VAIAVITA S.R.L., a company registered in Romania and compliant with Regulation (EU) 2016/679 (GDPR). Protecting personal data is a priority for us, and this policy explains how we collect, use, and protect your information."
            }
          </p>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "1. Cine suntem – Operatorul de date" : "1. Who We Are – Data Controller"}
            </h2>
            <div className="bg-muted/50 rounded-xl p-6 space-y-2">
              <p className="font-semibold text-foreground">VAIAVITA S.R.L.</p>
              <p className="text-muted-foreground">{isRo ? "Sediu social" : "Registered office"}: Municipiul Brașov, Strada Căliman, Nr. 25, Casa 2, Camera 1, Jud. Brașov</p>
              <p className="text-muted-foreground">{isRo ? "Nr. Registrul Comerțului" : "Trade Registry No."}: J8/1310/2024</p>
              <p className="text-muted-foreground">CUI: 49945945</p>
              <p className="text-muted-foreground">EUID: ROONRC.J8/1310/2024</p>
              <p className="text-muted-foreground">Email: <a href="mailto:office@vaiavita.com" className="text-primary hover:underline">office@vaiavita.com</a></p>
              <p className="text-muted-foreground">Website: <a href="https://vaiavita.ro" className="text-primary hover:underline">https://vaiavita.ro</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "2. Ce date personale colectăm" : "2. What Personal Data We Collect"}
            </h2>
            <p className="text-foreground mb-4">
              {isRo 
                ? "Colectăm date pentru funcționarea magazinului online și procesarea comenzilor:"
                : "We collect data for the operation of the online store and order processing:"
              }
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{isRo ? "nume, prenume" : "first name, last name"}</li>
              <li>{isRo ? "adresă livrare/facturare" : "delivery/billing address"}</li>
              <li>{isRo ? "email, telefon" : "email, phone"}</li>
              <li>{isRo ? "date despre comandă" : "order details"}</li>
              <li>{isRo ? "date tehnice (IP, browser, cookie-uri)" : "technical data (IP, browser, cookies)"}</li>
            </ul>
            <p className="text-foreground mt-4">
              {isRo 
                ? "Plățile sunt procesate de Stripe. Nu stocăm datele cardului."
                : "Payments are processed by Stripe. We do not store card data."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "3. Scopurile prelucrării" : "3. Purposes of Processing"}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{isRo ? "procesare și livrare comenzi" : "order processing and delivery"}</li>
              <li>{isRo ? "facturare, obligații legale" : "invoicing, legal obligations"}</li>
              <li>{isRo ? "suport clienți" : "customer support"}</li>
              <li>{isRo ? "prevenirea fraudelor" : "fraud prevention"}</li>
              <li>{isRo ? "marketing pe bază de consimțământ" : "consent-based marketing"}</li>
              <li>{isRo ? "analiza și îmbunătățirea site-ului" : "website analysis and improvement"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "4. Temeiul legal" : "4. Legal Basis"}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{isRo ? "executarea contractului" : "contract execution"}</li>
              <li>{isRo ? "obligație legală" : "legal obligation"}</li>
              <li>{isRo ? "interes legitim" : "legitimate interest"}</li>
              <li>{isRo ? "consimțământ" : "consent"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "5. Destinatarii datelor" : "5. Data Recipients"}
            </h2>
            <p className="text-foreground mb-4">
              {isRo ? "Parteneri necesari funcționării magazinului:" : "Partners necessary for store operation:"}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Stripe ({isRo ? "procesare plăți" : "payment processing"})</li>
              <li>eColet ({isRo ? "curierat" : "courier services"})</li>
              <li>{isRo ? "furnizor hosting" : "hosting provider"}</li>
              <li>{isRo ? "contabilitate" : "accounting"}</li>
              <li>{isRo ? "autorități (obligații legale)" : "authorities (legal obligations)"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "6. Durata de stocare" : "6. Data Retention Period"}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{isRo ? "date comenzi: 10 ani" : "order data: 10 years"}</li>
              <li>{isRo ? "cont client: până la ștergere" : "customer account: until deletion"}</li>
              <li>{isRo ? "marketing: până la retragerea consimțământului" : "marketing: until consent withdrawal"}</li>
              <li>{isRo ? "cookie-uri: conform politicii de cookie-uri" : "cookies: according to cookie policy"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "7. Drepturile utilizatorului" : "7. User Rights"}
            </h2>
            <p className="text-foreground mb-4">
              {isRo ? "Conform GDPR, aveți următoarele drepturi:" : "Under GDPR, you have the following rights:"}
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{isRo ? "dreptul de acces la date" : "right of access"}</li>
              <li>{isRo ? "dreptul la rectificare" : "right to rectification"}</li>
              <li>{isRo ? "dreptul la ștergere" : "right to erasure"}</li>
              <li>{isRo ? "dreptul la portabilitatea datelor" : "right to data portability"}</li>
              <li>{isRo ? "dreptul la restricționare" : "right to restriction"}</li>
              <li>{isRo ? "dreptul la opoziție" : "right to object"}</li>
              <li>{isRo ? "dreptul de retragere a consimțământului" : "right to withdraw consent"}</li>
            </ul>
            <p className="text-foreground mt-4">
              {isRo 
                ? "Pentru a vă exercita drepturile, contactați-ne la: "
                : "To exercise your rights, contact us at: "
              }
              <a href="mailto:office@vaiavita.com" className="text-primary hover:underline">office@vaiavita.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "8. Securitatea datelor" : "8. Data Security"}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{isRo ? "criptare SSL/TLS" : "SSL/TLS encryption"}</li>
              <li>{isRo ? "acces controlat" : "controlled access"}</li>
              <li>{isRo ? "măsuri tehnice și organizatorice" : "technical and organizational measures"}</li>
              <li>{isRo ? "backup regulat" : "regular backups"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "9. Cookie-uri" : "9. Cookies"}
            </h2>
            <p className="text-foreground">
              {isRo 
                ? "Folosim cookie-uri necesare, analitice și de marketing. Detalii în "
                : "We use necessary, analytical, and marketing cookies. Details in our "
              }
              <a href="/politica-cookie-uri" className="text-primary hover:underline">
                {isRo ? "Politica de Cookie-uri" : "Cookie Policy"}
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "10. Modificări" : "10. Changes"}
            </h2>
            <p className="text-foreground">
              {isRo 
                ? "Actualizările acestei politici vor fi publicate pe această pagină. Vă recomandăm să verificați periodic pentru a fi la curent cu eventualele modificări."
                : "Updates to this policy will be published on this page. We recommend checking periodically to stay informed about any changes."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "11. Contact autoritate de supraveghere" : "11. Supervisory Authority Contact"}
            </h2>
            <p className="text-foreground">
              {isRo 
                ? "Dacă considerați că drepturile dumneavoastră au fost încălcate, aveți dreptul să depuneți o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP):"
                : "If you believe your rights have been violated, you have the right to file a complaint with the National Authority for the Supervision of Personal Data Processing (ANSPDCP):"
              }
            </p>
            <div className="bg-muted/50 rounded-xl p-6 mt-4 space-y-2">
              <p className="text-muted-foreground">Website: <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.dataprotection.ro</a></p>
              <p className="text-muted-foreground">Email: <a href="mailto:anspdcp@dataprotection.ro" className="text-primary hover:underline">anspdcp@dataprotection.ro</a></p>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default PoliticaConfidentialitate;
