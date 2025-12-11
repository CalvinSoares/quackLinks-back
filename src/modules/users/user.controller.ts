import { FastifyRequest, FastifyReply } from "fastify";
import {
  EmailInUseError,
  IncorrectPasswordError,
  UserNotFoundError,
  UserService,
} from "./user.service";
import { z } from "zod";
import {
  updateEmailSchema,
  updatePasswordSchema,
  updateUserSchema,
  userIdSchema,
} from "./user.schema";
import { User as PrismaUser } from "@prisma/client";

type GetUserByIdRequest = FastifyRequest<{
  Params: z.infer<typeof userIdSchema.params>;
}>;

type UpdateUserRequest = FastifyRequest<{
  Params: z.infer<typeof updateUserSchema.params>;
  Body: z.infer<typeof updateUserSchema.body>;
}>;

type UpdateEmailRequest = FastifyRequest<{
  Body: z.infer<typeof updateEmailSchema.body>;
}>;

type UpdatePasswordRequest = FastifyRequest<{
  Body: z.infer<typeof updatePasswordSchema.body>;
}>;

type DeleteUserRequest = FastifyRequest<{
  Params: z.infer<typeof userIdSchema.params>;
}>;

export class UserController {
  constructor(private userService: UserService) {}

  getMeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }

    const user = request.user as PrismaUser;
    const fullUser = await this.userService.findUserById(user.id);

    if (!fullUser) {
      return reply.code(404).send({ message: "Usuário não encontrado." });
    }
    return fullUser;
  };

  unlinkDiscordHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    if (!request.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }

    const user = request.user as PrismaUser;
    try {
      const updatedUser = await this.userService.unlinkDiscordAccount(user.id);
      return reply.send(updatedUser);
    } catch (error) {
      console.error("Erro ao desvincular conta do Discord:", error);
      return reply
        .code(500)
        .send({ message: "Não foi possível desvincular a conta." });
    }
  };

  getUsersHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await this.userService.findUsers();
    return users;
  };

  // --- SOLUÇÃO AQUI ---
  // A assinatura usa 'FastifyRequest' genérico (aceita tudo)
  // Dentro, fazemos o cast 'as GetUserByIdRequest' para ter intellisense seguro.
  public getUserByIdHandler = async (
    req: FastifyRequest,
    reply: FastifyReply
  ) => {
    const request = req as GetUserByIdRequest; // Tipagem segura aqui dentro

    const user = await this.userService.findUserById(request.params.id);
    if (!user) {
      return reply.code(404).send({ message: "Usuário não encontrado." });
    }
    return user;
  };

  public updateUserHandler = async (
    req: FastifyRequest,
    reply: FastifyReply
  ) => {
    const request = req as UpdateUserRequest;

    if (!request.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }

    const user = request.user as PrismaUser;

    if (user.id !== request.params.id) {
      return reply
        .code(403)
        .send({ message: "Você não tem permissão para editar este usuário." });
    }
    const updatedUser = await this.userService.updateUser(
      request.params.id,
      request.body
    );
    return updatedUser;
  };

  public updateEmailHandler = async (
    req: FastifyRequest,
    reply: FastifyReply
  ) => {
    const request = req as UpdateEmailRequest;

    if (!request.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = request.user as PrismaUser;
    try {
      await this.userService.updateUserEmail(user.id, request.body);
      return reply.code(200).send({
        message:
          "E-mail atualizado com sucesso. Por favor, verifique sua caixa de entrada.",
      });
    } catch (error) {
      if (error instanceof UserNotFoundError)
        return reply.code(404).send({ message: error.message });
      if (error instanceof IncorrectPasswordError)
        return reply.code(401).send({ message: error.message });
      if (error instanceof EmailInUseError)
        return reply.code(409).send({ message: error.message });

      console.error(error);
      return reply
        .code(500)
        .send({ message: "Erro interno ao atualizar e-mail." });
    }
  };

  public updatePasswordHandler = async (
    req: FastifyRequest,
    reply: FastifyReply
  ) => {
    const request = req as UpdatePasswordRequest;

    if (!request.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }

    const user = request.user as PrismaUser;

    try {
      await this.userService.updateUserPassword(user.id, request.body);
      return reply.code(200).send({ message: "Senha atualizada com sucesso." });
    } catch (error) {
      if (error instanceof UserNotFoundError)
        return reply.code(404).send({ message: error.message });
      if (error instanceof IncorrectPasswordError)
        return reply.code(401).send({ message: error.message });

      console.error(error);
      return reply
        .code(500)
        .send({ message: "Erro interno ao atualizar senha." });
    }
  };

  public deleteUserHandler = async (
    req: FastifyRequest,
    reply: FastifyReply
  ) => {
    const request = req as DeleteUserRequest;

    if (!request.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }

    const user = request.user as PrismaUser;

    if (user.id !== request.params.id) {
      return reply
        .code(403)
        .send({ message: "Você não tem permissão para deletar este usuário." });
    }
    const deletedUser = await this.userService.deleteUser(request.params.id);
    return reply
      .code(200)
      .send({ message: "Usuário deletado com sucesso.", user: deletedUser });
  };
}
