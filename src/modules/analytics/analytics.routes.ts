import { FastifyPluginAsync, FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { AnalyticsController } from "./analytics.controller";
import { getAnalyticsSchema } from "./analytics.schema";
import { authenticateJwt } from "../../plugins/authenticate";

const analyticsRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const analyticsController = new AnalyticsController(server.analyticsService);

  server.register(async (privateRoutes: FastifyInstance) => {
    privateRoutes
      .withTypeProvider<ZodTypeProvider>()
      .get(
        "/my-page",
        { schema: getAnalyticsSchema, preHandler: [authenticateJwt] },
        analyticsController.getMyPageAnalyticsHandler
      );
  });
};

export default analyticsRoutes;
