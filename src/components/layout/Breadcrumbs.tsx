import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface BreadcrumbItem {
  label: string;
  labelEn?: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
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
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const location = useLocation();
  const { language } = useLanguage();

  if (location.pathname === '/') return null;

  // If custom items are provided, use them
  if (items && items.length > 0) {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Acasă', labelEn: 'Home', href: '/' },
      ...items,
    ];

    return (
      <nav aria-label="Breadcrumb" className="py-5">
        <ol className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
              {item.href ? (
                <Link
                  to={item.href}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  {index === 0 && <Home className="h-3.5 w-3.5" />}
                  <span className="hover:underline underline-offset-4">
                    {language === 'ro' ? item.label : (item.labelEn || item.label)}
                  </span>
                </Link>
              ) : (
                <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
                  {language === 'ro' ? item.label : (item.labelEn || item.label)}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  // Default auto-generated breadcrumbs
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
    <nav aria-label="Breadcrumb" className="py-5">
      <ol className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
            {item.href ? (
              <Link
                to={item.href}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                {index === 0 && <Home className="h-3.5 w-3.5" />}
                <span className="hover:underline underline-offset-4">{item.label}</span>
              </Link>
            ) : (
              <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
