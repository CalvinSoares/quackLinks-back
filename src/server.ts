import Fastify from "fastify";
import { FastifyInstance } from "fastify";
import app from "./app";
import "dotenv/config";
import { startSchedulers } from "./scheduler";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";

const BODY_LIMIT_IN_BYTES = 10 * 1024 * 1024;

async function setupCustomDomainRouting(server: FastifyInstance) {
  server.addHook("onRequest", async (request, reply) => {
    const hostname = request.hostname;
    const appDomain = process.env.APP_DOMAIN!;

    if (hostname === appDomain || hostname.includes("localhost")) {
      return;
    }

    try {
      const customDomain = await server.prisma.customDomain.findUnique({
        where: { domain: hostname, verified: true },
        include: { user: { include: { pages: true } } },
      });

      if (customDomain && customDomain.user.pages) {
        request.raw.url = `/${customDomain.user.pages[0].slug}`;
      } else {
        reply
          .code(404)
          .send({ message: `Domínio '${hostname}' não configurado.` });
      }
    } catch (e) {
      // Evita crash se o prisma não estiver pronto na primeira requisição
      request.log.warn(
        "Prisma ainda não disponível para roteamento de domínio customizado."
      );
    }
  });
}

const server = Fastify({
  bodyLimit: BODY_LIMIT_IN_BYTES,
  ignoreTrailingSlash: true,
  logger: true,
}).withTypeProvider<ZodTypeProvider>();

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

server.register(app);

async function start() {
  try {
    await server.listen({
      port: 3000,
      host: "0.0.0.0",
    });
    await setupCustomDomainRouting(server);
    startSchedulers(server.prisma);

    server.log.info(`Servidor escutando em http://localhost:3000`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
