import { MessageCircle, Bot } from "lucide-react";

export default function FloatingActions() {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      <button className="group relative h-14 w-14 rounded-full bg-gradient-primary shadow-glow grid place-items-center hover:scale-110 transition">
        <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
        <Bot className="relative h-6 w-6 text-primary-foreground" />
        <span className="absolute right-full mr-3 whitespace-nowrap glass rounded-full px-3 py-1.5 text-xs opacity-0 group-hover:opacity-100 transition">
          Chat IA
        </span>
      </button>
      <a href="#" className="group relative h-14 w-14 rounded-full bg-emerald-500 shadow-[0_0_30px_oklch(0.7_0.2_150_/_0.5)] grid place-items-center hover:scale-110 transition">
        <MessageCircle className="h-6 w-6 text-white" />
        <span className="absolute right-full mr-3 whitespace-nowrap glass rounded-full px-3 py-1.5 text-xs opacity-0 group-hover:opacity-100 transition">
          WhatsApp
        </span>
      </a>
    </div>
  );
}
