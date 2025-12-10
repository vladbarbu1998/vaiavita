import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const faqResponses: Record<string, { ro: string; en: string }> = {
  livrare: {
    ro: 'Livrăm în toată România prin curier rapid. Timpul de livrare este de 1-3 zile lucrătoare. Pentru comenzi peste 150 lei, livrarea este gratuită!',
    en: 'We deliver throughout Romania via express courier. Delivery time is 1-3 business days. For orders over 150 lei, shipping is free!',
  },
  plata: {
    ro: 'Acceptăm plată cu cardul (Stripe), Netopia și ramburs la livrare. Toate plățile sunt securizate.',
    en: 'We accept card payment (Stripe), Netopia and cash on delivery. All payments are secure.',
  },
  retur: {
    ro: 'Oferim 14 zile pentru returnarea produselor nedesfăcute. Contactați-ne la office@vaiavita.com pentru a iniția un retur.',
    en: 'We offer 14 days for returning unopened products. Contact us at office@vaiavita.com to initiate a return.',
  },
  produs: {
    ro: 'Dent-Tastic este pasta noastră de dinți premium, cu formulă patentată în SUA. Conține quercetin și paeoniflorin pentru sănătatea gingiilor. Preț: 29,99 lei.',
    en: 'Dent-Tastic is our premium toothpaste with a USA patented formula. It contains quercetin and paeoniflorin for gum health. Price: 29.99 lei.',
  },
  default: {
    ro: 'Vă mulțumim pentru mesaj! Pentru întrebări specifice, vă rugăm să ne contactați la office@vaiavita.com sau scrieți "agent" pentru a vorbi cu un reprezentant.',
    en: 'Thank you for your message! For specific questions, please contact us at office@vaiavita.com or type "agent" to speak with a representative.',
  },
};

const escalationKeywords = ['agent', 'suport', 'reprezentant', 'vreau să vorbesc', 'om', 'persoana', 'help', 'support'];

export function ChatWidget() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isEscalated, setIsEscalated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'bot',
        content: language === 'ro' 
          ? 'Bună! 👋 Sunt asistentul virtual VAIAVITA. Cum te pot ajuta? Poți întreba despre livrare, plată, retururi sau produse.'
          : 'Hello! 👋 I\'m the VAIAVITA virtual assistant. How can I help you? You can ask about delivery, payment, returns or products.',
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (escalationKeywords.some(kw => lowerMessage.includes(kw))) {
      setIsEscalated(true);
      return language === 'ro'
        ? 'Am înțeles că dorești să vorbești cu un reprezentant. Te rog să ne lași adresa de email și te vom contacta în cel mai scurt timp posibil. Poți de asemenea să ne scrii la office@vaiavita.com.'
        : 'I understand you want to speak with a representative. Please leave your email address and we will contact you as soon as possible. You can also email us at office@vaiavita.com.';
    }
    
    if (lowerMessage.includes('livr') || lowerMessage.includes('ship') || lowerMessage.includes('delivery')) {
      return faqResponses.livrare[language];
    }
    if (lowerMessage.includes('plat') || lowerMessage.includes('pay') || lowerMessage.includes('card')) {
      return faqResponses.plata[language];
    }
    if (lowerMessage.includes('retur') || lowerMessage.includes('return')) {
      return faqResponses.retur[language];
    }
    if (lowerMessage.includes('produs') || lowerMessage.includes('dent') || lowerMessage.includes('pasta') || lowerMessage.includes('product')) {
      return faqResponses.produs[language];
    }
    
    return faqResponses.default[language];
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: getBotResponse(input),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 500);
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center ${isOpen ? 'hidden' : ''}`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] h-[500px] max-h-[calc(100vh-6rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold">VAIAVITA</h3>
                <p className="text-xs opacity-80">{language === 'ro' ? 'Asistent virtual' : 'Virtual assistant'}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-primary-foreground/20 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={language === 'ro' ? 'Scrie un mesaj...' : 'Type a message...'}
                className="flex-1 px-4 py-2.5 rounded-full bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button type="submit" size="icon" className="rounded-full shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
