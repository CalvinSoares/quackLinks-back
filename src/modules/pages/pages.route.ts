import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { PageController } from "./pages.controller";
import { getPageBySlugSchema, updatePageSchema } from "./pages.schema";
import { authenticateJwt } from "../../plugins/authenticate";

const pageRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const pageController = new PageController(
    server.pageService,
    server.analyticsService
  );

  server.get(
    "/:slug",
    { schema: getPageBySlugSchema },
    pageController.getPageBySlugHandler
  );

  server.register(async (privateRoutes) => {
    privateRoutes.addHook("preHandler", authenticateJwt);
    privateRoutes.get("/list", pageController.getMyPagesHandler);
    privateRoutes.get("/my-page", pageController.getMyPageHandler);

    privateRoutes.put(
      "/my-page",
      { schema: updatePageSchema },
      pageController.updateMyPageHandler
    );

    privateRoutes.post("/", pageController.createPageHandler);
    privateRoutes.delete("/:id", pageController.deletePageHandler);
  });
};

export default pageRoutes;
