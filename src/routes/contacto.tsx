import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Mail, Phone, MessageCircle, Send, MapPin } from "lucide-react";
import { useState } from "react";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import { z } from "zod";
import { toast } from "sonner";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — ViralizaHost" },
      { name: "description", content: "Fale com a ViralizaHost: e-mail, WhatsApp Brasil e Angola. Equipe pronta para atender você." },
      { property: "og:title", content: "Contacto — ViralizaHost" },
      { property: "og:description", content: "Atendimento comercial Brasil e Angola." },
    ],
  }),
  component: ContactoPage,
});

const contactSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(5, "Informe um telefone válido").max(40),
  subject: z.string().trim().min(1, "Informe o assunto").max(150),
  message: z.string().trim().min(5, "Mensagem muito curta").max(2000),
});

const channels = [
  { icon: Mail, label: "E-mail comercial", value: "comercial@viralizahost.com", href: "mailto:comercial@viralizahost.com" },
  { icon: Phone, label: "Brasil", value: "+55 81 98525 2357", href: "tel:+5581985252357" },
  { icon: Phone, label: "Angola", value: "+244 951 008 653", href: "tel:+244951008653" },
];

export default function ContactoPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setLoading(true);
    const text = encodeURIComponent(
      `Olá! Sou ${result.data.name}.\nE-mail: ${result.data.email}\nTelefone: ${result.data.phone}\nAssunto: ${result.data.subject}\n\n${result.data.message}`
    );
    window.open(`https://wa.me/5581985252357?text=${text}`, "_blank");
    toast.success("Mensagem preparada! Conclua o envio no WhatsApp.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <MapPin className="h-3.5 w-3.5" /> Contacto
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Vamos <span className="text-gradient-primary">conversar</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Equipe comercial em Brasil e Angola pronta para atender. Resposta em até 1 hora útil.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6 mb-10">
            {channels.map((c, i) => (
              <motion.a
                key={c.label}
                href={c.href}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="rounded-2xl bg-card border border-border p-5 hover:border-primary/40 hover:-translate-y-1 transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow-soft mb-3">
                  <c.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{c.label}</div>
                <div className="font-semibold">{c.value}</div>
              </motion.a>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-12">
            <a
              href="https://wa.me/5581985252357"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-5 py-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold transition shadow-glow-soft"
            >
              <MessageCircle className="h-5 w-5" /> WhatsApp Brasil — +55 81 98525 2357
            </a>
            <a
              href="https://wa.me/244951008653"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-5 py-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold transition shadow-glow-soft"
            >
              <MessageCircle className="h-5 w-5" /> WhatsApp Angola — +244 951 008 653
            </a>
          </div>

          <motion.form
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-card border border-border p-6 md:p-8 shadow-card max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-6">Envie sua mensagem</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Seu nome completo" />
              <Field label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="voce@email.com" />
              <Field label="Telefone / WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+55 ou +244" />
              <Field label="Assunto" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} placeholder="Hospedagem, IA, Design..." />
            </div>
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Mensagem</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                placeholder="Como podemos ajudar?"
                className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-[1.01] transition disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> Enviar mensagem
            </button>
          </motion.form>
        </div>
      </main>
      <CTAFooter />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition"
      />
    </div>
  );
}
