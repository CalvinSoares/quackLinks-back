import { FastifyRequest, FastifyReply } from "fastify";
import { UploadService } from "./upload.service";
import { CreateSignedUrlInput } from "./upload.schema";

export class UploadController {
  constructor(private uploadService: UploadService) {}

  createSignedUrlHandler = async (
    req: FastifyRequest<{ Body: CreateSignedUrlInput }>,
    reply: FastifyReply
  ) => {
    try {
      const { id: userId } = req.user;

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
