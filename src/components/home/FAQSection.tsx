import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/context/LanguageContext';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  questionRo: string;
  questionEn: string;
  answerRo: string;
  answerEn: string;
}

const faqs: FAQItem[] = [
  {
    questionRo: 'Ce conține pasta de dinți Dent-Tastic Fresh Mint?',
    questionEn: 'What does Dent-Tastic Fresh Mint toothpaste contain?',
    answerRo: 'Dent-Tastic Fresh Mint este o pastă de dinți cu ingrediente naturale, fără fluor și fără triclosan. Formula sa inovatoare conține quercetin și paeoniflorin, ingrediente dovedite clinic că inhibă bacteriile responsabile de bolile gingivale. Nu conține substanțe chimice agresive.',
    answerEn: 'Dent-Tastic Fresh Mint is a toothpaste with natural ingredients, fluoride-free and triclosan-free. Its innovative formula contains quercetin and paeoniflorin, clinically proven ingredients that inhibit bacteria responsible for gum disease. It contains no aggressive chemicals.',
  },
  {
    questionRo: 'Din ce material este periuța VAIAVITA?',
    questionEn: 'What material is the VAIAVITA toothbrush made of?',
    answerRo: 'Periuța de dinți VAIAVITA este fabricată din bambus natural, cu peri moi și un design ergonomic pentru o experiență de periaj confortabilă și eficientă. Este o alternativă ecologică la periuțele din plastic.',
    answerEn: 'The VAIAVITA toothbrush is made of natural bamboo, with soft bristles and an ergonomic design for a comfortable and efficient brushing experience. It is an eco-friendly alternative to plastic toothbrushes.',
  },
  {
    questionRo: 'Cât costă livrarea?',
    questionEn: 'How much does shipping cost?',
    answerRo: 'Livrarea standard costă 19.99 RON. Pentru comenzi de peste 150 RON, livrarea este gratuită în toată România. Livrăm prin curier rapid, cu termen de 1-3 zile lucrătoare.',
    answerEn: 'Standard shipping costs 19.99 RON. For orders over 150 RON, shipping is free across Romania. We deliver via express courier, within 1-3 business days.',
  },
  {
    questionRo: 'Care este politica de retur?',
    questionEn: 'What is the return policy?',
    answerRo: 'Acceptăm retururi în termen de 14 zile de la primirea produsului. Produsul trebuie să fie neutilizat și în ambalajul original. Contactează-ne la office@vaiavita.com pentru a iniția un retur.',
    answerEn: 'We accept returns within 14 days of receiving the product. The product must be unused and in its original packaging. Contact us at office@vaiavita.com to initiate a return.',
  },
  {
    questionRo: 'Unde sunteți localizați?',
    questionEn: 'Where are you located?',
    answerRo: 'VAIAVITA S.R.L. este o companie înregistrată în Brașov, România (CUI 49945945, J8/1310/2024). Suntem importator de produse premium pentru sănătate orală din surse internaționale.',
    answerEn: 'VAIAVITA S.R.L. is a company registered in Brașov, Romania (CUI 49945945, J8/1310/2024). We are an importer of premium oral health products from international sources.',
  },
  {
    questionRo: 'Produsele sunt testate dermatologic?',
    questionEn: 'Are the products dermatologically tested?',
    answerRo: 'Da, produsele noastre sunt certificate și testate conform standardelor internaționale. Ingredientele sunt aprobate USFDA și UKFDA, cu eficiență confirmată în studii clinice. Nu conțin substanțe chimice agresive.',
    answerEn: 'Yes, our products are certified and tested according to international standards. The ingredients are USFDA and UKFDA approved, with efficacy confirmed in clinical studies. They contain no aggressive chemicals.',
  },
  {
    questionRo: 'Pot comanda și din afara României?',
    questionEn: 'Can I order from outside Romania?',
    answerRo: 'Momentan, livrăm doar pe teritoriul României. Pentru întrebări legate de comenzi internaționale, contactează-ne la office@vaiavita.com și vom încerca să găsim o soluție.',
    answerEn: 'Currently, we only deliver within Romania. For questions about international orders, contact us at office@vaiavita.com and we will try to find a solution.',
  },
  {
    questionRo: 'Cum pot plăti?',
    questionEn: 'How can I pay?',
    answerRo: 'Acceptăm plata cu cardul (prin Stripe, procesor securizat de plăți) și plata ramburs (la primirea coletului). Toate tranzacțiile cu cardul sunt criptate și sigure.',
    answerEn: 'We accept card payments (via Stripe, a secure payment processor) and cash on delivery. All card transactions are encrypted and secure.',
  },
];

export function FAQSection() {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.questionRo,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answerRo,
      },
    })),
  };

  return (
    <section className="section-padding bg-secondary/30">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <div className="container-custom">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl tracking-wide text-center mb-4 opacity-0 animate-fade-up">
            {language === 'ro' ? 'ÎNTREBĂRI FRECVENTE' : 'FREQUENTLY ASKED QUESTIONS'}
          </h2>
          <p className="text-center text-muted-foreground mb-10 opacity-0 animate-fade-up animation-delay-100">
            {language === 'ro'
              ? 'Răspunsuri la cele mai comune întrebări despre produsele și serviciile VAIAVITA.'
              : 'Answers to the most common questions about VAIAVITA products and services.'}
          </p>

          <div className="space-y-3 opacity-0 animate-fade-up animation-delay-200">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="card-premium overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left gap-4"
                  >
                    <span className="font-medium text-sm md:text-base">
                      {language === 'ro' ? faq.questionRo : faq.questionEn}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 text-primary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'}`}
                  >
                    <p className="px-5 text-muted-foreground text-sm leading-relaxed">
                      {language === 'ro' ? faq.answerRo : faq.answerEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
