import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { UserService } from "./user.service";
import {
  UpdateEmailInput,
  UpdatePasswordInput,
  UpdateUserInput,
} from "./user.schema"; // Schemas Zod

export class UserController {
  private userService: UserService;

  // O controller agora depende da instância do fastify para acessar o prisma e jwt
  constructor(fastify: FastifyInstance) {
    this.userService = new UserService(fastify.prisma);
  }

  getMeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    // request.user é populado pelo nosso hook de autenticação
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
      // Retorna o usuário atualizado para o frontend poder sincronizar o estado
      return reply.send(updatedUser);
    } catch (error) {
      console.error("Erro ao desvincular conta do Discord:", error);
      return reply
        .code(500)
        .send({ message: "Não foi possível desvincular a conta." });
    }
  };

  // GET / - Lista todos os usuários
  getUsersHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await this.userService.findUsers();
    return users;
  };

  // GET /:id - Pega um usuário específico
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

  // PUT /:id - Atualiza um usuário
  updateUserHandler = async (
    request: FastifyRequest<{ Body: UpdateUserInput; Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    // Regra de negócio: um usuário só pode editar a si mesmo (ou um admin)
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
    // Ações de serviço agora lidam com o reply para evitar try/catch repetitivo aqui
    await this.userService.updateUserEmail(req.user.id, req.body, reply);

    // Se o serviço não enviou uma resposta de erro, enviamos sucesso.
    if (!reply.sent) {
      // TODO: Reenviar e-mail de verificação para o novo endereço
      return reply.code(200).send({
        message:
          "E-mail atualizado. Por favor, verifique seu novo endereço de e-mail.",
      });
    }
  };

  updatePasswordHandler = async (
    req: FastifyRequest<{ Body: UpdatePasswordInput }>,
    reply: FastifyReply
  ) => {
    await this.userService.updateUserPassword(req.user.id, req.body, reply);
    if (!reply.sent) {
      return reply.code(200).send({ message: "Senha atualizada com sucesso." });
    }
  };

  // DELETE /:id - Deleta um usuário
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
