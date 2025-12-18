import { useState, useEffect, useRef } from 'react';
import { getTrackingInfo } from '@/hooks/useIpTracking';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

declare global {
  interface Window {
    grecaptcha: {
      render: (container: string | HTMLElement, parameters: {
        sitekey: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        theme?: 'light' | 'dark';
      }) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
      ready: (callback: () => void) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

const Contact = () => {
  const { language } = useLanguage();
  const isRo = language === 'ro';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState<string | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaWidgetId, setRecaptchaWidgetId] = useState<number | null>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
    gdprConsent: false,
  });

  // Fetch IP address on mount
  useEffect(() => {
    getTrackingInfo().then(info => {
      setIpAddress(info.ip_address);
    });
  }, []);

  // Fetch reCAPTCHA site key and load script
  useEffect(() => {
    const loadRecaptcha = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-recaptcha-site-key');
        if (error || !data?.siteKey) {
          console.error('Failed to get reCAPTCHA site key:', error);
          return;
        }
        
        setRecaptchaSiteKey(data.siteKey);
        
        // Load reCAPTCHA v2 script if not already loaded
        if (!document.querySelector('script[src*="recaptcha/api.js"]')) {
          window.onRecaptchaLoad = () => {
            console.log('reCAPTCHA script loaded');
            setRecaptchaReady(true);
          };
          
          const script = document.createElement('script');
          script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        } else if (window.grecaptcha?.render) {
          // Script already loaded
          setRecaptchaReady(true);
        }
      } catch (err) {
        console.error('Error loading reCAPTCHA:', err);
      }
    };
    
    loadRecaptcha();
  }, []);

  // Render reCAPTCHA widget when everything is ready
  useEffect(() => {
    // Only render if we have all prerequisites and haven't rendered yet
    if (!recaptchaSiteKey || !recaptchaReady || recaptchaWidgetId !== null) {
      return;
    }
    
    const container = recaptchaContainerRef.current;
    if (!container) {
      return;
    }

    // Clear any existing content
    container.innerHTML = '';

    const renderWidget = () => {
      if (!window.grecaptcha?.render) {
        console.log('grecaptcha.render not available yet, retrying...');
        setTimeout(renderWidget, 200);
        return;
      }

      try {
        console.log('Rendering reCAPTCHA widget with sitekey:', recaptchaSiteKey);
        const widgetId = window.grecaptcha.render(container, {
          sitekey: recaptchaSiteKey,
          callback: (token: string) => {
            console.log('reCAPTCHA callback received token');
            setRecaptchaToken(token);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA token expired');
            setRecaptchaToken(null);
          },
          theme: 'light',
        });
        console.log('reCAPTCHA widget rendered with ID:', widgetId);
        setRecaptchaWidgetId(widgetId);
      } catch (err) {
        console.error('Error rendering reCAPTCHA:', err);
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(renderWidget, 100);
  }, [recaptchaSiteKey, recaptchaReady, recaptchaWidgetId]);

  const breadcrumbItems = [
    { label: isRo ? 'Contact' : 'Contact', labelEn: 'Contact', href: '/contact' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.gdprConsent) {
      toast.error(isRo ? 'Trebuie să acceptați politica de confidențialitate.' : 'You must accept the privacy policy.');
      return;
    }

    // Validate reCAPTCHA
    if (recaptchaSiteKey && !recaptchaToken) {
      toast.error(isRo ? 'Vă rugăm să completați verificarea reCAPTCHA.' : 'Please complete the reCAPTCHA verification.');
      return;
    }

    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error(isRo ? 'Completați toate câmpurile obligatorii.' : 'Please fill in all required fields.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(isRo ? 'Adresa de email nu este validă.' : 'Invalid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Capture IP and user agent
      const userAgent = navigator.userAgent;
      
      // Save to database with IP tracking
      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          subject: formData.subject.trim() || null,
          message: formData.message.trim(),
          language: language,
          user_agent: userAgent,
          ip_address: ipAddress,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save submission');
      }

      // Send emails via edge function with reCAPTCHA token
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          subject: formData.subject.trim() || null,
          message: formData.message.trim(),
          language: language,
          recaptchaToken: recaptchaToken,
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        // Don't fail the submission if email fails - the data is already saved
      }
      
      // Check if reCAPTCHA verification failed
      if (emailData && !emailData.success && emailData.error === 'reCAPTCHA verification failed') {
        toast.error(isRo ? 'Verificarea de securitate a eșuat. Încercați din nou.' : 'Security verification failed. Please try again.');
        // Reset reCAPTCHA
        if (recaptchaWidgetId !== null && window.grecaptcha) {
          window.grecaptcha.reset(recaptchaWidgetId);
          setRecaptchaToken(null);
        }
        return;
      }

      toast.success(isRo ? 'Mesaj trimis cu succes!' : 'Message sent successfully!', {
        description: isRo ? 'Vă vom contacta în cel mai scurt timp.' : 'We will contact you shortly.'
      });
      
      setFormData({ name: '', phone: '', email: '', subject: '', message: '', gdprConsent: false });
      
      // Reset reCAPTCHA after successful submission
      if (recaptchaWidgetId !== null && window.grecaptcha) {
        window.grecaptcha.reset(recaptchaWidgetId);
        setRecaptchaToken(null);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(isRo ? 'A apărut o eroare. Încercați din nou.' : 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout breadcrumbItems={breadcrumbItems}>
      <Helmet>
        <title>{isRo ? 'Contact | VAIAVITA' : 'Contact | VAIAVITA'}</title>
        <meta name="description" content={isRo 
          ? 'Contactează-ne pentru întrebări, sugestii sau colaborări. VAIAVITA - Vitalitate, Energie și Echilibru.' 
          : 'Contact us for questions, suggestions or collaborations. VAIAVITA - Vitality, Energy and Balance.'
        } />
      </Helmet>

      {/* Hero Banner */}
      <section className="gradient-animated py-16 md:py-24">
        <div className="container-custom">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl tracking-wide text-center opacity-0 animate-fade-up">
            CONTACT
          </h1>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8 opacity-0 animate-fade-up">
              <div>
                <h2 className="font-display text-3xl tracking-wide mb-4">
                  {isRo ? 'Contactează-ne' : 'Contact us'}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {isRo 
                    ? 'Dacă ai întrebări, sugestii sau vrei să colaborezi cu noi, nu ezita să ne contactezi! Suntem aici să îți oferim suport și să răspundem rapid la orice solicitare. Fie că ai nevoie de informații suplimentare sau vrei să descoperi mai multe despre serviciile noastre, te așteptăm să ne scrii.'
                    : 'If you have questions, suggestions or want to collaborate with us, don\'t hesitate to contact us! We are here to offer you support and respond quickly to any request. Whether you need additional information or want to discover more about our services, we are waiting for you to write to us.'}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{isRo ? 'Telefon' : 'Phone'}</h3>
                    <a href="tel:0732111117" className="text-primary hover:underline">
                      0732 111 117
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{isRo ? 'Adresă de mail' : 'Email address'}</h3>
                    <a href="mailto:office@vaiavita.com" className="text-primary hover:underline">
                      office@vaiavita.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{isRo ? 'Informații companie' : 'Company information'}</h3>
                    <div className="text-muted-foreground text-sm space-y-1">
                      <p>VAIAVITA S.R.L.</p>
                      <p>CUI 49945945</p>
                      <p>Reg. Com. J8/1310/2024</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="opacity-0 animate-fade-up animation-delay-200">
              <form onSubmit={handleSubmit} className="card-premium p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isRo ? 'Nume' : 'Name'} *
                    </label>
                    <Input
                      required
                      maxLength={100}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={isRo ? 'Numele dumneavoastră' : 'Your name'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isRo ? 'Telefon' : 'Phone'} *
                    </label>
                    <Input
                      type="tel"
                      required
                      maxLength={20}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={isRo ? 'Numărul de telefon' : 'Phone number'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isRo ? 'Adresă de mail' : 'Email address'} *
                    </label>
                    <Input
                      type="email"
                      required
                      maxLength={255}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={isRo ? 'email@exemplu.com' : 'email@example.com'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isRo ? 'Subiect' : 'Subject'}
                    </label>
                    <Input
                      maxLength={200}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder={isRo ? 'Subiectul mesajului' : 'Message subject'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {isRo ? 'Mesaj' : 'Message'} *
                    </label>
                    <Textarea
                      required
                      maxLength={2000}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={isRo ? 'Scrieți mesajul dumneavoastră aici...' : 'Write your message here...'}
                      rows={5}
                    />
                  </div>
                </div>

                {/* reCAPTCHA widget - always show container when site key is loaded */}
                <div className="space-y-2">
                  <div 
                    ref={recaptchaContainerRef}
                    className="flex justify-center items-center min-h-[78px] rounded-lg"
                    style={{ display: recaptchaSiteKey ? 'flex' : 'none' }}
                  />
                  {recaptchaSiteKey && !recaptchaReady && (
                    <div className="flex justify-center items-center min-h-[78px]">
                      <span className="text-sm text-muted-foreground">
                        {isRo ? 'Se încarcă verificarea...' : 'Loading verification...'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="gdpr"
                    checked={formData.gdprConsent}
                    onCheckedChange={(checked) => setFormData({ ...formData, gdprConsent: checked as boolean })}
                  />
                  <label htmlFor="gdpr" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    {isRo 
                      ? <>Am citit și sunt de acord cu <Link to="/politica-confidentialitate" className="text-primary hover:underline">Politica de confidențialitate</Link>. Datele personale vor fi prelucrate conform GDPR.</>
                      : <>I have read and agree to the <Link to="/politica-confidentialitate" className="text-primary hover:underline">Privacy Policy</Link>. Personal data will be processed in accordance with GDPR.</>
                    }
                  </label>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      {isRo ? 'Se trimite...' : 'Sending...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {isRo ? 'Trimite' : 'Send'}
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Contact;