import { FastifyPluginAsync } from "fastify";
import { BillingController } from "./billing.controller";

const billingRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const billingController = new BillingController(fastify.billingService);

  fastify.register(async (privateRoutes) => {
    privateRoutes.addHook("onRequest", privateRoutes.authenticate);
    privateRoutes.post(
      "/checkout",
      billingController.createCheckoutSessionHandler
    );
  });

  fastify.post(
    "/webhooks",
    { config: { rawBody: true } },
    billingController.webhookHandler
  );
};

export default billingRoutes;
