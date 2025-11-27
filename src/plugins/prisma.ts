import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

// O uso de fastify-plugin é necessário para poder
// exportar o decorator para o escopo externo
export default fp(async (fastify, opts) => {
  const prisma = new PrismaClient();

  // Conecta ao banco de dados ao iniciar
  await prisma.$connect();

  // Disponibiliza o cliente Prisma em todo o app via `fastify.prisma`
  fastify.decorate("prisma", prisma);

  // Adiciona um hook para fechar a conexão quando o servidor parar
  fastify.addHook("onClose", async (server) => {
    await server.prisma.$disconnect();
  });
});

// Quando você usa .decorate, precisa adicionar a propriedade para o TypeScript
declare module "fastify" {
  export interface FastifyInstance {
    prisma: PrismaClient;
  }
}
