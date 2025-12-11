import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';

interface MainLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
  breadcrumbItems?: BreadcrumbItem[];
}

export function MainLayout({ children, showBreadcrumbs = true, breadcrumbItems }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {showBreadcrumbs && (
          <div className="container-custom">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
}
