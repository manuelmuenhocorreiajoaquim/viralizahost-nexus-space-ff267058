import { MessageCircle, Bot } from "lucide-react";

export default function FloatingActions() {
  const whatsappUrl =
    "https://wa.me/5581985252357?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20ViralizaHost%20e%20gostaria%20de%20atendimento.";

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      <button className="group relative h-14 w-14 rounded-full bg-gradient-primary shadow-glow grid place-items-center hover:scale-110 transition">
        <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
        <Bot className="relative h-6 w-6 text-primary-foreground" />
        <span className="absolute right-full mr-3 whitespace-nowrap glass rounded-full px-3 py-1.5 text-xs opacity-0 group-hover:opacity-100 transition">
          Chat IA
        </span>
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative h-14 w-14 rounded-full bg-[#25D366] shadow-[0_0_30px_rgba(37,211,102,0.5)] grid place-items-center hover:scale-110 transition"
        aria-label="WhatsApp"
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366]/40 animate-pulse" />
        <MessageCircle className="relative h-6 w-6 text-white" />
        <span className="absolute right-full mr-3 whitespace-nowrap glass rounded-full px-3 py-1.5 text-xs opacity-0 group-hover:opacity-100 transition">
          WhatsApp
        </span>
      </a>
    </div>
  );
}
