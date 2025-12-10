import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Currency = 'RON' | 'EUR' | 'USD' | 'GBP';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceInRon: number) => string;
  convertPrice: (priceInRon: number) => number;
}

// Approximate exchange rates (RON base)
const exchangeRates: Record<Currency, number> = {
  RON: 1,
  EUR: 0.20, // 1 RON = ~0.20 EUR
  USD: 0.22, // 1 RON = ~0.22 USD
  GBP: 0.17, // 1 RON = ~0.17 GBP
};

const currencySymbols: Record<Currency, string> = {
  RON: 'lei',
  EUR: '€',
  USD: '$',
  GBP: '£',
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Detect user's preferred currency based on locale/timezone
const detectUserCurrency = (): Currency => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = navigator.language || 'ro-RO';
    
    // Romania
    if (timezone.includes('Bucharest') || locale.startsWith('ro')) {
      return 'RON';
    }
    
    // UK
    if (timezone.includes('London') || locale.startsWith('en-GB')) {
      return 'GBP';
    }
    
    // US
    if (timezone.includes('America') || locale.startsWith('en-US')) {
      return 'USD';
    }
    
    // European countries (simplified)
    const euroTimezones = ['Berlin', 'Paris', 'Madrid', 'Rome', 'Amsterdam', 'Brussels', 'Vienna', 'Warsaw'];
    if (euroTimezones.some(tz => timezone.includes(tz))) {
      return 'EUR';
    }
    
    // Default to RON for Romanian store
    return 'RON';
  } catch {
    return 'RON';
  }
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('vaiavita-currency');
    return (saved as Currency) || detectUserCurrency();
  });

  useEffect(() => {
    localStorage.setItem('vaiavita-currency', currency);
  }, [currency]);

  const convertPrice = (priceInRon: number): number => {
    return priceInRon * exchangeRates[currency];
  };

  const formatPrice = (priceInRon: number): string => {
    const converted = convertPrice(priceInRon);
    
    if (currency === 'RON') {
      return `${converted.toFixed(2)} ${currencySymbols[currency]}`;
    }
    
    // For other currencies, symbol goes before
    if (currency === 'EUR') {
      return `${converted.toFixed(2)} ${currencySymbols[currency]}`;
    }
    
    return `${currencySymbols[currency]}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatPrice,
      convertPrice,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

export const currencies: { code: Currency; label: string; symbol: string }[] = [
  { code: 'RON', label: 'Lei (RON)', symbol: 'lei' },
  { code: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { code: 'USD', label: 'Dollar (USD)', symbol: '$' },
  { code: 'GBP', label: 'Pound (GBP)', symbol: '£' },
];
