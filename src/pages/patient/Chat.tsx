import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { GoogleGenAI } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function MediBot() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      // Get context (latest report and latest prescriptions) from server
      let latestReport = null;
      let latestPrescription = null;
      try {
        const [reportsRes, prescriptionsRes] = await Promise.all([
          fetch(`/api/reports?patient_id=${profile?.id}`),
          fetch(`/api/prescriptions?patient_id=${profile?.id}`)
        ]);

        if (reportsRes.ok) {
          const reports = await reportsRes.json();
          latestReport = reports.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
        }

        if (prescriptionsRes.ok) {
          const prescriptions = await prescriptionsRes.json();
          latestPrescription = prescriptions.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
        }
      } catch (err) {
        console.error('Failed to fetch context:', err);
      }
      
      if (!process.env.GEMINI_API_KEY) {
        setMessages(prev => [...prev, { role: 'model', text: 'Gemini API Key is missing. Please add it to Settings > Secrets in AI Studio.' }]);
        setSending(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          {
            role: 'user',
            parts: [{ text: `You are MediBot, a helpful AI medical assistant. 
Patient: ${profile?.full_name}. 
Medical Context:
Latest Diagnosis: ${latestReport?.ai_diagnosis || 'None'}
Risk Level: ${latestReport?.ai_risk_level || 'None'}
Current Medications: ${latestPrescription?.medications || 'None'}
Precautions: ${latestPrescription?.precautions || 'None'}

Previous Chat History:
${messages.map(m => `${m.role === 'user' ? 'Patient' : 'MediBot'}: ${m.text}`).join('\n')}

Patient Question: ${input}

Provide helpful, concise medical awareness info. Disclaimer added by UI.` }]
          }
        ]
      });

      const data = response.text;
      setMessages(prev => [...prev, { role: 'model', text: data || 'I am sorry, I could not generate a response.' }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting right now. Please try again later.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-160px)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="text-primary" />
            MediBot
          </h1>
          <p className="text-muted-foreground">Your AI Health Companion.</p>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-primary border-primary/20 bg-primary/5">
          Powered by Gemini
        </Badge>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-md">
        <ScrollArea className="flex-1 p-4 bg-muted/20">
          <div className="space-y-6">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 bg-primary text-white">
                <Bot size={18} />
              </Avatar>
              <div className="bg-card p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] border">
                <p className="text-sm">Hello {profile?.full_name}! I'm MediBot. I can help you understand your reports or medicines. How can I assist you today?</p>
              </div>
            </div>

            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "")}>
                <Avatar className={cn("h-8 w-8", m.role === 'user' ? "bg-muted" : "bg-primary text-white")}>
                  {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </Avatar>
                <div className={cn(
                  "p-3 rounded-2xl shadow-sm max-w-[80%] border",
                  m.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card rounded-tl-none"
                )}>
                  <div className="text-sm prose prose-sm dark:prose-invert">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-3 animate-pulse">
                <Avatar className="h-8 w-8 bg-primary text-white">
                  <Bot size={18} />
                </Avatar>
                <div className="bg-card p-3 rounded-2xl rounded-tl-none shadow-sm border flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">MediBot is thinking...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-card">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <Input 
              placeholder="Ask about your report, medicines, or general health..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button size="icon" type="submit" disabled={sending || !input.trim()}>
              <Send size={18} />
            </Button>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            Disclaimer: MediBot provides info for awareness. Consult your doctor for diagnosis.
          </p>
        </div>
      </Card>
    </div>
  );
}
