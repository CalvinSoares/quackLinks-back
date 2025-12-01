import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";

import { DomainController } from "./domains.controller";
import { addDomainSchema } from "./domains.schema";
import { ZodTypeProvider } from "fastify-type-provider-zod";

const domainRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const fastifyZod = fastify.withTypeProvider<ZodTypeProvider>();

  const domainController = new DomainController(fastify.domainService);

  fastify.addHook("onRequest", fastify.authenticate);

  const requirePremium = async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.user.role !== "PREMIUM") {
      return reply.code(403).send({ message: "Funcionalidade Premium." });
    }
  };

  fastifyZod.get(
    "/",
    { preHandler: [requirePremium] },
    domainController.getMyDomainHandler
  );
  fastifyZod.post(
    "/",
    {
      schema: addDomainSchema,
      preHandler: [requirePremium],
    },
    domainController.addHandler
  );
  fastifyZod.delete(
    "/",
    { preHandler: [requirePremium] },
    domainController.removeHandler
  );
  fastifyZod.post("/verify", domainController.verifyHandler);
};

export default domainRoutes;
