import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
  const { language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    gdprConsent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.gdprConsent) {
      toast({
        title: language === 'ro' ? 'Eroare' : 'Error',
        description: language === 'ro' ? 'Trebuie să acceptați politica de confidențialitate.' : 'You must accept the privacy policy.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: language === 'ro' ? 'Mesaj trimis!' : 'Message sent!',
      description: language === 'ro' ? 'Vă vom contacta în cel mai scurt timp.' : 'We will contact you shortly.',
    });
    
    setFormData({ name: '', phone: '', email: '', message: '', gdprConsent: false });
    setIsSubmitting(false);
  };

  return (
    <MainLayout>
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
                  {language === 'ro' ? 'Contactează-ne' : 'Contact us'}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {language === 'ro' 
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
                    <h3 className="font-medium mb-1">{language === 'ro' ? 'Telefon' : 'Phone'}</h3>
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
                    <h3 className="font-medium mb-1">{language === 'ro' ? 'Adresă de mail' : 'Email address'}</h3>
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
                    <h3 className="font-medium mb-1">{language === 'ro' ? 'Informații companie' : 'Company information'}</h3>
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
                      {language === 'ro' ? 'Nume' : 'Name'} *
                    </label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={language === 'ro' ? 'Numele dumneavoastră' : 'Your name'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ro' ? 'Telefon' : 'Phone'}
                    </label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={language === 'ro' ? 'Numărul de telefon' : 'Phone number'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ro' ? 'Adresă de mail' : 'Email address'} *
                    </label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={language === 'ro' ? 'email@exemplu.com' : 'email@example.com'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {language === 'ro' ? 'Mesaj' : 'Message'} *
                    </label>
                    <Textarea
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder={language === 'ro' ? 'Scrieți mesajul dumneavoastră aici...' : 'Write your message here...'}
                      rows={5}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="gdpr"
                    checked={formData.gdprConsent}
                    onCheckedChange={(checked) => setFormData({ ...formData, gdprConsent: checked as boolean })}
                  />
                  <label htmlFor="gdpr" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    {language === 'ro' 
                      ? 'Am citit și sunt de acord cu Politica de confidențialitate. Datele personale vor fi prelucrate conform GDPR.'
                      : 'I have read and agree to the Privacy Policy. Personal data will be processed in accordance with GDPR.'}
                  </label>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      {language === 'ro' ? 'Se trimite...' : 'Sending...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      {language === 'ro' ? 'Trimite' : 'Send'}
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
