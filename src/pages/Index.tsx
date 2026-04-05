import { MainLayout } from '@/components/layout';
import {
  HeroSection,
  USPSection,
  FeaturedProductSection,
  QivaroSection,
  WhyChooseUsSection,
  GoogleReviewsSection,
  ContactTeaserSection,
  PartnersSection,
} from '@/components/home';
import { FAQSection } from '@/components/home/FAQSection';
import { SEOHead } from '@/components/seo/SEOHead';

const Index = () => {
  return (
    <MainLayout showBreadcrumbs={false}>
      <SEOHead
        title="VAIAVITA – Produse Premium pentru Sănătate Orală | Brașov"
        description="Descoperă produsele exclusive VAIAVITA din Brașov. Pastă de dinți naturală Dent-Tastic Fresh Mint, periuță bambus și suplimente premium pentru sănătate orală."
        url="/"
        speakable={{ cssSelector: ['.hero-speakable', 'h1'] }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          'name': 'VAIAVITA S.R.L.',
          'url': 'https://vaiavita.ro',
          'logo': 'https://vaiavita.ro/logo.png',
          'image': 'https://vaiavita.ro/og-image.jpg',
          'description': 'Importator produse premium pentru sănătate orală în Brașov, România. Pastă de dinți naturală, periuțe bambus și suplimente nutritive.',
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': 'Brașov',
            'addressCountry': 'RO',
          },
          'taxID': '49945945',
          'contactPoint': {
            '@type': 'ContactPoint',
            'email': 'office@vaiavita.com',
            'contactType': 'customer service',
            'availableLanguage': ['Romanian', 'English'],
          },
          'sameAs': [],
        }}
      />
      <HeroSection />
      <USPSection />
      <FeaturedProductSection />
      <PartnersSection />
      <QivaroSection />
      <WhyChooseUsSection />
      <GoogleReviewsSection />
      <FAQSection />
      <ContactTeaserSection />
    </MainLayout>
  );
};

export default Index;
