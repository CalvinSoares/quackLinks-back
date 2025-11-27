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

const templateRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const templateController = new TemplateController(server);

  // --- Rotas Públicas ---
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

  // --- Rotas Privadas (requerem autenticação) ---
  server.register(async (privateRoutes) => {
    privateRoutes.addHook("onRequest", privateRoutes.authenticate);

    privateRoutes.post(
      "/",
      { schema: createTemplateSchema },
      templateController.createTemplateHandler
    );

    privateRoutes.get(
      "/mine",
      {}, // Não precisa de schema de validação para esta rota simples
      templateController.listUserTemplatesHandler
    );

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
