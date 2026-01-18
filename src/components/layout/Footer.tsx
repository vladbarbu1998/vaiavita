import { Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Mail, MapPin, Phone } from 'lucide-react';
import logoDark from '@/assets/logo-dark.png';
import logoDarkChristmas from '@/assets/logo-dark-christmas.png';
import logoLight from '@/assets/logo-light.png';
import logoLightNew from '@/assets/logo-light-new.png';
import logoLightChristmas from '@/assets/logo-light-christmas.png';
import anpcSalBadge from '@/assets/anpc-sal-badge.png';
import anpcSolBadge from '@/assets/anpc-sol-badge.png';

export function Footer() {
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border/30 bg-gradient-to-b from-muted/30 to-muted/60">
      {/* Decorative wave top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="container-custom py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Logo & Description */}
          <div className="space-y-5">
            <Link to="/" className="inline-block transition-transform hover:scale-105">
              <img 
                src={theme === 'dark' ? logoLight : logoLightNew} 
                alt="VAIAVITA" 
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {language === 'ro' 
                ? 'Produse premium pentru sănătate și vitalitate, fabricate în SUA.'
                : 'Premium health and vitality products, manufactured in the USA.'}
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-5">
            <h4 className="font-display text-lg font-semibold tracking-wide">{language === 'ro' ? 'Navigare' : 'Navigation'}</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/despre" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200">
                {t('nav.about')}
              </Link>
              <Link to="/produse" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200">
                {t('nav.products')}
              </Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200">
                {t('nav.contact')}
              </Link>
            </nav>
          </div>

          {/* Legal Links */}
          <div className="space-y-5">
            <h4 className="font-display text-lg font-semibold tracking-wide">{language === 'ro' ? 'Legal' : 'Legal'}</h4>
            <nav className="flex flex-col gap-3">
              <Link to="/politica-confidentialitate" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200">
                {t('footer.privacy')}
              </Link>
              <Link to="/termeni-si-conditii" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200">
                {t('footer.terms')}
              </Link>
              <Link to="/politica-cookie-uri" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200">
                {t('footer.cookies')}
              </Link>
              <Link to="/politica-retur" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200">
                {language === 'ro' ? 'Politica de Retur' : 'Return Policy'}
              </Link>
              <Link to="/politica-livrare" className="text-sm text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200">
                {language === 'ro' ? 'Politica de Livrare' : 'Delivery Policy'}
              </Link>
            </nav>
          </div>

          {/* Company Info */}
          <div className="space-y-5">
            <h4 className="font-display text-lg font-semibold tracking-wide">{language === 'ro' ? 'Contact' : 'Contact'}</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <a href="tel:0732111117" className="hover:text-primary transition-colors">
                  0732 111 117
                </a>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <a href="mailto:office@vaiavita.com" className="hover:text-primary transition-colors">
                  office@vaiavita.com
                </a>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p>VAIAVITA S.R.L.</p>
                  <p>CUI 49945945</p>
                  <p>Reg. Com. J8/1310/2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ANPC Badge & Copyright */}
        <div className="mt-14 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <a 
              href="https://anpc.ro/ce-este-sal" 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 transition-opacity"
            >
              <img src={anpcSalBadge} alt="ANPC - Soluționarea Alternativă a Litigiilor" className="h-8 sm:h-12" />
            </a>
            <a 
              href="https://ec.europa.eu/consumers/odr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 transition-opacity"
            >
              <img src={anpcSolBadge} alt="Soluționarea Online a Litigiilor" className="h-8 sm:h-12" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground text-center md:text-right">
            © {currentYear} VAIAVITA S.R.L. {language === 'ro' ? 'Toate drepturile rezervate.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
