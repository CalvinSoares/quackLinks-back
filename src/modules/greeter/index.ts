import { FastifyPluginAsync } from "fastify";

const greeterRoutes: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  // Esta rota será acessível em /greeter/
  fastify.get("/", async function (request, reply) {
    return "this is a greeter example";
  });

  // Você pode adicionar mais rotas relacionadas aqui
  fastify.get("/hello", async function (request, reply) {
    return { message: "hello world!" };
  });
};

export default greeterRoutes;
