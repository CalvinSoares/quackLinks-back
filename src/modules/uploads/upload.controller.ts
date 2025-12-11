import { FastifyRequest, FastifyReply } from "fastify";
import { UploadService } from "./upload.service";
import { CreateSignedUrlInput } from "./upload.schema";
import { User as PrismaUser } from "@prisma/client";

export class UploadController {
  constructor(private uploadService: UploadService) {}

  createSignedUrlHandler = async (
    req: FastifyRequest<{ Body: CreateSignedUrlInput }>,
    reply: FastifyReply
  ) => {
    if (!req.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = req.user as PrismaUser;
    try {
      const { id: userId } = user;

      const urls = await this.uploadService.createSignedUrl(userId, req.body);

      return reply.send(urls);
    } catch (error) {
      console.error(error);
      return reply
        .code(500)
        .send({ message: "Erro ao gerar URL para upload." });
    }
  };
}
