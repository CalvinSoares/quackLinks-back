import { PrismaClient, User } from "@prisma/client";
import { UserService } from "../users/user.service";
import axios from "axios";
import { FastifyInstance } from "fastify";

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
  private userService: UserService;

  constructor(private prisma: PrismaClient) {
    this.userService = new UserService(prisma);
  }

  // Lógica do callback do Discord
  async handleDiscordCallback(
    code: string,
    server: FastifyInstance
  ): Promise<{ token: string; isNewUser: boolean }> {
    // 1. Trocar código por access token
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

    // 2. Obter informações do usuário do Discord
    const userRes = await axios.get<DiscordUserResponse>(
      "https://discord.com/api/users/@me",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const discordUser = userRes.data;

    const discordAvatarUrl = getDiscordAvatarUrl(
      discordUser.id,
      discordUser.avatar
    );

    // 3. Procurar se já existe uma conta vinculada
    let account = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "discord",
          providerAccountId: discordUser.id,
        },
      },
      include: { user: true },
    });

    let user: User;
    let isNewUser = false;

    if (account) {
      user = account.user;

      await this.prisma.user.update({
        where: { id: user.id },
        data: { discordAvatarUrl },
      });
    } else {
      // 4b. Nova conta, precisamos criar o usuário e a conta
      isNewUser = true;

      // Opcional: Verificar se já existe um usuário com este e-mail
      if (discordUser.email && discordUser.verified) {
        const existingUserByEmail = await this.userService.findUserByEmail(
          discordUser.email
        );
        if (existingUserByEmail) {
          // Se já existe, apenas vincula a conta do Discord a ele
          user = existingUserByEmail;
        }
      }

      // Se nenhum usuário foi encontrado, cria um novo
      if (!user!) {
        user = await this.prisma.user.create({
          data: {
            name: discordUser.username,
            email:
              discordUser.email && discordUser.verified
                ? discordUser.email
                : null,
            emailVerified:
              discordUser.email && discordUser.verified ? new Date() : null,
            discordAvatarUrl: discordAvatarUrl,
          },
        });
      }

      // Cria o vínculo da conta
      await this.prisma.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "discord",
          providerAccountId: discordUser.id,
          access_token: accessToken,
        },
      });
    }

    // 5. Gerar JWT e retornar
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = await server.jwt.sign(payload);

    return { token, isNewUser };
  }
}
