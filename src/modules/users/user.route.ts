import { FastifyPluginAsync } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { UserController } from "./user.controller";
import {
  updateEmailSchema,
  updatePasswordSchema,
  updateUserSchema,
  userIdSchema,
} from "./user.schema";
import { authenticateJwt } from "../../plugins/authenticate";

const userRoutes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const server = fastify.withTypeProvider<ZodTypeProvider>();
  const userController = new UserController(server.userService);

  server.get(
    "/me",
    { preHandler: [authenticateJwt] },
    userController.getMeHandler
  );

  server.get(
    "/",
    { preHandler: [authenticateJwt] },
    userController.getUsersHandler
  );
  server.get(
    "/:id",
    { schema: userIdSchema, preHandler: [authenticateJwt] },
    userController.getUserByIdHandler
  );
  server.put(
    "/:id",
    { schema: updateUserSchema, preHandler: [authenticateJwt] },
    userController.updateUserHandler
  );

  server.put(
    "/email",
    { schema: updateEmailSchema, preHandler: [authenticateJwt] },
    userController.updateEmailHandler
  );

  server.put(
    "/password",
    { schema: updatePasswordSchema, preHandler: [authenticateJwt] },
    userController.updatePasswordHandler
  );

  server.delete(
    "/:id",
    { schema: userIdSchema, preHandler: [authenticateJwt] },
    userController.deleteUserHandler
  );

  server.delete(
    "/me/connections/discord",
    { preHandler: [authenticateJwt] },
    userController.unlinkDiscordHandler
  );
};

export default userRoutes;
