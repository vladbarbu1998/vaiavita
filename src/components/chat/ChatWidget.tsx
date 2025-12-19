import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2, Phone, Mail, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import chatbotAvatar from '@/assets/chatbot-avatar.jpg';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface SupportForm {
  name: string;
  phone: string;
  email: string;
  message: string;
}

// Parse markdown-like formatting to HTML
const formatMessage = (text: string): string => {
  let formatted = text
    // Bold: **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    // Links: [text](url) - make them clickable
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:no-underline">$1</a>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>')
    // Bullet lists: lines starting with - or *
    .replace(/^[-*]\s+(.+)$/gm, '<li class="ml-4">• $1</li>');
  
  // Wrap in paragraph if not already
  if (!formatted.startsWith('<')) {
    formatted = `<p>${formatted}</p>`;
  }
  
  return formatted;
};

// Detect if user wants live agent
const wantsLiveAgent = (message: string): boolean => {
  const triggers = [
    'agent live', 'live agent', 'agent uman', 'om real', 'persoana reala',
    'vreau să vorbesc cu cineva', 'vorbesc cu un om', 'suport live',
    'human agent', 'real person', 'talk to someone', 'live support'
  ];
  const lowerMessage = message.toLowerCase().trim();
  return triggers.some(trigger => lowerMessage.includes(trigger));
};

export function ChatWidget() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [supportForm, setSupportForm] = useState<SupportForm>({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'bot',
        content: language === 'ro' 
          ? 'Bună! 👋 Sunt asistentul virtual VAIAVITA. Cum te pot ajuta?\n\nPoți întreba despre produsele noastre, livrare, plată sau retururi.'
          : 'Hello! 👋 I\'m the VAIAVITA virtual assistant. How can I help you?\n\nYou can ask about our products, delivery, payment or returns.',
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showSupportForm]);

  const handleSupportFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supportForm.name || !supportForm.email || !supportForm.message) {
      toast.error(language === 'ro' ? 'Completează toate câmpurile obligatorii' : 'Please fill all required fields');
      return;
    }

    setIsSubmittingForm(true);

    try {
      // Build conversation transcript
      const transcript = messages
        .map(msg => `${msg.role === 'user' ? 'Client' : 'Bot'}: ${msg.content}`)
        .join('\n\n');

      const { error } = await supabase.functions.invoke('send-support-request', {
        body: {
          name: supportForm.name,
          phone: supportForm.phone,
          email: supportForm.email,
          message: supportForm.message,
          transcript,
          language,
          user_agent: navigator.userAgent
        }
      });

      if (error) throw error;

      setShowSupportForm(false);
      setSupportForm({ name: '', phone: '', email: '', message: '' });

      const confirmMessage: Message = {
        id: Date.now().toString(),
        role: 'bot',
        content: language === 'ro'
          ? '✅ Mulțumesc! Am primit cererea ta.\n\nUn coleg din echipa noastră te va contacta în cel mai scurt timp pe email sau telefon.\n\nÎntre timp, pot să te ajut cu altceva?'
          : '✅ Thank you! We\'ve received your request.\n\nA team member will contact you shortly via email or phone.\n\nIn the meantime, can I help you with anything else?',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMessage]);

      toast.success(language === 'ro' ? 'Cererea a fost trimisă!' : 'Request sent successfully!');
    } catch (error) {
      console.error('Support request error:', error);
      toast.error(language === 'ro' ? 'A apărut o eroare. Încearcă din nou.' : 'An error occurred. Please try again.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    // Check if user wants live agent
    if (wantsLiveAgent(currentInput)) {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: language === 'ro'
          ? 'Sigur! 😊 Te punem în legătură cu un coleg din echipa noastră.\n\nTe rog completează formularul de mai jos și te vom contacta cât de curând posibil.'
          : 'Of course! 😊 We\'ll connect you with a team member.\n\nPlease fill out the form below and we\'ll contact you as soon as possible.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentResponse]);
      setShowSupportForm(true);
      return;
    }

    setIsLoading(true);

    try {
      // Prepare conversation history (exclude the welcome message)
      const conversationHistory = messages
        .filter(msg => msg.id !== '1')
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: {
          message: currentInput,
          language,
          conversationHistory
        }
      });

      if (error) throw error;

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: data.reply || (language === 'ro' 
          ? 'Îmi pare rău, nu am putut procesa cererea.'
          : 'Sorry, I could not process the request.'),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: language === 'ro'
          ? 'Îmi pare rău, a apărut o eroare. Te rog să încerci din nou sau contactează-ne la office@vaiavita.com.'
          : 'Sorry, an error occurred. Please try again or contact us at office@vaiavita.com.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
              <img 
                src={chatbotAvatar} 
                alt="VAIAVITA" 
                className="h-10 w-10 rounded-full object-cover"
              />
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
                {msg.role === 'user' ? (
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-primary/10 text-primary">
                    <User className="w-4 h-4" />
                  </div>
                ) : (
                  <img 
                    src={chatbotAvatar} 
                    alt="Bot" 
                    className="w-8 h-8 rounded-full shrink-0 object-cover"
                  />
                )}
                <div 
                  className={`max-w-[75%] p-3 rounded-2xl text-sm break-words overflow-hidden ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  dangerouslySetInnerHTML={{ __html: msg.role === 'bot' ? formatMessage(msg.content) : msg.content }}
                />
              </div>
            ))}

            {/* Support Form */}
            {showSupportForm && (
              <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-primary" />
                  {language === 'ro' ? 'Contactează echipa' : 'Contact the team'}
                </h4>
                <form onSubmit={handleSupportFormSubmit} className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">{language === 'ro' ? 'Nume *' : 'Name *'}</label>
                    <input
                      type="text"
                      value={supportForm.name}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder={language === 'ro' ? 'Numele tău' : 'Your name'}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {language === 'ro' ? 'Telefon' : 'Phone'}
                    </label>
                    <input
                      type="tel"
                      value={supportForm.phone}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="07xx xxx xxx"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email *
                    </label>
                    <input
                      type="email"
                      value={supportForm.email}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="email@exemplu.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">{language === 'ro' ? 'Mesaj *' : 'Message *'}</label>
                    <textarea
                      value={supportForm.message}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      rows={2}
                      placeholder={language === 'ro' ? 'Cu ce te putem ajuta?' : 'How can we help you?'}
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowSupportForm(false)}
                    >
                      {language === 'ro' ? 'Anulează' : 'Cancel'}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="flex-1"
                      disabled={isSubmittingForm}
                    >
                      {isSubmittingForm ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        language === 'ro' ? 'Trimite' : 'Send'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {isLoading && (
              <div className="flex gap-2">
                <img 
                  src={chatbotAvatar} 
                  alt="Bot" 
                  className="w-8 h-8 rounded-full shrink-0 object-cover"
                />
                <div className="max-w-[75%] p-3 rounded-2xl text-sm bg-muted rounded-bl-md flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-muted-foreground">
                    {language === 'ro' ? 'Se scrie...' : 'Typing...'}
                  </span>
                </div>
              </div>
            )}
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
                disabled={isLoading || showSupportForm}
              />
              <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={isLoading || !input.trim() || showSupportForm}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}