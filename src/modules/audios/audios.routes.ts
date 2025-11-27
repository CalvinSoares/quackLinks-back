import { FastifyPluginAsync } from "fastify";
import { AudioController } from "./audios.controller";
import {
  createAudioSchema,
  deleteAudioSchema,
  setActiveAudioSchema,
  updateAudioSchema,
} from "./audio.schema";

const audioRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const audioController = new AudioController(fastify);

  // Adiciona o hook de autenticação a todas as rotas deste módulo
  fastify.addHook("onRequest", fastify.authenticate);

  // GET /api/v1/audios -> Listar todos os áudios da página do usuário logado
  fastify.get("/", audioController.listAudiosHandler);

  // POST /api/v1/audios -> Criar um novo áudio
  fastify.post(
    "/",
    { schema: createAudioSchema },
    audioController.createAudioHandler
  );

  // PUT /api/v1/audios/:audioId -> Atualizar um áudio
  fastify.put(
    "/:audioId",
    { schema: updateAudioSchema },
    audioController.updateAudioHandler
  );

  // DELETE /api/v1/audios/:audioId -> Deletar um áudio
  fastify.delete(
    "/:audioId",
    { schema: deleteAudioSchema },
    audioController.deleteAudioHandler
  );

  // POST /api/v1/audios/:audioId/set-active -> Definir um áudio como ativo
  fastify.post(
    "/:audioId/set-active",
    { schema: setActiveAudioSchema },
    audioController.setActiveAudioHandler
  );
};

export default audioRoutes;
