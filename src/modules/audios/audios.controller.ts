import { FastifyReply, FastifyRequest } from "fastify";
import { AudioService } from "./audios.service";
import { CreateAudioInput, UpdateAudioInput } from "./audio.schema";
import { User as PrismaUser } from "@prisma/client";

// --- Definição de Tipos para uso interno ---
type CreateAudioRequest = FastifyRequest<{
  Body: CreateAudioInput;
}>;

type UpdateAudioRequest = FastifyRequest<{
  Params: { audioId: string };
  Body: UpdateAudioInput;
}>;

type AudioParamsRequest = FastifyRequest<{
  Params: { audioId: string };
}>;

export class AudioController {
  constructor(private audioService: AudioService) {}

  // 1. Create Audio
  createAudioHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    // Casting para obter tipagem no corpo da função
    const request = req as CreateAudioRequest;

    if (!request.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = request.user as PrismaUser;

    try {
      // Agora request.body está tipado corretamente
      const audio = await this.audioService.create(user.id, request.body);
      return reply.code(201).send(audio);
    } catch (error: any) {
      if (error.message && error.message.includes("Limite")) {
        return reply.code(403).send({ message: error.message });
      }
      return reply.code(500).send({ message: "Erro ao criar áudio." });
    }
  };

  // 2. Update Audio
  updateAudioHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const request = req as UpdateAudioRequest;

    if (!request.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = request.user as PrismaUser;
    try {
      const audio = await this.audioService.update(
        user.id,
        request.params.audioId,
        request.body
      );
      return audio;
    } catch (error) {
      return reply
        .code(404)
        .send({ message: "Áudio não encontrado ou não pertence a você." });
    }
  };

  // 3. Delete Audio
  deleteAudioHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const request = req as AudioParamsRequest;

    try {
      if (!request.user) {
        return reply.code(401).send({ message: "Não autorizado." });
      }
      const user = request.user as PrismaUser;

      const result = await this.audioService.delete(
        user.id,
        request.params.audioId
      );
      return result;
    } catch (error) {
      return reply
        .code(404)
        .send({ message: "Áudio não encontrado ou não pertence a você." });
    }
  };

  // 4. Set Active Audio
  setActiveAudioHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const request = req as AudioParamsRequest;

    if (!request.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = request.user as PrismaUser;
    try {
      const audio = await this.audioService.setActive(
        user.id,
        request.params.audioId
      );
      return audio;
    } catch (error) {
      return reply
        .code(404)
        .send({ message: "Áudio não encontrado ou não pertence a você." });
    }
  };

  // 5. List Audios (Este já estava genérico, mas mantive o padrão)
  listAudiosHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = req.user as PrismaUser;
    try {
      const audios = await this.audioService.listByPage(user.id);
      return audios;
    } catch (error) {
      return reply.code(500).send({ message: "Erro ao listar áudios." });
    }
  };
}
