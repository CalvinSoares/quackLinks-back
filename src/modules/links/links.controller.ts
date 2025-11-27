import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { LinkService } from "./links.service";
import {
  CreateLinkInput,
  ReorderLinkInput,
  UpdateLinkInput,
} from "./links.schema";
import { Prisma } from "@prisma/client";

export class LinkController {
  private linkService: LinkService;

  constructor(fastify: FastifyInstance) {
    this.linkService = new LinkService(fastify.prisma);
  }

  createLinkHandler = async (
    req: FastifyRequest<{ Body: CreateLinkInput }>,
    reply: FastifyReply
  ) => {
    try {
      const link = await this.linkService.createLink(req.user.id, req.body);
      return reply.code(201).send(link);
    } catch (error) {
      return reply
        .code(500)
        .send({ message: "Não foi possível criar o link." });
    }
  };

  updateLinkHandler = async (
    req: FastifyRequest<{ Body: UpdateLinkInput; Params: { linkId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const link = await this.linkService.updateLink(
        req.user.id,
        req.params.linkId,
        req.body
      );
      return link;
    } catch (error) {
      // P2025 é o código de erro do Prisma para "Record to update not found."
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return reply
          .code(404)
          .send({ message: "Link não encontrado ou não pertence a você." });
      }
      return reply
        .code(500)
        .send({ message: "Não foi possível atualizar o link." });
    }
  };

  deleteLinkHandler = async (
    req: FastifyRequest<{ Params: { linkId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      await this.linkService.deleteLink(req.user.id, req.params.linkId);
      return reply.code(204).send();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return reply
          .code(404)
          .send({ message: "Link não encontrado ou não pertence a você." });
      }
      return reply
        .code(500)
        .send({ message: "Não foi possível deletar o link." });
    }
  };

  reorderLinksHandler = async (
    req: FastifyRequest<{ Body: ReorderLinkInput }>,
    reply: FastifyReply
  ) => {
    try {
      await this.linkService.reorderLinks(req.user.id, req.body);
      return { message: "Links reordenados com sucesso." };
    } catch (error: any) {
      // Captura o erro de permissão que definimos no serviço
      if (error.message.includes("Permissão negada")) {
        return reply.code(403).send({ message: error.message });
      }
      return reply
        .code(500)
        .send({ message: "Ocorreu um erro ao reordenar os links." });
    }
  };
}
