import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { UploadController } from "./upload.controller";
import { createSignedUrlSchema } from "./upload.schema";

const uploadRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const uploadController = new UploadController(server.uploadService);

  server.addHook("onRequest", server.authenticate);

  server.post(
    "/signed-url",
    { schema: createSignedUrlSchema },
    uploadController.createSignedUrlHandler
  );
};

export default uploadRoutes;
