import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { RedirectController } from "./redirect.controller";
import { redirectSchema } from "./redirect.schema";

const redirectRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const redirectController = new RedirectController(server);

  // Rota pública para redirecionar e rastrear cliques
  // Ex: GET /api/v1/redirect/uuid-do-link
  server.get(
    "/:linkId",
    { schema: redirectSchema },
    redirectController.redirectHandler
  );
};

export default redirectRoutes;
