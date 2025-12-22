import { MainLayout } from "@/components/layout";
import { useLanguage } from "@/context/LanguageContext";
import { Helmet } from "react-helmet-async";
import { Truck, Package, MapPin, Clock, CreditCard } from "lucide-react";

const PoliticaLivrare = () => {
  const { language } = useLanguage();
  const isRo = language === 'ro';

  const breadcrumbItems = [
    { label: isRo ? "Politica de Livrare" : "Delivery Policy", labelEn: "Delivery Policy", href: "/politica-livrare" }
  ];

  return (
    <MainLayout breadcrumbItems={breadcrumbItems}>
      <Helmet>
        <title>{isRo ? "Politica de Livrare | VAIAVITA" : "Delivery Policy | VAIAVITA"}</title>
        <meta name="description" content={isRo 
          ? "Informații despre metodele de livrare, costuri, termene și zonele deservite de VAIAVITA." 
          : "Information about delivery methods, costs, timeframes and areas served by VAIAVITA."
        } />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-8">
          {isRo ? "Politica de Livrare" : "Delivery Policy"}
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground text-sm">
            {isRo ? "Ultima actualizare: 22.12.2025" : "Last updated: December 22, 2025"}
          </p>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" />
              {isRo ? "1. Metode de Livrare în România" : "1. Delivery Methods in Romania"}
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-muted/50 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <p className="font-semibold text-foreground">{isRo ? "Curier la adresă" : "Courier to Address"}</p>
                </div>
                <p className="text-2xl font-bold text-primary">19 RON</p>
                <p className="text-muted-foreground text-sm">
                  {isRo 
                    ? "Livrare la adresa specificată prin parteneri de curierat (Fan Courier, DPD, Cargus, SameDay)"
                    : "Delivery to specified address via courier partners (Fan Courier, DPD, Cargus, SameDay)"
                  }
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <p className="font-semibold text-foreground">EasyBox / Locker</p>
                </div>
                <p className="text-2xl font-bold text-primary">15 RON</p>
                <p className="text-muted-foreground text-sm">
                  {isRo 
                    ? "Ridicare din puncte automate Ecolet/SameDay. Coletul rămâne disponibil 3 zile."
                    : "Pickup from automated Ecolet/SameDay points. Package available for 3 days."
                  }
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <p className="font-semibold text-foreground">{isRo ? "Poșta Română" : "Romanian Post"}</p>
                </div>
                <p className="text-2xl font-bold text-primary">15 RON</p>
                <p className="text-muted-foreground text-sm">
                  {isRo 
                    ? "Livrare prin Poșta Română cu confirmare de primire"
                    : "Delivery via Romanian Post with confirmation of receipt"
                  }
                </p>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <p className="font-semibold text-foreground">{isRo ? "Ridicare Personală" : "Personal Pickup"}</p>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{isRo ? "GRATUIT" : "FREE"}</p>
                <p className="text-muted-foreground text-sm">
                  {isRo 
                    ? "Ridicare din Brașov, Str. Căliman nr. 25 (doar cu programare prealabilă)"
                    : "Pickup from Brașov, Str. Căliman no. 25 (by appointment only)"
                  }
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "2. Transport Gratuit" : "2. Free Shipping"}
            </h2>
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
              <p className="text-xl font-bold text-foreground mb-2">
                🎉 {isRo ? "Transport GRATUIT pentru comenzi peste 150 RON!" : "FREE shipping for orders over 150 RON!"}
              </p>
              <p className="text-muted-foreground">
                {isRo 
                  ? "Valabil pentru toate metodele de livrare în România (curier, locker, poștă)."
                  : "Valid for all delivery methods in Romania (courier, locker, post)."
                }
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              {isRo ? "3. Termene de Livrare" : "3. Delivery Timeframes"}
            </h2>
            <div className="bg-muted/50 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-foreground font-medium">{isRo ? "Curier la adresă" : "Courier to address"}</span>
                <span className="text-muted-foreground">1-3 {isRo ? "zile lucrătoare" : "business days"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-foreground font-medium">EasyBox / Locker</span>
                <span className="text-muted-foreground">1-2 {isRo ? "zile lucrătoare" : "business days"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-foreground font-medium">{isRo ? "Poșta Română" : "Romanian Post"}</span>
                <span className="text-muted-foreground">3-5 {isRo ? "zile lucrătoare" : "business days"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-foreground font-medium">{isRo ? "Ridicare personală" : "Personal pickup"}</span>
                <span className="text-muted-foreground">{isRo ? "Cu programare" : "By appointment"}</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-4">
              {isRo 
                ? "* Termenele sunt orientative și pot varia în funcție de disponibilitatea produselor, zona de livrare și perioada anului (sărbători, Black Friday etc.)."
                : "* Timeframes are indicative and may vary depending on product availability, delivery area and time of year (holidays, Black Friday etc.)."
              }
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "4. Procesarea Comenzii" : "4. Order Processing"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Comenzile plasate înainte de ora 14:00 în zilele lucrătoare sunt procesate în aceeași zi. Comenzile plasate după ora 14:00 sau în weekend/sărbători legale sunt procesate în următoarea zi lucrătoare."
                : "Orders placed before 2:00 PM on business days are processed the same day. Orders placed after 2:00 PM or on weekends/holidays are processed on the next business day."
              }
            </p>
            <div className="bg-muted/50 rounded-xl p-6 space-y-3">
              <p className="font-semibold text-foreground">{isRo ? "După plasarea comenzii veți primi:" : "After placing your order you will receive:"}</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>{isRo ? "Email de confirmare a comenzii" : "Order confirmation email"}</li>
                <li>{isRo ? "Email cu AWB și link de tracking când comanda este expediată" : "Email with AWB and tracking link when order is shipped"}</li>
                <li>{isRo ? "Notificare prin SMS/email de la curier" : "SMS/email notification from courier"}</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" />
              {isRo ? "5. Plata Ramburs" : "5. Cash on Delivery"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Pentru comenzile cu plata ramburs (la livrare), nu se adaugă costuri suplimentare. Plata se efectuează în numerar sau cu cardul (în funcție de opțiunile curierului) la momentul livrării."
                : "For cash on delivery orders, no additional costs are added. Payment is made in cash or by card (depending on courier options) at the time of delivery."
              }
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
              <p className="text-amber-700 dark:text-amber-400 font-medium">
                {isRo 
                  ? "⚠️ Vă rugăm să aveți suma exactă pregătită. Curierii pot să nu aibă rest pentru sume mari."
                  : "⚠️ Please have the exact amount ready. Couriers may not have change for large amounts."
                }
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "6. Livrări Internaționale" : "6. International Deliveries"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "În prezent, oferim livrări internaționale în țările Uniunii Europene și Regatul Unit. Costurile și termenele de livrare variază în funcție de destinație."
                : "We currently offer international deliveries to European Union countries and the United Kingdom. Delivery costs and timeframes vary depending on destination."
              }
            </p>
            <div className="bg-muted/50 rounded-xl p-6">
              <p className="text-muted-foreground">
                {isRo 
                  ? "Pentru livrări internaționale, vă rugăm să ne contactați la office@vaiavita.com pentru a primi o ofertă personalizată."
                  : "For international deliveries, please contact us at office@vaiavita.com to receive a personalized quote."
                }
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "7. Verificarea Coletului" : "7. Package Inspection"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Vă recomandăm să verificați integritatea coletului în prezența curierului. Dacă observați avarii la ambalaj, vă rugăm:"
                : "We recommend inspecting the package integrity in the presence of the courier. If you notice damage to the packaging, please:"
              }
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>{isRo ? "Fotografiați coletul înainte de deschidere" : "Photograph the package before opening"}</li>
              <li>{isRo ? "Notați pe AWB eventualele avarii vizibile" : "Note any visible damage on the AWB"}</li>
              <li>{isRo ? "Contactați-ne în maximum 48 de ore" : "Contact us within 48 hours"}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "8. Livrări Eșuate" : "8. Failed Deliveries"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "În cazul în care nu sunteți disponibil la adresa de livrare, curierul va încerca o relivrare în ziua următoare. După 2 încercări eșuate, coletul va fi returnat la sediul nostru și vă vom contacta pentru reprogramare."
                : "If you are not available at the delivery address, the courier will attempt redelivery the next day. After 2 failed attempts, the package will be returned to our office and we will contact you to reschedule."
              }
            </p>
            <div className="bg-muted/50 rounded-xl p-6">
              <p className="text-muted-foreground">
                {isRo 
                  ? "Pentru locker-uri: coletul rămâne disponibil timp de 3 zile. După expirarea acestui termen, va fi returnat automat."
                  : "For lockers: the package remains available for 3 days. After this period expires, it will be automatically returned."
                }
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "9. Parteneri de Livrare" : "9. Delivery Partners"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Colaborăm cu cei mai de încredere parteneri de curierat din România:"
                : "We work with the most trusted courier partners in Romania:"
              }
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="bg-muted/50 px-4 py-2 rounded-lg">
                <span className="font-medium">Fan Courier</span>
              </div>
              <div className="bg-muted/50 px-4 py-2 rounded-lg">
                <span className="font-medium">DPD</span>
              </div>
              <div className="bg-muted/50 px-4 py-2 rounded-lg">
                <span className="font-medium">Cargus</span>
              </div>
              <div className="bg-muted/50 px-4 py-2 rounded-lg">
                <span className="font-medium">SameDay</span>
              </div>
              <div className="bg-muted/50 px-4 py-2 rounded-lg">
                <span className="font-medium">GLS</span>
              </div>
              <div className="bg-muted/50 px-4 py-2 rounded-lg">
                <span className="font-medium">Ecolet</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
              {isRo ? "10. Contact" : "10. Contact"}
            </h2>
            <p className="text-foreground leading-relaxed mb-4">
              {isRo 
                ? "Pentru întrebări despre livrare sau tracking, ne puteți contacta la:"
                : "For questions about delivery or tracking, you can contact us at:"
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

export default PoliticaLivrare;