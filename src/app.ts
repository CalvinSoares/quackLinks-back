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
import dependencies from "./plugins/dependencies";

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
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
  export interface FastifyRequest {
    user: FastifyJWT["user"];
  }
}

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}

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
    field: "rawBody",
    global: false,
    encoding: "utf8",
    runFirst: true,
  });

  void fastify.register(dependencies);

  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  void fastify.register(AutoLoad, {
    dir: join(__dirname, "modules"),
    options: { prefix: "/api/v1", ...opts },
    dirNameRoutePrefix: true,
  });
};

export default app;
export { app, options };
