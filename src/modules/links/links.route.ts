import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { LinkController } from "./links.controller";
import {
  createLinkSchema,
  deleteLinkSchema,
  reorderLinksSchema,
  updateLinkSchema,
} from "./links.schema";

const linkRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const linkController = new LinkController(server.linkService);

  server.post(
    "/",
    { schema: createLinkSchema },
    linkController.createLinkHandler
  );

  server.put(
    "/:linkId",
    { schema: updateLinkSchema },
    linkController.updateLinkHandler
  );
  server.delete(
    "/:linkId",
    { schema: deleteLinkSchema },
    linkController.deleteLinkHandler
  );
  server.put(
    "/reorder",
    { schema: reorderLinksSchema },
    linkController.reorderLinksHandler
  );
};

export default linkRoutes;
