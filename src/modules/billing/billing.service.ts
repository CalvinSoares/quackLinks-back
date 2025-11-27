import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

// Inicialize o Stripe com sua chave secreta (do .env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class BillingService {
  constructor(private prisma: PrismaClient) {}

  // Busca ou cria um cliente no Stripe para um usuário do seu app
  private async getOrCreateStripeCustomer(userId: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error("Usuário não encontrado.");

    // Se o usuário já tem um ID do Stripe, retorna ele
    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Se não, cria um novo cliente no Stripe
    const customer = await stripe.customers.create({
      email: email,
      metadata: {
        userId: userId, // Linka o cliente do Stripe ao seu usuário
      },
    });

    // Salva o novo ID no seu banco de dados
    await this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  // Cria uma sessão de checkout para o usuário comprar o plano Premium
  async createCheckoutSession(userId: string, email: string) {
    const customerId = await this.getOrCreateStripeCustomer(userId, email);
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID!; // ID do preço do seu produto no Stripe

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "boleto", "pix"], // Adiciona PIX!
      mode: "payment", // Para pagamentos únicos (Lifetime)
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/dashboard/overview?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/overview?payment=cancel`,
    });

    return { url: session.url };
  }
}
