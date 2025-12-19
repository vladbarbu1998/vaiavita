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

const Index = () => {
  return (
    <MainLayout showBreadcrumbs={false}>
      <HeroSection />
      <USPSection />
      <FeaturedProductSection />
      <PartnersSection />
      <QivaroSection />
      <WhyChooseUsSection />
      <GoogleReviewsSection />
      <ContactTeaserSection />
    </MainLayout>
  );
};

export default Index;
