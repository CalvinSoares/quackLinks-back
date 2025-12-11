import { FastifyReply, FastifyRequest } from "fastify";
import { BillingService } from "./billing.service";
import { User as PrismaUser } from "@prisma/client";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class BillingController {
  constructor(private billingService: BillingService) {}

  createCheckoutSessionHandler = async (
    req: FastifyRequest,
    reply: FastifyReply
  ) => {
    if (!req.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = req.user as PrismaUser;
    try {
      const session = await this.billingService.createCheckoutSession(
        user.id,
        user.email!
      );
      return session;
    } catch (error) {
      console.error("Stripe checkout error:", error);
      return reply.code(500).send({ message: "Erro ao criar checkout." });
    }
  };

  webhookHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const sig = req.headers["stripe-signature"] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    let event: Stripe.Event;

    try {
      // 1. Verificar a assinatura (responsabilidade da camada HTTP)
      event = stripe.webhooks.constructEvent(req.rawBody!, sig, endpointSecret);
    } catch (err: any) {
      return reply.code(400).send(`Webhook Error: ${err.message}`);
    }

    // 2. Passar o evento verificado para o serviço lidar com a lógica de negócio
    await this.billingService.handleWebhookEvent(event);

    return { received: true };
  };
}
