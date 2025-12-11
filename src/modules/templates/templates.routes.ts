import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { TemplateController } from "./templates.controller";
import {
  createTemplateSchema,
  listTemplatesSchema,
  applyTemplateSchema,
  favoriteTemplateSchema,
  getTemplateSchema,
} from "./templates.schema";

const templateRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const templateController = new TemplateController(server.templateService);

  server.get(
    "/",
    { schema: listTemplatesSchema },
    templateController.listTemplatesHandler
  );

  server.get(
    "/:id",
    { schema: getTemplateSchema },
    templateController.getTemplateHandler
  );

  server.register(async (privateRoutes) => {
    privateRoutes.post(
      "/",
      { schema: createTemplateSchema },
      templateController.createTemplateHandler
    );

    privateRoutes.get("/mine", {}, templateController.listUserTemplatesHandler);

    privateRoutes.get(
      "/favorites",
      {},
      templateController.listFavoriteTemplatesHandler
    );
    privateRoutes.get(
      "/recent",
      {},
      templateController.listRecentTemplatesHandler
    );

    server.get("/tags/popular", {}, templateController.listPopularTagsHandler);

    privateRoutes.post(
      "/:id/apply",
      { schema: applyTemplateSchema },
      templateController.applyTemplateHandler
    );

    privateRoutes.post(
      "/:id/favorite",
      { schema: favoriteTemplateSchema },
      templateController.favoriteTemplateHandler
    );

    privateRoutes.delete(
      "/:id/favorite",
      { schema: favoriteTemplateSchema },
      templateController.unfavoriteTemplateHandler
    );

    privateRoutes.delete(
      "/:id",
      { schema: getTemplateSchema },
      templateController.deleteTemplateHandler
    );
  });
};

export default templateRoutes;
