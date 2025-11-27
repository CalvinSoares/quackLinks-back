import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { AuthController } from "./auth.controller";
import {
  registerUserSchema,
  loginSchema,
  verifyEmailSchema,
} from "./auth.schema";

const authRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const authController = new AuthController(server);

  server.get("/discord", authController.discordLoginHandler);
  server.get("/discord/callback", authController.discordCallbackHandler);

  server.post(
    "/register",
    { schema: registerUserSchema },
    authController.registerHandler
  );
  server.post("/login", { schema: loginSchema }, authController.loginHandler);

  server.post(
    "/verify-email",
    { schema: verifyEmailSchema },
    authController.verifyEmailHandler
  );
};

export default authRoutes;
