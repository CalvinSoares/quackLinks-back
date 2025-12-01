import { FastifyPluginAsync } from "fastify";
import { AudioController } from "./audios.controller";
import {
  createAudioSchema,
  deleteAudioSchema,
  setActiveAudioSchema,
  updateAudioSchema,
} from "./audio.schema";

const audioRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const audioController = new AudioController(fastify.audioService);

  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/", audioController.listAudiosHandler);

  fastify.post(
    "/",
    { schema: createAudioSchema },
    audioController.createAudioHandler
  );

  fastify.put(
    "/:audioId",
    { schema: updateAudioSchema },
    audioController.updateAudioHandler
  );

  fastify.delete(
    "/:audioId",
    { schema: deleteAudioSchema },
    audioController.deleteAudioHandler
  );

  fastify.post(
    "/:audioId/set-active",
    { schema: setActiveAudioSchema },
    audioController.setActiveAudioHandler
  );
};

export default audioRoutes;
