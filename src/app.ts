import { join } from "node:path";
import AutoLoad, { AutoloadPluginOptions } from "@fastify/autoload";
import { FastifyPluginAsync, FastifyServerOptions } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import fastifyCors from "@fastify/cors";
import fastifyRawBody from "fastify-raw-body";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import passport from "@fastify/passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}

const options: AppOptions = {
  ignoreTrailingSlash: true,
  logger: true,
};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(fastifyCors, {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  });

  await fastify.register(fastifyRawBody, {
    field: "rawBody",
    global: false,
    encoding: "utf8",
    runFirst: true,
  });

  await fastify.register(fastifyCookie);
  await fastify.register(fastifySession, {
    secret: process.env.SESSION_SECRET!,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    },
  });

  passport.registerUserSerializer(async (user: any) => user.id);
  passport.registerUserDeserializer(async (id: string) => {
    return await fastify.prisma.user.findUnique({ where: { id } });
  });

  passport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey:
          process.env.JWT_SECRET ||
          "super-secret-key-change-this-in-production",
      },
      async (jwt_payload, done) => {
        try {
          const user = await fastify.prisma.user.findUnique({
            where: { id: jwt_payload.id },
          });

          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  await fastify.register(passport.initialize());
  await fastify.register(passport.secureSession());

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
