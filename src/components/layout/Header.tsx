import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, ShoppingCart, Sun, Moon, Globe, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { useCurrency, currencies } from '@/context/CurrencyContext';
import logoDark from '@/assets/logo-dark.png';
import logoDarkChristmas from '@/assets/logo-dark-christmas.png';
import logoLight from '@/assets/logo-light.png';
import logoLightNew from '@/assets/logo-light-new.png';
import logoLightChristmas from '@/assets/logo-light-christmas.png';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { totalItems } = useCart();
  const { currency, setCurrency } = useCurrency();

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/despre', label: t('nav.about') },
    { href: '/produse', label: t('nav.products') },
    { href: '/contact', label: t('nav.contact') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="container-custom">
        <div className="flex h-18 items-center justify-between py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center transition-transform hover:scale-105">
            <img 
              src={theme === 'dark' ? logoDarkChristmas : logoLightChristmas} 
              alt="VAIAVITA" 
              className="h-11 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="nav-link py-1"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'ro' ? 'en' : 'ro')}
              className="relative rounded-full hover:bg-primary/10"
            >
              <Globe className="h-5 w-5" />
              <span className="absolute -bottom-0.5 right-0.5 text-[9px] font-bold uppercase text-primary">
                {language}
              </span>
            </Button>

            {/* Currency Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full hover:bg-primary/10"
                >
                  <Coins className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 right-0.5 text-[9px] font-bold text-primary">
                    {currency === 'RON' ? 'lei' : currencies.find(c => c.code === currency)?.symbol}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currencies.map((c) => (
                  <DropdownMenuItem 
                    key={c.code} 
                    onClick={() => setCurrency(c.code)}
                    className={currency === c.code ? 'bg-primary/10' : ''}
                  >
                    {c.symbol} {c.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              className="rounded-full hover:bg-primary/10"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="icon" asChild className="relative rounded-full hover:bg-primary/10">
              <Link to="/cos">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shadow-md">
                    {totalItems}
                  </span>
                )}
              </Link>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden py-6 border-t border-border/30 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-base font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all py-3 px-4 rounded-xl"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
