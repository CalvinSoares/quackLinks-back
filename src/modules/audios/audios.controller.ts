import { FastifyReply, FastifyRequest } from "fastify";
import { AudioService } from "./audios.service";
import { CreateAudioInput, UpdateAudioInput } from "./audio.schema";

export class AudioController {
  constructor(private audioService: AudioService) {}

  createAudioHandler = async (
    req: FastifyRequest<{ Body: CreateAudioInput }>,
    reply: FastifyReply
  ) => {
    try {
      const audio = await this.audioService.create(req.user.id, req.body);
      return reply.code(201).send(audio);
    } catch (error: any) {
      if (error.message.includes("Limite")) {
        return reply.code(403).send({ message: error.message });
      }
      return reply.code(500).send({ message: "Erro ao criar áudio." });
    }
  };

  updateAudioHandler = async (
    req: FastifyRequest<{
      Params: { audioId: string };
      Body: UpdateAudioInput;
    }>,
    reply: FastifyReply
  ) => {
    try {
      const audio = await this.audioService.update(
        req.user.id,
        req.params.audioId,
        req.body
      );
      return audio;
    } catch (error) {
      return reply
        .code(404)
        .send({ message: "Áudio não encontrado ou não pertence a você." });
    }
  };

  deleteAudioHandler = async (
    req: FastifyRequest<{ Params: { audioId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const result = await this.audioService.delete(
        req.user.id,
        req.params.audioId
      );
      return result;
    } catch (error) {
      return reply
        .code(404)
        .send({ message: "Áudio não encontrado ou não pertence a você." });
    }
  };

  setActiveAudioHandler = async (
    req: FastifyRequest<{ Params: { audioId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const audio = await this.audioService.setActive(
        req.user.id,
        req.params.audioId
      );
      return audio;
    } catch (error) {
      return reply
        .code(404)
        .send({ message: "Áudio não encontrado ou não pertence a você." });
    }
  };

  listAudiosHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const audios = await this.audioService.listByPage(req.user.id);
      return audios;
    } catch (error) {
      return reply.code(500).send({ message: "Erro ao listar áudios." });
    }
  };
}
