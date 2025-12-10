import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { Home } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <MainLayout showBreadcrumbs={false}>
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-md mx-auto space-y-6">
            <h1 className="font-display text-8xl text-primary">404</h1>
            <h2 className="font-display text-3xl tracking-wide">
              {language === 'ro' ? 'Pagină negăsită' : 'Page not found'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'ro' 
                ? 'Ne pare rău, pagina pe care o căutați nu există sau a fost mutată.'
                : 'Sorry, the page you are looking for does not exist or has been moved.'}
            </p>
            <Button variant="hero" size="lg" asChild>
              <Link to="/" className="inline-flex items-center gap-2">
                <Home className="w-4 h-4" />
                {language === 'ro' ? 'Înapoi acasă' : 'Back home'}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default NotFound;
