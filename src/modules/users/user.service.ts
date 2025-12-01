import {
  RegisterUserInput,
  UpdateEmailInput,
  UpdatePasswordInput,
  UpdateUserInput,
} from "./user.schema";
import bcrypt from "bcrypt";

import { PublicUser, UserRepository } from "./user.repository";

export class UserNotFoundError extends Error {
  constructor() {
    super("Usuário não encontrado.");
  }
}
export class IncorrectPasswordError extends Error {
  constructor() {
    super("Senha atual incorreta.");
  }
}
export class EmailInUseError extends Error {
  constructor() {
    super("Este e-mail já está em uso.");
  }
}
export class ExternalProviderLoginError extends Error {
  constructor() {
    super("Este usuário deve fazer login com um provedor externo.");
  }
}

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(input: RegisterUserInput) {
    const hashedPassword = await bcrypt.hash(input.password, 10);
    return this.userRepository.create({
      email: input.email,
      name: input.name,
      password: hashedPassword,
    });
  }

  async unlinkDiscordAccount(userId: string) {
    await this.userRepository.deleteDiscordAccount(userId);

    const updatedUser = await this.userRepository.findById(userId);

    if (!updatedUser) throw new UserNotFoundError();
    return updatedUser;
  }

  async findUserByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findUserById(id: string): Promise<PublicUser | null> {
    return this.userRepository.findById(id);
  }

  async findUsers(): Promise<PublicUser[]> {
    return this.userRepository.findAll();
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<PublicUser> {
    return this.userRepository.update(id, data);
  }

  async updateUserEmail(
    userId: string,
    input: UpdateEmailInput
  ): Promise<PublicUser> {
    // O repositório precisa retornar o usuário completo aqui para a verificação de senha
    const user = await this.userRepository.findByEmail(input.newEmail);
    if (!user) throw new UserNotFoundError();
    if (!user.password) throw new ExternalProviderLoginError();

    const isPasswordMatch = await bcrypt.compare(
      input.currentPassword,
      user.password
    );
    if (!isPasswordMatch) throw new IncorrectPasswordError();

    const existingUserWithNewEmail = await this.userRepository.findByEmail(
      input.newEmail
    );
    if (existingUserWithNewEmail && existingUserWithNewEmail.id !== userId) {
      throw new EmailInUseError();
    }

    return this.userRepository.update(userId, {
      email: input.newEmail,
      emailVerified: null, // Força reverificação
    });
  }

  async updateUserPassword(
    userId: string,
    input: UpdatePasswordInput
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError();

    // Rebuscamos o usuário completo para obter a hash da senha
    const fullUser = await this.userRepository.findByEmail(user.email!);
    if (!fullUser?.password) throw new ExternalProviderLoginError();

    const isPasswordMatch = await bcrypt.compare(
      input.currentPassword,
      fullUser.password
    );
    if (!isPasswordMatch) throw new IncorrectPasswordError();

    const hashedNewPassword = await bcrypt.hash(input.newPassword, 10);
    await this.userRepository.update(userId, { password: hashedNewPassword });
  }

  async deleteUser(id: string): Promise<PublicUser> {
    return this.userRepository.deleteById(id);
  }
}
