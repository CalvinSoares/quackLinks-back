import { join } from "node:path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import { FastifyPluginAsync, FastifyServerOptions } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import fastifyCors from "@fastify/cors";
import { FastifyJWT } from "@fastify/jwt";
import fastifyRawBody from "fastify-raw-body";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      id: string;
      name: string;
      email: string | null;
    };
    user: {
      id: string;
      name: string;
      email: string | null;
      role: "FREE" | "PREMIUM";
    };
  }
}

declare module "fastify" {
  export interface FastifyInstance {
    // Adiciona a função 'authenticate' à instância do Fastify
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
  export interface FastifyRequest {
    // Adiciona 'user' ao objeto de requisição, populado pelo jwtVerify
    user: FastifyJWT["user"];
  }
}

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
  ignoreTrailingSlash: true, // Adicione aqui
  logger: true,
};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(fastifyCors, {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  });

  await fastify.register(fastifyRawBody, {
    field: "rawBody", // o nome da propriedade no request (pode ser qualquer nome)
    global: false, // importante: não aplicar globalmente para não impactar performance
    encoding: "utf8", // encoding esperado do Stripe
    runFirst: true, // garante que ele rode antes do parser de JSON do Fastify
  });

  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  void fastify.register(AutoLoad, {
    dir: join(__dirname, "modules"),
    options: { prefix: "/api/v1", ...opts }, // Exemplo: Adicionando um prefixo global para todas as rotas
    dirNameRoutePrefix: true, // <-- MÁGICA ACONTECE AQUI!
  });
};

export default app;
export { app, options };
