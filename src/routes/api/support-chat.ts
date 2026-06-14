import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT = `Você é o Suporte VIRALIZA, assistente virtual oficial da ViralizaHost.

EMPRESA: ViralizaHost — provedora brasileira/angolana de soluções digitais.

SERVIÇOS OFERECIDOS:
- Domínios: registro de .com, .net, .org, .com.br, .ao, .co.ao e várias extensões. Proteção WHOIS e transferência.
- Hospedagem: Web (cPanel), Cloud, Revenda WHM, E-mail corporativo.
- VPS & Cloud: VPS NVMe, Cloud privada, Servidor dedicado.
- Certificados SSL.
- E-mails corporativos profissionais.
- IA & Automação: Chatbots IA, IA WhatsApp, Automação n8n, OpenClaw.
- Marketing: Tráfego pago, SEO premium, Gestão social.
- Design & Branding.
- Audiovisual premium.

ÁREA DO CLIENTE: o cliente acessa /login para ver pedidos, faturas, domínios, hospedagem, e-mails, sites, suporte.

FORMAS DE PAGAMENTO: Pix, Boleto, Cartão de crédito (Mercado Pago), PayPal, Transferência bancária. Em Angola, métodos locais via Expay quando disponível.

ATIVAÇÃO: a maior parte dos serviços é ativada automaticamente após confirmação do pagamento. Alguns serviços (domínios .ao, planos personalizados, design/audiovisual) passam por ativação manual em até 24h úteis.

MOEDAS: BR exibe BRL, AO exibe AKZ. O cliente pode trocar a moeda no topo do site.

REGRAS DE RESPOSTA:
1. Tom profissional, cordial e comercial. Respostas curtas e objetivas (máx 4-6 linhas).
2. Use apenas as informações acima. NÃO invente preços, prazos exatos ou políticas que não estejam aqui.
3. Se a pergunta exigir dados específicos (preço atual exato, status de pedido, configuração técnica avançada, reclamação) responda EXATAMENTE: "Para esta informação, um atendente humano pode ajudar melhor."
4. NUNCA mencione números de telefone, WhatsApp ou links no texto.
5. Responda em português (PT-BR), salvo se o usuário falar outro idioma.`;

export const Route = createFileRoute("/api/support-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as { messages: Msg[] };
          if (!Array.isArray(messages) || messages.length === 0) {
            return new Response("Messages required", { status: 400 });
          }
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Lovable-API-Key": key,
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
              ],
            }),
          });

          if (resp.status === 429) {
            return Response.json(
              { fallback: true, reply: "Para esta informação, um atendente humano pode ajudar melhor." },
              { status: 200 },
            );
          }
          if (resp.status === 402) {
            return Response.json(
              { fallback: true, reply: "Para esta informação, um atendente humano pode ajudar melhor." },
              { status: 200 },
            );
          }
          if (!resp.ok) {
            return Response.json(
              { fallback: true, reply: "Para esta informação, um atendente humano pode ajudar melhor." },
              { status: 200 },
            );
          }

          const data = (await resp.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const reply =
            data.choices?.[0]?.message?.content?.trim() ||
            "Para esta informação, um atendente humano pode ajudar melhor.";
          return Response.json({ reply });
        } catch {
          return Response.json(
            { fallback: true, reply: "Para esta informação, um atendente humano pode ajudar melhor." },
            { status: 200 },
          );
        }
      },
    },
  },
});
