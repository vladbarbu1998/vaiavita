import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeTranslations: Record<string, { ro: string; en: string }> = {
  despre: { ro: 'Despre', en: 'About' },
  produse: { ro: 'Produse', en: 'Products' },
  contact: { ro: 'Contact', en: 'Contact' },
  cos: { ro: 'Coș', en: 'Cart' },
  checkout: { ro: 'Finalizare comandă', en: 'Checkout' },
  'politica-confidentialitate': { ro: 'Politica de confidențialitate', en: 'Privacy Policy' },
  'termeni-si-conditii': { ro: 'Termeni și condiții', en: 'Terms and Conditions' },
  'politica-cookie-uri': { ro: 'Politica cookie-uri', en: 'Cookie Policy' },
  admin: { ro: 'Admin', en: 'Admin' },
  'dent-tastic': { ro: 'Pasta de dinți Dent-Tastic Fresh Mint', en: 'Dent-Tastic Fresh Mint Toothpaste' },
};

export function Breadcrumbs() {
  const location = useLocation();
  const { language, t } = useLanguage();

  if (location.pathname === '/') return null;

  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: language === 'ro' ? 'Acasă' : 'Home', href: '/' },
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const translation = routeTranslations[segment];
    const label = translation ? translation[language] : segment;
    
    breadcrumbs.push({
      label,
      href: index === pathSegments.length - 1 ? undefined : currentPath,
    });
  });

  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {item.href ? (
              <Link
                to={item.href}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                {index === 0 && <Home className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
