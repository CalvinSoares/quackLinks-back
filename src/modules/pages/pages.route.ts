import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { PageController } from "./pages.controller";
import { getPageBySlugSchema, updatePageSchema } from "./pages.schema";

const pageRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const pageController = new PageController(server);

  // --- Rotas Públicas ---
  server.get(
    "/:slug",
    { schema: getPageBySlugSchema },
    pageController.getPageBySlugHandler
  );

  // --- Rotas Privadas (requerem autenticação) ---
  server.register(async (privateRoutes) => {
    privateRoutes.addHook("onRequest", privateRoutes.authenticate);

    privateRoutes.get("/my-page", pageController.getMyPageHandler);
    privateRoutes.put(
      "/my-page",
      { schema: updatePageSchema },
      pageController.updateMyPageHandler
    );
  });
};

export default pageRoutes;
