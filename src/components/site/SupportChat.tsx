import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, MessageCircle } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const WHATSAPP_URL =
  "https://wa.me/5581985252357?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20ViralizaHost%20e%20preciso%20de%20suporte.";

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Olá! Sou o Suporte VIRALIZA, assistente virtual da ViralizaHost. Como posso ajudar você hoje? Posso falar sobre domínios, hospedagem, VPS, e-mails, IA, marketing e mais.",
};

export default function SupportChat({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const resp = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = (await resp.json()) as { reply?: string };
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            data.reply ||
            "Para esta informação, por favor fale com o nosso suporte humano no WhatsApp.",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Para esta informação, por favor fale com o nosso suporte humano no WhatsApp.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[101] w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-8rem))] rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-primary text-primary-foreground">
        <div className="h-10 w-10 rounded-full bg-white/15 grid place-items-center">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold leading-tight">Suporte VIRALIZA</div>
          <div className="text-xs opacity-90">Assistente virtual da ViralizaHost</div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 grid place-items-center rounded-full hover:bg-white/15 transition"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick action */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-2 text-xs font-medium bg-[#25D366]/10 text-[#1ea952] hover:bg-[#25D366]/20 transition border-b border-border/40"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Falar com suporte humano
      </a>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"
                  style={{ animationDelay: "0.3s" }}
                />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-border/40 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Escreva a sua pergunta..."
          className="flex-1 h-10 rounded-full bg-muted px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center disabled:opacity-50 hover:scale-105 transition"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
