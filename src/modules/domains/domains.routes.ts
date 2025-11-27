import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { DomainService } from "./domains.service";
import { z } from "zod";

const domainRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const domainService = new DomainService(server.prisma);

  // Todas as rotas de domínio são privadas
  server.addHook("onRequest", server.authenticate);

  const requirePremium = async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.user.role !== "PREMIUM") {
      return reply.code(403).send({
        message: "Funcionalidade disponível apenas para usuários Premium.",
      });
    }
  };

  server.get("/my-domain", async (req, reply) => {
    const domain = await domainService.getMyDomain(req.user.id);
    return domain || null;
  });

  server.get(
    "/", // Vamos usar a raiz do módulo de domínios para o GET
    { preHandler: [requirePremium] },
    async (req, reply) => {
      const domain = await domainService.getMyDomain(req.user.id);
      // Retorna o objeto do domínio ou `null` se não houver nenhum.
      return domain;
    }
  );

  // Adicionar um domínio
  server.post(
    "/",
    {
      schema: { body: z.object({ domain: z.string() }) },
      preHandler: [requirePremium],
    },

    async (req, reply) => {
      try {
        const customDomain = await domainService.addDomain(
          req.user.id,
          req.body.domain
        );
        return reply.code(201).send(customDomain);
      } catch (error: any) {
        return reply.code(400).send({ message: error.message });
      }
    }
  );

  server.delete("/", { preHandler: [requirePremium] }, async (req, reply) => {
    try {
      await domainService.removeDomain(req.user.id);
      return reply.code(204).send();
    } catch (error) {
      return reply.code(500).send({ message: "Erro ao remover o domínio." });
    }
  });

  // Verificar um domínio
  server.post("/verify", async (req, reply) => {
    const result = await domainService.verifyDomain(req.user.id);
    if (!result.success) {
      return reply.code(400).send(result);
    }
    return result;
  });
};

export default domainRoutes;
