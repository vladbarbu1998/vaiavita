import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Settings, Cookie } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Extend window type for analytics
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = "vaiavita_cookie_consent";

const CookieBanner = () => {
  const { language } = useLanguage();
  const isRo = language === 'ro';
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else {
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
      loadScripts(savedPreferences);
    }
  }, []);

  const loadScripts = (prefs: CookiePreferences) => {
    // Load Google Analytics 4 if consented
    if (prefs.analytics && !window.gtag) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-1FVH88QWJ5';
      document.head.appendChild(script);
      
      script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
          window.dataLayer.push(args);
        }
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', 'G-1FVH88QWJ5');
      };
    }
    
    // Load Meta Pixel if marketing consented
    if (prefs.marketing && !window.fbq) {
      // Meta Pixel initialization
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      
      window.fbq('init', '24769777672702052');
      window.fbq('track', 'PageView');
    }
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    loadScripts(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
  };

  const acceptNecessary = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
  };

  const saveCustom = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t border-border shadow-lg animate-in slide-in-from-bottom duration-300">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground leading-relaxed">
                  {isRo 
                    ? "Folosim cookie-uri pentru a îmbunătăți experiența ta pe site. Cookie-urile necesare sunt activate implicit. Poți alege să accepți toate cookie-urile sau să le personalizezi."
                    : "We use cookies to improve your experience on our site. Necessary cookies are enabled by default. You can choose to accept all cookies or customize them."
                  }
                  {" "}
                  <Link to="/politica-cookie-uri" className="text-primary hover:underline">
                    {isRo ? "Află mai multe" : "Learn more"}
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {isRo ? "Setări" : "Settings"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={acceptNecessary}
              >
                {isRo ? "Doar necesare" : "Necessary only"}
              </Button>
              <Button
                size="sm"
                onClick={acceptAll}
              >
                {isRo ? "Accept toate" : "Accept all"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              {isRo ? "Setări Cookie-uri" : "Cookie Settings"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="font-semibold">
                  {isRo ? "Cookie-uri necesare" : "Necessary Cookies"}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRo 
                    ? "Esențiale pentru funcționarea site-ului. Nu pot fi dezactivate."
                    : "Essential for website functionality. Cannot be disabled."
                  }
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="font-semibold">
                  {isRo ? "Cookie-uri analitice" : "Analytical Cookies"}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRo 
                    ? "Ne ajută să înțelegem cum folosești site-ul pentru a-l îmbunătăți."
                    : "Help us understand how you use the site to improve it."
                  }
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))}
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="font-semibold">
                  {isRo ? "Cookie-uri de marketing" : "Marketing Cookies"}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRo 
                    ? "Folosite pentru a-ți afișa reclame relevante."
                    : "Used to display relevant ads to you."
                  }
                </p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, marketing: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={acceptNecessary}>
              {isRo ? "Doar necesare" : "Necessary only"}
            </Button>
            <Button onClick={saveCustom}>
              {isRo ? "Salvează preferințele" : "Save preferences"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieBanner;
