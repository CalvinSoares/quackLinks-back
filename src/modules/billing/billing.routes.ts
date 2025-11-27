import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { BillingService } from "./billing.service";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const billingRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const billingService = new BillingService(server.prisma);

  // --- Rotas Privadas ---
  server.register(async (privateRoutes) => {
    privateRoutes.addHook("onRequest", privateRoutes.authenticate);

    // Rota para o frontend chamar para iniciar o pagamento
    privateRoutes.post("/checkout", async (req, reply) => {
      try {
        const session = await billingService.createCheckoutSession(
          req.user.id,
          req.user.email!
        );
        return session;
      } catch (error) {
        console.error("Stripe checkout error:", error);
        return reply.code(500).send({ message: "Erro ao criar checkout." });
      }
    });
  });

  // --- Rota Pública para Webhooks do Stripe ---
  server.post(
    "/webhooks",
    {
      // Adicionar um parser de 'raw body' para verificar a assinatura
      config: { rawBody: true },
    },
    async (req, reply) => {
      const sig = req.headers["stripe-signature"] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody!,
          sig,
          endpointSecret
        );
      } catch (err: any) {
        return reply.code(400).send(`Webhook Error: ${err.message}`);
      }

      // Lidar com o evento
      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object as Stripe.Checkout.Session;
          const customerId = session.customer as string;

          // Atualiza o usuário para Premium no seu banco de dados
          await server.prisma.user.update({
            where: { stripeCustomerId: customerId },
            data: { role: "PREMIUM" },
          });
          console.log(`User with Stripe ID ${customerId} is now PREMIUM.`);
          break;
        // ... lidar com outros eventos se necessário
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      return { received: true };
    }
  );
};

export default billingRoutes;
