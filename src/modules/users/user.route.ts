import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { UserController } from "./user.controller";
import {
  updateEmailSchema,
  updatePasswordSchema,
  updateUserSchema,
  userIdSchema,
} from "./user.schema";

const userRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const userController = new UserController(server.userService);

  // Aplica o hook de autenticação a TODAS as rotas deste plugin
  server.addHook("onRequest", server.authenticate);

  // A rota /me deve vir antes de /:id para não ser confundida com um parâmetro
  server.get("/me", userController.getMeHandler);

  server.get("/", userController.getUsersHandler);
  server.get(
    "/:id",
    { schema: userIdSchema },
    userController.getUserByIdHandler
  );
  server.put(
    "/:id",
    { schema: updateUserSchema },
    userController.updateUserHandler
  );

  server.put(
    "/email",
    { schema: updateEmailSchema },
    userController.updateEmailHandler
  );

  server.put(
    "/password",
    { schema: updatePasswordSchema },
    userController.updatePasswordHandler
  );

  server.delete(
    "/:id",
    { schema: userIdSchema },
    userController.deleteUserHandler
  );

  server.delete("/me/connections/discord", userController.unlinkDiscordHandler);
};

export default userRoutes;
