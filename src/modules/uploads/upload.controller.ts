import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { UploadService } from "./upload.service";
import { CreateSignedUrlInput } from "./upload.schema";

export class UploadController {
  private uploadService: UploadService;

  constructor(fastify: FastifyInstance) {
    // Usamos um singleton para o serviço para não recriar o S3Client a cada requisição
    if (!(fastify as any).uploadService) {
      (fastify as any).decorate("uploadService", new UploadService());
    }
    this.uploadService = (fastify as any).uploadService;
  }

  createSignedUrlHandler = async (
    req: FastifyRequest<{ Body: CreateSignedUrlInput }>,
    reply: FastifyReply
  ) => {
    try {
      const { id: userId } = req.user; // Obtém o ID do usuário autenticado

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
