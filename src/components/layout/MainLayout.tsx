import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Breadcrumbs } from './Breadcrumbs';

interface MainLayoutProps {
  children: ReactNode;
  showBreadcrumbs?: boolean;
}

export function MainLayout({ children, showBreadcrumbs = true }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {showBreadcrumbs && (
          <div className="container-custom">
            <Breadcrumbs />
          </div>
        )}
        {children}
      </main>
      <Footer />
    </div>
  );
}
