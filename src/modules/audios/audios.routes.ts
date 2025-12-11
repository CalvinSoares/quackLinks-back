import { FastifyPluginAsync } from "fastify";
import { AudioController } from "./audios.controller";
import {
  createAudioSchema,
  deleteAudioSchema,
  setActiveAudioSchema,
  updateAudioSchema,
} from "./audio.schema";
import { authenticateJwt } from "../../plugins/authenticate";
import { ZodTypeProvider } from "fastify-type-provider-zod";

const audioRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  const audioController = new AudioController(fastify.audioService);

  server.get(
    "/",
    { preHandler: [authenticateJwt] },
    audioController.listAudiosHandler
  );

  server.post(
    "/",
    { schema: createAudioSchema, preHandler: [authenticateJwt] },
    audioController.createAudioHandler
  );

  server.put(
    "/:audioId",
    { schema: updateAudioSchema, preHandler: [authenticateJwt] },
    audioController.updateAudioHandler
  );

  server.delete(
    "/:audioId",
    { schema: deleteAudioSchema, preHandler: [authenticateJwt] },
    audioController.deleteAudioHandler
  );

  server.post(
    "/:audioId/set-active",
    { schema: setActiveAudioSchema, preHandler: [authenticateJwt] },
    audioController.setActiveAudioHandler
  );
};

export default audioRoutes;
