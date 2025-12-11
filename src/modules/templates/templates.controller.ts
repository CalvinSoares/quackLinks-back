import { FastifyReply, FastifyRequest } from "fastify";
import { TemplateService } from "./templates.service";
import { CreateTemplateInput, ListTemplatesQuery } from "./templates.schema";
import { User as PrismaUser } from "@prisma/client";

export class TemplateController {
  constructor(private templateService: TemplateService) {}
  createTemplateHandler = async (
    req: FastifyRequest<{ Body: CreateTemplateInput }>,
    reply: FastifyReply
  ) => {
    try {
      if (!req.user) {
        return reply.code(401).send({ message: "Não autorizado." });
      }
      const user = req.user as PrismaUser;
      const template = await this.templateService.createTemplate(
        user.id,
        req.body
      );
      return reply.code(201).send(template);
    } catch (error) {
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
    if (!req.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = req.user as PrismaUser;
    try {
      const result = await this.templateService.listUserTemplates(user.id);
      return reply.send(result);
    } catch (error) {
      console.error("Error fetching user templates:", error);
      return reply
        .code(500)
        .send({ message: "Não foi possível buscar seus templates." });
    }
  };

  listTemplatesHandler = async (
    req: FastifyRequest<{ Querystring: ListTemplatesQuery }>,
    reply: FastifyReply
  ) => {
    const result = await this.templateService.listPublicTemplates(req.query);
    return result;
  };

  listFavoriteTemplatesHandler = async (
    req: FastifyRequest,
    reply: FastifyReply
  ) => {
    if (!req.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = req.user as PrismaUser;
    try {
      const templates = await this.templateService.listFavoriteTemplates(
        user.id
      );
      return reply.send(templates);
    } catch (error) {
      console.error("Error fetching favorite templates:", error);
      return reply.code(500).send({ message: "Failed to fetch favorites." });
    }
  };

  listRecentTemplatesHandler = async (
    req: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const templates = await this.templateService.listRecentTemplates();
      return reply.send(templates);
    } catch (error) {
      console.error("Error fetching recent templates:", error);
      return reply
        .code(500)
        .send({ message: "Failed to fetch recent templates." });
    }
  };

  listPopularTagsHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const tags = await this.templateService.listPopularTags();
    return tags;
  };

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

  applyTemplateHandler = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    if (!req.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = req.user as PrismaUser;
    try {
      const updatedPage = await this.templateService.applyTemplate(
        user.id,
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

  favoriteTemplateHandler = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    if (!req.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = req.user as PrismaUser;
    await this.templateService.favoriteTemplate(user.id, req.params.id);
    return reply.code(204).send();
  };

  unfavoriteTemplateHandler = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    if (!req.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = req.user as PrismaUser;
    try {
      await this.templateService.unfavoriteTemplate(user.id, req.params.id);
      return reply.code(204).send();
    } catch (error) {
      return reply
        .code(500)
        .send({ message: "Não foi possível remover o favorito." });
    }
  };

  deleteTemplateHandler = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    if (!req.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = req.user as PrismaUser;
    try {
      await this.templateService.deleteTemplate(user.id, req.params.id);
      return reply.code(204).send();
    } catch (error) {
      console.error("Error deleting template:", error);
      return reply
        .code(500)
        .send({ message: "Não foi possível excluir o template." });
    }
  };
}
