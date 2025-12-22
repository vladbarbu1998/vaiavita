import { MainLayout } from "@/components/layout";
import { useLanguage } from "@/context/LanguageContext";
import { Helmet } from "react-helmet-async";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const PoliticaRetur = () => {
  const { language } = useLanguage();
  const isRo = language === 'ro';

  const breadcrumbItems = [
    { label: isRo ? "Politica de Retur" : "Return Policy", labelEn: "Return Policy", href: "/politica-retur" }
  ];

  const downloadWithdrawalForm = () => {
    const formContent = isRo ? `
FORMULAR TIP DE RETRAGERE
(Completați și returnați acest formular numai dacă doriți să vă retrageți din contract)

Către: VAIAVITA S.R.L.
Adresa: Municipiul Brașov, Strada Căliman, Nr. 25, Casa 2, Camera 1, Jud. Brașov
Email: office@vaiavita.com

Subsemnatul/Subsemnata, notific prin prezenta retragerea mea din contractul de vânzare a următoarelor produse:

Produs(e): _______________________________________________
Număr comandă: ___________________________________________
Data comandă: ____________________________________________
Data primire: ____________________________________________

Numele consumatorului: ____________________________________
Adresa consumatorului: ____________________________________
IBAN pentru rambursare: ___________________________________

Data: _______________

Semnătura consumatorului: _________________________________

(doar dacă formularul este transmis pe hârtie)
` : `
STANDARD WITHDRAWAL FORM
(Complete and return this form only if you wish to withdraw from the contract)

To: VAIAVITA S.R.L.
Address: Municipiul Brașov, Strada Căliman, Nr. 25, Casa 2, Camera 1, Jud. Brașov, Romania
Email: office@vaiavita.com

I hereby give notice that I withdraw from my contract of sale of the following products:

Product(s): _______________________________________________
Order number: ____________________________________________
Order date: ______________________________________________
Date received: ___________________________________________

Consumer name: ___________________________________________
Consumer address: ________________________________________
IBAN for refund: _________________________________________

Date: _______________

Consumer signature: ______________________________________

(only if this form is submitted on paper)
`;

    const blob = new Blob([formContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isRo ? 'Formular-Retragere-VAIAVITA.txt' : 'Withdrawal-Form-VAIAVITA.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout breadcrumbItems={breadcrumbItems}>
      <Helmet>
        <title>{isRo ? "Politica de Retur și Dreptul de Retragere | VAIAVITA" : "Return Policy and Right of Withdrawal | VAIAVITA"}</title>
        <meta name="description" content={isRo 
          ? "Informații despre dreptul de retragere în 14 zile, procedura de returnare și condițiile de rambursare conform OG 34/2014." 
          : "Information about the 14-day right of withdrawal, return procedure and refund conditions according to Romanian law."
        } />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-8">
          {isRo ? "Politica de Retur și Dreptul de Retragere" : "Return Policy and Right of Withdrawal"}
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground text-sm">
            {isRo ? "Ultima actualizare: 22.12.2025" : "Last updated: December 22, 2025"}
          </p>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "1. Dreptul de Retragere" : "1. Right of Withdrawal"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Conform Ordonanței de Urgență nr. 34/2014 privind drepturile consumatorilor, aveți dreptul de a vă retrage din contract în termen de 14 zile calendaristice fără a invoca niciun motiv."
                : "According to Government Emergency Ordinance no. 34/2014 regarding consumer rights, you have the right to withdraw from the contract within 14 calendar days without giving any reason."
              }
            </p>
            <div className="bg-muted/50 rounded-xl p-6 space-y-3">
              <p className="font-semibold text-foreground">{isRo ? "Termenul de 14 zile:" : "The 14-day period:"}</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>{isRo 
                  ? "Începe din ziua în care dumneavoastră sau o terță parte (alta decât transportatorul) intră în posesia fizică a produselor"
                  : "Starts from the day you or a third party (other than the carrier) acquires physical possession of the products"
                }</li>
                <li>{isRo 
                  ? "Pentru comenzi cu mai multe produse livrate separat, termenul începe de la primirea ultimului produs"
                  : "For orders with multiple products delivered separately, the period starts from receipt of the last product"
                }</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "2. Excepții de la Dreptul de Retragere" : "2. Exceptions to the Right of Withdrawal"}
            </h2>
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 mb-4">
              <p className="font-semibold text-destructive mb-3">
                {isRo ? "⚠️ IMPORTANT - Produse care NU pot fi returnate:" : "⚠️ IMPORTANT - Products that CANNOT be returned:"}
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                {isRo 
                  ? "Conform art. 16 lit. e) din OUG 34/2014, dreptul de retragere NU se aplică pentru:"
                  : "According to art. 16 letter e) of GEO 34/2014, the right of withdrawal does NOT apply to:"
                }
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li className="font-semibold">
                  {isRo 
                    ? "Produse sigilate care nu pot fi returnate din motive de protecție a sănătății sau din motive de igienă și care au fost desigilate de consumator după livrare"
                    : "Sealed products which cannot be returned for health protection or hygiene reasons and which have been unsealed after delivery"
                  }
                </li>
              </ul>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
              <p className="font-semibold text-amber-700 dark:text-amber-400 mb-3">
                {isRo ? "Aceasta include produsele noastre:" : "This includes our products:"}
              </p>
              <ul className="list-disc list-inside space-y-2 text-foreground">
                <li>{isRo ? "Paste de dinți (odată desigilate)" : "Toothpaste (once unsealed)"}</li>
                <li>{isRo ? "Periuțe de dinți (odată scoase din ambalaj)" : "Toothbrushes (once removed from packaging)"}</li>
                <li>{isRo ? "Produse cosmetice desigilate" : "Unsealed cosmetic products"}</li>
                <li>{isRo ? "Suplimente alimentare desigilate" : "Unsealed dietary supplements"}</li>
              </ul>
              <p className="text-muted-foreground mt-4 text-sm">
                {isRo 
                  ? "Aceste produse pot fi returnate DOAR dacă ambalajul original este intact și sigiliul nu a fost rupt."
                  : "These products can ONLY be returned if the original packaging is intact and the seal has not been broken."
                }
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "3. Cum să Exercitați Dreptul de Retragere" : "3. How to Exercise Your Right of Withdrawal"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Pentru a vă exercita dreptul de retragere, trebuie să ne informați despre decizia dumneavoastră printr-o declarație neechivocă (de exemplu, o scrisoare trimisă prin poștă sau email)."
                : "To exercise your right of withdrawal, you must inform us of your decision by an unequivocal statement (for example, a letter sent by post or email)."
              }
            </p>
            
            <div className="bg-muted/50 rounded-xl p-6 space-y-3 mb-4">
              <p className="font-semibold text-foreground">{isRo ? "Informații de contact pentru retragere:" : "Contact information for withdrawal:"}</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Email:</strong> <a href="mailto:office@vaiavita.com" className="text-primary hover:underline">office@vaiavita.com</a></li>
                <li><strong>{isRo ? "Telefon" : "Phone"}:</strong> <a href="tel:0732111117" className="text-primary hover:underline">0732 111 117</a></li>
                <li><strong>{isRo ? "Adresă" : "Address"}:</strong> Municipiul Brașov, Strada Căliman, Nr. 25, Casa 2, Camera 1, Jud. Brașov</li>
              </ul>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <p className="font-semibold text-foreground mb-3">
                {isRo ? "📝 Formular de Retragere" : "📝 Withdrawal Form"}
              </p>
              <p className="text-muted-foreground mb-4">
                {isRo 
                  ? "Puteți utiliza formularul de retragere de mai jos, dar nu este obligatoriu:"
                  : "You can use the withdrawal form below, but it is not mandatory:"
                }
              </p>
              <Button onClick={downloadWithdrawalForm} variant="outline" className="gap-2">
                <FileDown className="w-4 h-4" />
                {isRo ? "Descarcă Formular de Retragere" : "Download Withdrawal Form"}
              </Button>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "4. Procedura de Returnare" : "4. Return Procedure"}
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">1</div>
                <div>
                  <p className="font-semibold text-foreground">{isRo ? "Notificați-ne" : "Notify us"}</p>
                  <p className="text-muted-foreground">{isRo 
                    ? "Trimiteți un email la office@vaiavita.com cu numărul comenzii și produsele pe care doriți să le returnați."
                    : "Send an email to office@vaiavita.com with your order number and products you wish to return."
                  }</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">2</div>
                <div>
                  <p className="font-semibold text-foreground">{isRo ? "Pregătiți coletul" : "Prepare the package"}</p>
                  <p className="text-muted-foreground">{isRo 
                    ? "Ambalați produsele în siguranță. Produsele trebuie să fie în stare originală, nefolosite, cu etichetele și ambalajul intact."
                    : "Pack the products securely. Products must be in original condition, unused, with labels and packaging intact."
                  }</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">3</div>
                <div>
                  <p className="font-semibold text-foreground">{isRo ? "Expediați produsele" : "Ship the products"}</p>
                  <p className="text-muted-foreground">{isRo 
                    ? "Trimiteți coletul la adresa noastră în maximum 14 zile de la notificarea retragerii."
                    : "Send the package to our address within 14 days of the withdrawal notification."
                  }</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">4</div>
                <div>
                  <p className="font-semibold text-foreground">{isRo ? "Primiți rambursarea" : "Receive refund"}</p>
                  <p className="text-muted-foreground">{isRo 
                    ? "Vom procesa rambursarea în maximum 14 zile de la primirea produselor returnate."
                    : "We will process the refund within 14 days of receiving the returned products."
                  }</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "5. Costurile Returului" : "5. Return Costs"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Costurile directe de returnare a produselor sunt suportate de dumneavoastră, cu excepția cazului în care am livrat un produs diferit de cel comandat sau produsul prezintă defecte."
                : "The direct costs of returning the products are borne by you, unless we delivered a product different from what was ordered or the product has defects."
              }
            </p>
            <div className="bg-muted/50 rounded-xl p-6">
              <p className="text-muted-foreground">
                {isRo 
                  ? "Vă recomandăm să utilizați un serviciu de curierat cu confirmare de primire pentru a avea dovada returnării."
                  : "We recommend using a courier service with delivery confirmation to have proof of return."
                }
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "6. Rambursarea" : "6. Refunds"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Vom rambursa toate plățile primite de la dumneavoastră, inclusiv costurile de livrare (cu excepția costurilor suplimentare rezultate din alegerea unui alt mod de livrare decât cel mai ieftin oferit de noi), fără întârzieri nejustificate și în orice caz nu mai târziu de 14 zile de la:"
                : "We will refund all payments received from you, including delivery costs (except for the supplementary costs resulting from your choice of a different delivery method than the cheapest one offered by us), without undue delay and in any case no later than 14 days from:"
              }
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>{isRo 
                ? "Ziua în care primim produsele returnate, sau"
                : "The day we receive the returned products, or"
              }</li>
              <li>{isRo 
                ? "Ziua în care furnizați dovada că ați returnat produsele (oricare dintre acestea este mai devreme)"
                : "The day you provide proof that you have returned the products (whichever is earlier)"
              }</li>
            </ul>
            <div className="bg-muted/50 rounded-xl p-6">
              <p className="font-semibold text-foreground mb-2">{isRo ? "Metoda de rambursare:" : "Refund method:"}</p>
              <p className="text-muted-foreground">
                {isRo 
                  ? "Rambursarea se va efectua utilizând aceeași metodă de plată pe care ați folosit-o pentru tranzacția inițială, cu excepția cazului în care ați convenit în mod expres altfel. În orice caz, nu veți suporta nicio taxă în urma rambursării."
                  : "The refund will be made using the same payment method you used for the initial transaction, unless you have expressly agreed otherwise. In any case, you will not incur any fees as a result of the refund."
                }
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "7. Produse Defecte sau Livrate Greșit" : "7. Defective or Wrongly Delivered Products"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Dacă ați primit un produs defect sau diferit de cel comandat, vă rugăm să ne contactați în maximum 48 de ore de la recepție. În acest caz:"
                : "If you received a defective product or one different from what was ordered, please contact us within 48 hours of receipt. In this case:"
              }
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{isRo ? "Costurile de returnare vor fi suportate de noi" : "Return costs will be borne by us"}</li>
              <li>{isRo ? "Vom înlocui produsul sau vom rambursa integral suma" : "We will replace the product or fully refund the amount"}</li>
              <li>{isRo ? "Vă rugăm să păstrați ambalajul original și să ne trimiteți fotografii cu produsul" : "Please keep the original packaging and send us photos of the product"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "8. Garanție Legală de Conformitate" : "8. Legal Guarantee of Conformity"}
            </h2>
            <p className="text-foreground leading-relaxed">
              {isRo 
                ? "Toate produsele beneficiază de garanția legală de conformitate de 2 ani conform Legii nr. 449/2003. În cazul în care un produs nu este conform cu contractul de vânzare, aveți dreptul la reparare sau înlocuire gratuită, sau, dacă acestea nu sunt posibile, la reducerea prețului sau rezoluțiunea contractului."
                : "All products benefit from the 2-year legal guarantee of conformity according to Law no. 449/2003. If a product is not in conformity with the sales contract, you have the right to free repair or replacement, or, if these are not possible, to a price reduction or contract resolution."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "9. Contact" : "9. Contact"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Pentru orice întrebări legate de returnări sau rambursări, ne puteți contacta la:"
                : "For any questions regarding returns or refunds, you can contact us at:"
              }
            </p>
            <div className="bg-muted/50 rounded-xl p-6 space-y-2">
              <p className="font-semibold text-foreground">VAIAVITA S.R.L.</p>
              <p className="text-muted-foreground">Email: <a href="mailto:office@vaiavita.com" className="text-primary hover:underline">office@vaiavita.com</a></p>
              <p className="text-muted-foreground">{isRo ? "Telefon" : "Phone"}: <a href="tel:0732111117" className="text-primary hover:underline">0732 111 117</a></p>
              <p className="text-muted-foreground">{isRo ? "Program" : "Hours"}: {isRo ? "Luni - Vineri, 09:00 - 18:00" : "Monday - Friday, 09:00 - 18:00"}</p>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default PoliticaRetur;