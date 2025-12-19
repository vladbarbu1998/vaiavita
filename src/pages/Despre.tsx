import { MainLayout } from '@/components/layout';
import { useLanguage } from '@/context/LanguageContext';
import { GoogleReviewsSection } from '@/components/home';
import despreImage from '@/assets/despre.webp';
import dentalmedLogo from '@/assets/dentalmed-logo.png';

const Despre = () => {
  const { language } = useLanguage();

  return (
    <MainLayout>
      {/* Hero Banner */}
      <section className="gradient-animated py-16 md:py-24">
        <div className="container-custom">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide text-center opacity-0 animate-fade-up">
            {language === 'ro' ? 'DESPRE NOI' : 'ABOUT US'}
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 opacity-0 animate-fade-up">
              <h2 className="font-display text-3xl md:text-4xl tracking-wide">
                VAIAVITA – {language === 'ro' ? 'Cine suntem?' : 'Who are we?'}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                {language === 'ro' ? (
                  <>
                    <p>La VAIAVITA, credem că excelența nu trebuie să aibă granițe. Ne-am propus să transformăm piața din România prin aducerea unor produse rare, exclusiviste, de la branduri internaționale. Îți oferim acces la formule avansate și soluții inovatoare, disponibile până acum doar pe piețe de elită.</p>
                    <p>VAIAVITA este poarta ta către inovație, calitate și rafinament. Selectăm cu grijă fiecare brand și produs, pentru a-ți aduce nu doar lux, ci lux cu sens.</p>
                    <p>Filosofia noastră este simplă: luxul autentic înseamnă funcționalitate, utilitate și impact real asupra vieții tale. Produsele noastre îmbină designul elegant cu performanța remarcabilă, oferindu-ți o experiență premium în fiecare zi.</p>
                    <p>Prin VAIAVITA, intri într-un univers curat, select și inovator, unde fiecare alegere devine o investiție în tine. Suntem mai mult decât un furnizor – suntem curatorii unui stil de viață trăit cu echilibru, rafinament și standarde înalte.</p>
                  </>
                ) : (
                  <>
                    <p>At VAIAVITA, we believe that excellence should have no boundaries. We set out to transform the Romanian market by bringing rare, exclusive products from international brands. We offer you access to advanced formulas and innovative solutions, previously available only in elite markets.</p>
                    <p>VAIAVITA is your gateway to innovation, quality and refinement. We carefully select each brand and product to bring you not just luxury, but luxury with meaning.</p>
                    <p>Our philosophy is simple: authentic luxury means functionality, usefulness and real impact on your life. Our products combine elegant design with remarkable performance, offering you a premium experience every day.</p>
                    <p>Through VAIAVITA, you enter a clean, select and innovative universe, where every choice becomes an investment in yourself. We are more than a supplier – we are curators of a lifestyle lived with balance, refinement and high standards.</p>
                  </>
                )}
              </div>
            </div>
            <div className="opacity-0 animate-fade-up animation-delay-200">
              <img 
                src={despreImage} 
                alt="VAIAVITA Products" 
                className="w-full max-w-md mx-auto rounded-3xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="section-padding bg-secondary/30">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto opacity-0 animate-fade-up">
            <h2 className="font-display text-3xl md:text-4xl tracking-wide text-center mb-8">
              {language === 'ro' ? 'PARTENERII NOȘTRI' : 'OUR PARTNERS'}
            </h2>
            
            <div className="card-premium p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-32 md:w-40 shrink-0 p-4 bg-white rounded-xl">
                  <img 
                    src={dentalmedLogo} 
                    alt="DentalMed Com Brașov" 
                    className="w-full h-auto object-contain"
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="font-display text-xl md:text-2xl tracking-wide">
                    DentalMed Com Brașov
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === 'ro' 
                      ? 'DentalMed Com Brașov este unul dintre partenerii noștri de încredere în domeniul stomatologiei moderne. Clinica oferă servicii stomatologice complete, realizate de o echipă cu peste 25 de ani de experiență, recunoscută pentru profesionalism, grijă față de pacient și rezultate de înaltă calitate.'
                      : 'DentalMed Com Brașov is one of our trusted partners in the field of modern dentistry. The clinic offers comprehensive dental services, delivered by a team with over 25 years of experience, recognized for professionalism, patient care, and high-quality results.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <a 
                      href="https://maps.app.goo.gl/TyE5CozicKWBfeK9A?g_st=ic"
                      target="_blank"
                      rel="noopener noreferrer"
                      referrerPolicy="no-referrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      <span>📍</span>
                      Str. Lungă nr. 14, Brașov
                      <span className="text-xs">↗</span>
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ro'
                      ? 'Poți ridica produsele VAIAVITA de la clinica DentalMed - disponibil la checkout pentru județul Brașov.'
                      : 'You can pick up VAIAVITA products from DentalMed clinic - available at checkout for Brașov county.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Google Reviews */}
      <GoogleReviewsSection />
    </MainLayout>
  );
};

export default Despre;
