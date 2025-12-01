import { FastifyRequest, FastifyReply } from "fastify";
import { LoginInput, RegisterUserInput, VerifyEmailInput } from "./auth.schema";

import {
  AuthService,
  InvalidTokenError,
  UnverifiedEmailError,
} from "./auth.service";
import {
  EmailInUseError,
  IncorrectPasswordError,
  UserNotFoundError,
} from "../users/user.service";

export class AuthController {
  constructor(private authService: AuthService) {}

  discordLoginHandler = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const discordAuthUrl = new URL("https://discord.com/api/oauth2/authorize");
    discordAuthUrl.searchParams.set(
      "client_id",
      process.env.DISCORD_CLIENT_ID!
    );
    discordAuthUrl.searchParams.set(
      "redirect_uri",
      process.env.DISCORD_REDIRECT_URI!
    );
    discordAuthUrl.searchParams.set("response_type", "code");
    discordAuthUrl.searchParams.set("scope", "identify email"); // Escopos que queremos

    // Redireciona o cliente para a URL de autorização do Discord
    return reply.redirect(discordAuthUrl.toString());
  };

  discordCallbackHandler = async (
    request: FastifyRequest<{ Querystring: { code: string } }>,
    reply: FastifyReply
  ) => {
    const { code } = request.query;
    if (!code) {
      return reply.redirect(
        `${process.env.FRONTEND_URL}/login?error=discord_login_failed`
      );
    }

    try {
      const { user } = await this.authService.handleDiscordCallback(code);

      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
      const token = await reply.jwtSign(payload);

      return reply.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${token}`
      );
    } catch (error) {
      console.error("Discord callback error:", error);
      return reply.redirect(
        `${process.env.FRONTEND_URL}/login?error=discord_login_failed`
      );
    }
  };

  registerHandler = async (
    request: FastifyRequest<{ Body: RegisterUserInput }>,
    reply: FastifyReply
  ) => {
    try {
      await this.authService.register(request.body);
      return reply.code(201).send({
        message:
          "Usuário registrado. Verifique seu e-mail para ativar a conta.",
      });
    } catch (error: any) {
      if (error instanceof EmailInUseError) {
        return reply.code(409).send({ message: error.message });
      }
      console.error(error);
      return reply.code(500).send({ message: "Erro ao registrar usuário." });
    }
  };

  loginHandler = async (
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ) => {
    try {
      const user = await this.authService.login(request.body);

      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
      const token = await reply.jwtSign(payload);

      return { token };
    } catch (error) {
      if (error instanceof IncorrectPasswordError) {
        return reply.code(401).send({ message: "E-mail ou senha inválidos." });
      }
      if (error instanceof UnverifiedEmailError) {
        return reply.code(403).send({ message: error.message });
      }
      console.error(error);
      return reply.code(500).send({ message: "Erro ao fazer login." });
    }
  };

  verifyEmailHandler = async (
    request: FastifyRequest<{ Body: VerifyEmailInput }>,
    reply: FastifyReply
  ) => {
    try {
      await this.authService.verifyEmail(request.body);
      return reply
        .code(200)
        .send({ message: "E-mail verificado com sucesso!" });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return reply.code(404).send({ message: error.message });
      }
      if (error instanceof InvalidTokenError) {
        return reply.code(400).send({ message: error.message });
      }
      console.error(error);
      return reply.code(500).send({ message: "Erro ao verificar e-mail." });
    }
  };
}
