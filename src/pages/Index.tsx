import { MainLayout } from '@/components/layout';
import {
  HeroSection,
  USPSection,
  FeaturedProductSection,
  QivaroSection,
  WhyChooseUsSection,
  GoogleReviewsSection,
  ContactTeaserSection,
} from '@/components/home';

const Index = () => {
  return (
    <MainLayout showBreadcrumbs={false}>
      <HeroSection />
      <USPSection />
      <FeaturedProductSection />
      <QivaroSection />
      <WhyChooseUsSection />
      <GoogleReviewsSection />
      <ContactTeaserSection />
    </MainLayout>
  );
};

export default Index;
