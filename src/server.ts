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

    const customDomain = await server.prisma.customDomain.findUnique({
      where: { domain: hostname, verified: true },
      include: { user: { include: { Page: true } } },
    });

    if (customDomain && customDomain.user.Page) {
      const slug = customDomain.user.Page.slug;

      request.raw.url = `/${slug}`;
      console.log(`[CustomDomain] Roteando '${hostname}' para '/${slug}'`);
    } else {
      reply
        .code(404)
        .send({ message: `Domínio '${hostname}' não configurado.` });
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
