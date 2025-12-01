import Stripe from "stripe";
import { IUserRepository } from "../users/user.repository";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class UserNotFoundError extends Error {
  constructor() {
    super("Usuário não encontrado.");
  }
}

export class BillingService {
  constructor(private userRepository: IUserRepository) {}

  private async getOrCreateStripeCustomer(userId: string, email: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError();
    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });
    await this.userRepository.update(userId, { stripeCustomerId: customer.id });
    return customer.id;
  }

  async createCheckoutSession(userId: string, email: string) {
    const customerId = await this.getOrCreateStripeCustomer(userId, email);
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID!;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "boleto", "pix"],
      mode: "payment",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?payment=cancel`,
    });
    return { url: session.url };
  }

  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;

        await this.userRepository.updateByStripeCustomerId(customerId, {
          role: "PREMIUM",
        });
        console.log(`User with Stripe ID ${customerId} is now PREMIUM.`);
        break;
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }
}
