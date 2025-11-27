import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { UserService } from "../users/user.service"; // Importa o serviço de outro módulo!
import { LoginInput, RegisterUserInput, VerifyEmailInput } from "./auth.schema";
import bcrypt from "bcrypt";
import { randomInt } from "node:crypto";
import { sendVerificationEmail } from "../../plugins/email";
import { AuthService } from "./auth.service";

export class AuthController {
  private userService: UserService;
  private authService: AuthService;

  constructor(fastify: FastifyInstance) {
    this.userService = new UserService(fastify.prisma);
    this.authService = new AuthService(fastify.prisma);
  }

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
      const { token } = await this.authService.handleDiscordCallback(
        code,
        request.server
      );
      // Redireciona de volta ao frontend com o token
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
      const user = await this.userService.createUser(request.body);
      const token = randomInt(100000, 999999).toString();
      const expires = new Date(Date.now() + 15 * 60 * 1000); // Expira em 15 minutos
      await request.server.prisma.verificationToken.create({
        data: { userId: user.id, token, expires },
      });

      // 3. Envia o e-mail de verificação (simulado)
      await sendVerificationEmail(user.email!, token);

      return reply.code(201).send({
        message:
          "Usuário registrado com sucesso. Verifique seu e-mail para ativar sua conta.",
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        return reply.code(409).send({ message: "E-mail já cadastrado." });
      }
      return reply.code(500).send(error);
    }
  };

  loginHandler = async (
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply
  ) => {
    const user = await this.userService.findUserByEmail(request.body.email);
    if (!user) {
      return reply.code(401).send({ message: "E-mail ou senha inválidos." });
    }

    if (!user.password) {
      return reply.code(401).send({
        message:
          "Este usuário deve fazer login com um provedor externo (ex: Discord).",
      });
    }

    if (!user.emailVerified) {
      return reply.code(403).send({
        message: "Por favor, verifique seu e-mail antes de fazer login.",
      });
    }

    const isMatch = await bcrypt.compare(request.body.password, user.password);
    if (!isMatch) {
      return reply.code(401).send({ message: "E-mail ou senha inválidos." });
    }

    const payload = {
      id: user.id,
      email: user.email!,
      name: user.name,
      role: user.role,
    };
    const token = await reply.jwtSign(payload);

    return { token };
  };

  verifyEmailHandler = async (
    request: FastifyRequest<{ Body: VerifyEmailInput }>,
    reply: FastifyReply
  ) => {
    const { email, token } = request.body;
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      return reply.code(404).send({ message: "Usuário não encontrado." });
    }

    const verificationToken =
      await request.server.prisma.verificationToken.findFirst({
        where: { userId: user.id, token },
      });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return reply.code(400).send({ message: "Código inválido ou expirado." });
    }

    // Atualiza o usuário como verificado e deleta o token
    await request.server.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
    await request.server.prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });

    return reply.code(200).send({ message: "E-mail verificado com sucesso!" });
  };
}
