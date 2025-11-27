import Fastify from "fastify";
import { FastifyInstance } from "fastify";

import app from "./app";
import "dotenv/config";
import { startSchedulers } from "./scheduler";
const BODY_LIMIT_IN_BYTES = 10 * 1024 * 1024;

async function setupCustomDomainRouting(server: FastifyInstance) {
  server.addHook("onRequest", async (request, reply) => {
    const hostname = request.hostname;
    const appDomain = process.env.APP_DOMAIN!; // 'meusite.com'

    // Ignora se for o domínio principal ou localhost
    if (hostname === appDomain || hostname.includes("localhost")) {
      return;
    }

    // Busca o domínio personalizado no banco
    const customDomain = await server.prisma.customDomain.findUnique({
      where: { domain: hostname, verified: true },
      include: { user: { include: { Page: true } } },
    });

    if (customDomain && customDomain.user.Page) {
      const slug = customDomain.user.Page.slug;

      // Reescreve a URL internamente para que a rota '/:slug' a capture
      request.raw.url = `/${slug}`;
      console.log(`[CustomDomain] Roteando '${hostname}' para '/${slug}'`);
    } else {
      // Se o domínio não for encontrado ou não estiver verificado, pode-se mostrar um 404
      reply
        .code(404)
        .send({ message: `Domínio '${hostname}' não configurado.` });
    }
  });
}

const server = Fastify({
  bodyLimit: BODY_LIMIT_IN_BYTES,
  // Adicione esta opção
  ignoreTrailingSlash: true,

  // Mantenha seu logger se já estiver usando
  logger: true,
});

server.register(app);

async function start() {
  try {
    server.listen({ port: 3000 }, (err, address) => {
      if (err) {
        server.log.error(err);
        process.exit(1);
      }
    });
    await setupCustomDomainRouting(server);
    startSchedulers();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
