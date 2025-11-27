import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { AnalyticsController } from "./analytics.controller";
import { getAnalyticsSchema } from "./analytics.schema";

const analyticsRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const analyticsController = new AnalyticsController(server);

  server.register(async (privateRoutes) => {
    privateRoutes.addHook("onRequest", privateRoutes.authenticate);

    privateRoutes.get(
      "/my-page",
      { schema: getAnalyticsSchema },
      analyticsController.getMyPageAnalyticsHandler
    );
  });
};

export default analyticsRoutes;
