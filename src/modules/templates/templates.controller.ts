import { FastifyReply, FastifyRequest } from "fastify";
import { TemplateService } from "./templates.service";
import { CreateTemplateInput, ListTemplatesQuery } from "./templates.schema";

export class TemplateController {
  constructor(private templateService: TemplateService) {}
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
      const result = await this.templateService.listUserTemplates(req.user.id);
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

  favoriteTemplateHandler = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    await this.templateService.favoriteTemplate(req.user.id, req.params.id);
    return reply.code(204).send();
  };

  unfavoriteTemplateHandler = async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    try {
      await this.templateService.unfavoriteTemplate(req.user.id, req.params.id);
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
    try {
      await this.templateService.deleteTemplate(req.user.id, req.params.id);
      return reply.code(204).send();
    } catch (error) {
      console.error("Error deleting template:", error);
      return reply
        .code(500)
        .send({ message: "Não foi possível excluir o template." });
    }
  };
}
