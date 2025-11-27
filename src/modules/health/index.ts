import { FastifyPluginAsync } from "fastify";

const healthRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  // A rota raiz agora pertence a este módulo
  fastify.get("/", async function (request, reply) {
    return { status: "ok", timestamp: new Date().toISOString() };
  });
};

export default healthRoutes;
