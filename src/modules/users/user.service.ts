import { PrismaClient } from "@prisma/client";
import {
  RegisterUserInput,
  UpdateEmailInput,
  UpdatePasswordInput,
  UpdateUserInput,
} from "./user.schema";
import bcrypt from "bcrypt";
import { FastifyReply } from "fastify";

export class UserService {
  constructor(private prisma: PrismaClient) {}

  // Criar (usado pelo módulo de auth)
  async createUser(input: RegisterUserInput) {
    const hashedPassword = await bcrypt.hash(input.password, 10);
    return this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password: hashedPassword,
      },
    });
  }

  async unlinkDiscordAccount(userId: string) {
    // 1. Deleta a entrada na tabela 'Account'
    await this.prisma.account.deleteMany({
      where: {
        userId: userId,
        provider: "discord",
      },
    });

    // 2. Limpa os campos relacionados no modelo 'User'
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        discordAvatarUrl: null,
        useDiscordAvatar: false,
      },
    });

    return updatedUser;
  }

  // Encontrar por e-mail (usado pelo módulo de auth)
  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Encontrar por ID
  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        useDiscordAvatar: true,
        discordAvatarUrl: true,
        role: true,
      },
    });
  }

  // Listar todos os usuários
  async findUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true }, // Nunca retornar a senha
    });
  }

  // Atualizar usuário
  async updateUser(id: string, data: UpdateUserInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }

  async updateUserEmail(
    userId: string,
    input: UpdateEmailInput,
    reply: FastifyReply
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.code(404).send({ message: "Usuário não encontrado." });
    }

    if (!user.password) {
      return reply.code(401).send({
        message:
          "Este usuário deve fazer login com um provedor externo (ex: Discord).",
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      input.currentPassword,
      user.password
    );
    if (!isPasswordMatch) {
      return reply.code(401).send({ message: "Senha atual incorreta." });
    }

    // Verifica se o novo e-mail já está em uso
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.newEmail },
    });
    if (existingUser && existingUser.id !== userId) {
      return reply.code(409).send({ message: "Este e-mail já está em uso." });
    }

    // Atualiza o e-mail e marca como não verificado
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email: input.newEmail,
        emailVerified: null, // Força a reverificação do novo e-mail
      },
    });
  }

  async updateUserPassword(
    userId: string,
    input: UpdatePasswordInput,
    reply: FastifyReply
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.code(404).send({ message: "Usuário não encontrado." });
    }

    if (!user.password) {
      return reply.code(401).send({
        message:
          "Este usuário deve fazer login com um provedor externo (ex: Discord).",
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      input.currentPassword,
      user.password
    );
    if (!isPasswordMatch) {
      return reply.code(401).send({ message: "Senha atual incorreta." });
    }

    const hashedNewPassword = await bcrypt.hash(input.newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });
  }

  // Deletar usuário
  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: { id: true, email: true, name: true },
    });
  }
}
