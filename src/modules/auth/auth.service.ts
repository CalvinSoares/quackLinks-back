import { User } from "@prisma/client";
import bcrypt from "bcrypt";
import axios from "axios";
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

interface DiscordTokenResponse {
  access_token: string;
}

interface DiscordUserResponse {
  id: string;
  username: string;
  avatar: string | null;
  email: string | null;
  verified: boolean;
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

  async handleDiscordCallback(
    code: string
  ): Promise<{ user: User; isNewUser: boolean }> {
    const tokenParams = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    });

    const tokenRes = await axios.post<DiscordTokenResponse>(
      "https://discord.com/api/oauth2/token",
      tokenParams,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get<DiscordUserResponse>(
      "https://discord.com/api/users/@me",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const discordUser = userRes.data;

    const discordAvatarUrl = getDiscordAvatarUrl(
      discordUser.id,
      discordUser.avatar
    );

    const account = await this.accountRepository.findByProviderAccountId(
      "discord",
      discordUser.id
    );

    let user: User;
    let isNewUser = false;

    if (account) {
      user = account.user;

      await this.userRepository.update(user.id, { discordAvatarUrl });
    } else {
      isNewUser = true;
      let existingUser: User | null = null;

      if (discordUser.email && discordUser.verified) {
        existingUser = await this.userRepository.findByEmail(discordUser.email);
      }

      if (existingUser) {
        user = existingUser;
      } else {
        const newPublicUser = await this.userRepository.create({
          name: discordUser.username,
          email:
            discordUser.email && discordUser.verified
              ? discordUser.email
              : null,
          emailVerified:
            discordUser.email && discordUser.verified ? new Date() : null,
          discordAvatarUrl: discordAvatarUrl,
        });

        user = (await this.userRepository.findFullUserById(newPublicUser.id))!;
      }

      await this.accountRepository.create({
        userId: user.id,
        type: "oauth",
        provider: "discord",
        providerAccountId: discordUser.id,
        accessToken,
      });
    }

    return { user, isNewUser };
  }
}
