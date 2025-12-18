import { User } from "@prisma/client";
import bcrypt from "bcrypt";

import {
  EmailInUseError,
  IncorrectPasswordError,
  UserNotFoundError,
} from "../users/user.service";
import { IUserRepository } from "../users/user.repository";
import { IAuthRepository } from "./auth.repository";
import { LoginInput, RegisterUserInput, VerifyEmailInput } from "./auth.schema";
import { randomInt } from "crypto";
import { sendVerificationEmail } from "../../plugins/email";
import { IAccountRepository } from "./account.repository";

export class UnverifiedEmailError extends Error {
  constructor() {
    super("Por favor, verifique seu e-mail antes de fazer login.");
  }
}
export class InvalidTokenError extends Error {
  constructor() {
    super("Código inválido ou expirado.");
  }
}

function getDiscordAvatarUrl(
  userId: string,
  avatarHash: string | null
): string | null {
  if (!avatarHash) return null;
  const extension = avatarHash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=256`;
}

export class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private authRepository: IAuthRepository,
    private accountRepository: IAccountRepository
  ) {}

  async register(input: RegisterUserInput): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new EmailInUseError();
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await this.userRepository.create({
      email: input.email,
      name: input.name,
      password: hashedPassword,
    });

    const token = randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await this.authRepository.createVerificationToken(user.id, token, expires);
    await sendVerificationEmail(user.email!, token);
  }

  async login(input: LoginInput): Promise<User> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user || !user.password) {
      throw new IncorrectPasswordError();
    }
    if (!user.emailVerified) {
      throw new UnverifiedEmailError();
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw new IncorrectPasswordError();
    }
    return user;
  }

  async verifyEmail(input: VerifyEmailInput): Promise<void> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UserNotFoundError();
    }

    const verificationToken = await this.authRepository.findVerificationToken(
      user.id,
      input.token
    );
    if (!verificationToken || verificationToken.expires < new Date()) {
      throw new InvalidTokenError();
    }

    await this.userRepository.update(user.id, { emailVerified: new Date() });
    await this.authRepository.deleteVerificationToken(verificationToken.id);
  }

  private determineProfileImage(
    currentImage: string | null,
    currentProvider: string,
    newProvider: string,
    newImageUrl: string | null
  ): { image: string | null; imageProvider: string } {
    if (!currentImage) {
      return { image: newImageUrl, imageProvider: newProvider };
    }

    if (currentProvider === newProvider) {
      return { image: newImageUrl, imageProvider: newProvider };
    }

    return { image: currentImage, imageProvider: currentProvider };
  }

  async findOrCreateDiscordUser(profile: any): Promise<User> {
    const discordEmail = profile.email;
    if (!discordEmail) {
      throw new Error("Não foi possível obter o e-mail do Discord.");
    }

    const discordAvatar = getDiscordAvatarUrl(profile.id, profile.avatar);

    let user = await this.userRepository.findByEmail(discordEmail);

    if (user) {
      // Atualiza cache e verifica principal
      const { image, imageProvider } = this.determineProfileImage(
        user.image,
        user.imageProvider,
        "DISCORD",
        discordAvatar
      );

      await this.userRepository.update(user.id, {
        discordImage: discordAvatar, // Novo campo de cache
        image,
        imageProvider,
      });
    } else {
      const newUser = await this.userRepository.create({
        email: discordEmail,
        name: profile.username,
        emailVerified: new Date(),
        image: discordAvatar,
        imageProvider: "DISCORD",
        discordImage: discordAvatar,
      });
      user = (await this.userRepository.findFullUserById(newUser.id))!;
    }

    // Garante que a conta OAuth está vinculada ao nosso usuário
    await this.accountRepository.createOrUpdate({
      provider: "discord",
      providerAccountId: profile.id,
      userId: user.id,
      accessToken: profile.accessToken, // O accessToken vem do profile do passport-discord
      // refreshToken: profile.refreshToken // Se a estratégia o fornecer
    });

    return user;
  }

  async findOrCreateGoogleUser(profile: any): Promise<User> {
    const googleEmail = profile.emails?.[0]?.value;
    const googleAvatar = profile.photos?.[0]?.value || null;

    if (!googleEmail) throw new Error("E-mail do Google não encontrado.");

    let user = await this.userRepository.findByEmail(googleEmail);

    if (user) {
      // Usuário existe: Atualiza o cache do Google e verifica se deve mudar a foto principal
      const { image, imageProvider } = this.determineProfileImage(
        user.image,
        user.imageProvider,
        "GOOGLE",
        googleAvatar
      );

      await this.userRepository.update(user.id, {
        googleImage: googleAvatar,
        image,
        imageProvider,
      });
    } else {
      // Novo usuário: Já nasce com a foto do Google
      const newUser = await this.userRepository.create({
        name: profile.displayName,
        email: googleEmail,
        emailVerified: new Date(),
        image: googleAvatar,
        imageProvider: "GOOGLE",
        googleImage: googleAvatar,
      });
      user = (await this.userRepository.findFullUserById(newUser.id))!;
    }

    // Link da Account
    await this.accountRepository.createOrUpdate({
      provider: "google",
      providerAccountId: profile.id,
      userId: user.id,
      accessToken: profile.accessToken,
    });

    return user;
  }
}
