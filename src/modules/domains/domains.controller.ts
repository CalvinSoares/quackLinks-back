import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { DomainService } from "./domains.service";
import { addDomainBodySchema } from "./domains.schema";

type AddDomainRequest = FastifyRequest<{
  Body: z.infer<typeof addDomainBodySchema>;
}>;

export class DomainController {
  constructor(private domainService: DomainService) {}

  getMyDomainHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const domain = await this.domainService.getMyDomain(req.user.id);
      return domain || null;
    } catch (error) {
      console.error("Erro ao buscar domínio:", error);
      return reply.code(500).send({ message: "Erro ao buscar o domínio." });
    }
  };

  addHandler = async (req: AddDomainRequest, reply: FastifyReply) => {
    try {
      const customDomain = await this.domainService.addDomain(
        req.user.id,
        req.body.domain
      );
      return reply.code(201).send(customDomain);
    } catch (error) {
      console.error("Erro ao adicionar domínio:", error);
      return reply
        .code(500)
        .send({ message: "Erro interno ao adicionar domínio." });
    }
  };

  removeHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await this.domainService.removeDomain(req.user.id);
      return reply.code(204).send();
    } catch (error) {
      console.error("Erro ao remover domínio:", error);
      return reply.code(500).send({ message: "Erro ao remover o domínio." });
    }
  };

  verifyHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await this.domainService.verifyDomain(req.user.id);

      if (!result.success) {
        return reply.code(400).send(result);
      }
      return result;
    } catch (error) {
      console.error("Erro ao verificar domínio:", error);
      return reply
        .code(500)
        .send({ message: "Erro interno ao verificar domínio." });
    }
  };
}
