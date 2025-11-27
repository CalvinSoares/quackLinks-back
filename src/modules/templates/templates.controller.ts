import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TemplateService } from "./templates.service";
import { CreateTemplateInput, ListTemplatesQuery } from "./templates.schema";
import { Prisma } from "@prisma/client";

export class TemplateController {
  private templateService: TemplateService;

  constructor(fastify: FastifyInstance) {
    this.templateService = new TemplateService(fastify.prisma);
  }

  // POST /templates
  createTemplateHandler = async (
    req: FastifyRequest<{ Body: CreateTemplateInput }>,
    reply: FastifyReply
  ) => {
    try {
      const template = await this.templateService.createTemplate(
        req.user.id,
        req.body
      );
      return reply.code(201).send(template);
    } catch (error) {
      // Log do erro real no servidor
      console.error(error);
      return reply
        .code(500)
        .send({ message: "Não foi possível criar o template." });
    }
  };

  listUserTemplatesHandler = async (
    req: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      // req.user.id vem do seu hook de autenticação
      const result = await this.templateService.listUserTemplates(req.user.id);
      return reply.send(result);
    } catch (error) {
      console.error("Error fetching user templates:", error);
      return reply
        .code(500)
        .send({ message: "Não foi possível buscar seus templates." });
    }
  };

  // GET /templates
  listTemplatesHandler = async (
    req: FastifyRequest<{ Querystring: ListTemplatesQuery }>,
    reply: FastifyReply
  ) => {
    const result = await this.templateService.listPublicTemplates(req.query);
    return result;
  };

  // GET /templates/:id
  getTemplateHandler = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const template = await this.templateService.getTemplateById(req.params.id);
    if (!template) {
      return reply.code(404).send({ message: "Template não encontrado." });
    }
    return template;
  };

  // POST /templates/:id/apply
  applyTemplateHandler = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const updatedPage = await this.templateService.applyTemplate(
        req.user.id,
        req.params.id
      );
      return updatedPage;
    } catch (error) {
      if (error instanceof Error && error.message.includes("encontrado")) {
        return reply.code(404).send({ message: error.message });
      }
      return reply.code(500).send({ message: "Erro ao aplicar o template." });
    }
  };

  // POST /templates/:id/favorite
  favoriteTemplateHandler = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    await this.templateService.favoriteTemplate(req.user.id, req.params.id);
    return reply.code(204).send();
  };

  // DELETE /templates/:id/favorite
  unfavoriteTemplateHandler = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      await this.templateService.unfavoriteTemplate(req.user.id, req.params.id);
      return reply.code(204).send();
    } catch (error) {
      // O Prisma lança um erro se o registro a ser deletado não existe
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return reply
          .code(404)
          .send({ message: "Registro de favorito não encontrado." });
      }
      return reply
        .code(500)
        .send({ message: "Não foi possível remover o favorito." });
    }
  };

  deleteTemplateHandler = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      await this.templateService.deleteTemplate(req.user.id, req.params.id);
      return reply.code(204).send();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return reply.code(404).send({
          message:
            "Template não encontrado ou você não tem permissão para excluí-lo.",
        });
      }

      console.error("Error deleting template:", error);
      return reply
        .code(500)
        .send({ message: "Não foi possível excluir o template." });
    }
  };
}
