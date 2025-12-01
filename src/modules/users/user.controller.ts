import { FastifyRequest, FastifyReply } from "fastify";
import {
  EmailInUseError,
  IncorrectPasswordError,
  UserNotFoundError,
  UserService,
} from "./user.service";
import {
  UpdateEmailInput,
  UpdatePasswordInput,
  UpdateUserInput,
} from "./user.schema";

export class UserController {
  constructor(private userService: UserService) {}

  getMeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await this.userService.findUserById(request.user.id);
    if (!user) {
      return reply.code(404).send({ message: "Usuário não encontrado." });
    }
    return user;
  };

  unlinkDiscordHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const updatedUser = await this.userService.unlinkDiscordAccount(
        request.user.id
      );
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

  getUserByIdHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const user = await this.userService.findUserById(request.params.id);
    if (!user) {
      return reply.code(404).send({ message: "Usuário não encontrado." });
    }
    return user;
  };

  updateUserHandler = async (
    request: FastifyRequest<{ Body: UpdateUserInput; Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    if (request.user.id !== request.params.id) {
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

  updateEmailHandler = async (
    req: FastifyRequest<{ Body: UpdateEmailInput }>,
    reply: FastifyReply
  ) => {
    try {
      await this.userService.updateUserEmail(req.user.id, req.body);
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

  updatePasswordHandler = async (
    req: FastifyRequest<{ Body: UpdatePasswordInput }>,
    reply: FastifyReply
  ) => {
    try {
      await this.userService.updateUserPassword(req.user.id, req.body);
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

  deleteUserHandler = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    if (request.user.id !== request.params.id) {
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
