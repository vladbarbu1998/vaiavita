import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export function ChatWidget() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'bot',
        content: language === 'ro' 
          ? 'Bună! 👋 Sunt asistentul virtual VAIAVITA. Cum te pot ajuta? Poți întreba despre produsele noastre, livrare, plată sau retururi.'
          : 'Hello! 👋 I\'m the VAIAVITA virtual assistant. How can I help you? You can ask about our products, delivery, payment or returns.',
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
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
          message: input,
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
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-muted text-muted-foreground">
                  <Bot className="w-4 h-4" />
                </div>
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
                disabled={isLoading}
              />
              <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
