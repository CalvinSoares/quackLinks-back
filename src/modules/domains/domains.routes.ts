import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { DomainController } from "./domains.controller";
import { addDomainSchema } from "./domains.schema";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { User as PrismaUser } from "@prisma/client";

const domainRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const fastifyZod = fastify.withTypeProvider<ZodTypeProvider>();
  const domainController = new DomainController(fastify.domainService);

  const requirePremium = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = req.user as PrismaUser;
    if (user.role !== "PREMIUM") {
      return reply.code(403).send({ message: "Funcionalidade Premium." });
    }
  };

  fastifyZod.get("/", { preHandler: [requirePremium] }, async (req, reply) => {
    if (!req.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = req.user as PrismaUser;
    const domain = await domainController.getMyDomain(user.id);
    return domain || null;
  });

  fastifyZod.post(
    "/",
    {
      schema: addDomainSchema,
      preHandler: [requirePremium],
    },
    async (req, reply) => {
      if (!req.user) {
        return reply.code(401).send({ message: "Não autorizado." });
      }
      const user = req.user as PrismaUser;
      try {
        const customDomain = await domainController.addDomain(
          user.id,
          req.body.domain
        );
        return reply.code(201).send(customDomain);
      } catch (error) {
        console.error("Erro ao adicionar domínio:", error);
        return reply
          .code(500)
          .send({ message: "Erro interno ao adicionar domínio." });
      }
    }
  );

  fastifyZod.delete(
    "/",
    { preHandler: [requirePremium] },
    async (req, reply) => {
      if (!req.user) {
        return reply.code(401).send({ message: "Não autorizado." });
      }
      const user = req.user as PrismaUser;
      await domainController.removeDomain(user.id);
      return reply.code(204).send();
    }
  );

  fastifyZod.post("/verify", async (req, reply) => {
    if (!req.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = req.user as PrismaUser;
    const result = await domainController.verifyDomain(user.id);
    if (!result.success) {
      return reply.code(400).send(result);
    }
    return result;
  });
};

export default domainRoutes;
