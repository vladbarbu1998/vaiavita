import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';
import anpcBadge from '@/assets/anpc-badge.png';

export function Footer() {
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Link to="/">
              <img 
                src={theme === 'dark' ? logoLight : logoDark} 
                alt="VAIAVITA" 
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {language === 'ro' 
                ? 'Produse premium pentru sănătate și vitalitate, selectate riguros din SUA și Hong Kong.'
                : 'Premium health and vitality products, carefully selected from the USA and Hong Kong.'}
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h4 className="font-display text-lg tracking-wide">{language === 'ro' ? 'Navigare' : 'Navigation'}</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/despre" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('nav.about')}
              </Link>
              <Link to="/produse" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('nav.products')}
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('nav.contact')}
              </Link>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h4 className="font-display text-lg tracking-wide">{language === 'ro' ? 'Legal' : 'Legal'}</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/politica-confidentialitate" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.privacy')}
              </Link>
              <Link to="/termeni-si-conditii" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.terms')}
              </Link>
              <Link to="/politica-cookie-uri" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {t('footer.cookies')}
              </Link>
            </nav>
          </div>

          {/* Company Info */}
          <div className="space-y-4">
            <h4 className="font-display text-lg tracking-wide">{language === 'ro' ? 'Contact' : 'Contact'}</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>VAIAVITA S.R.L.</p>
              <p>CUI 49945945</p>
              <p>Reg. Com. J8/1310/2024</p>
              <p className="pt-2">
                <a href="mailto:office@vaiavita.com" className="hover:text-primary transition-colors">
                  office@vaiavita.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* ANPC Badge & Copyright */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a 
              href="https://anpc.ro/ce-ستي-anpc/s-sol/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 transition-opacity"
            >
              <img src={anpcBadge} alt="ANPC" className="h-12" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            © {currentYear} VAIAVITA S.R.L. {language === 'ro' ? 'Toate drepturile rezervate.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
