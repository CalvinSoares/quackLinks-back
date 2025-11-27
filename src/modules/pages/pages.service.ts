import { Prisma, PrismaClient } from "@prisma/client";

export class PageService {
  constructor(private prisma: PrismaClient) {}

  // Busca uma página pública e seus links ordenados
  async getPageBySlug(slug: string) {
    const page = await this.prisma.page.findUnique({
      where: { slug },
      include: {
        links: {
          orderBy: { order: "asc" },
        },
        user: {
          select: {
            discordAvatarUrl: true,
            useDiscordAvatar: true,
          },
        },
        audios: {
          orderBy: { order: "asc" },
        },
      },
    });

    return page;
  }

  // Busca a página do usuário logado. Se não existir, cria uma padrão.
  async getOrCreateMyPage(userId: string, userName: string) {
    const existingPage = await this.prisma.page.findUnique({
      where: { userId },
      include: {
        links: {
          orderBy: { order: "asc" },
        },
        user: {
          select: {
            discordAvatarUrl: true,
            useDiscordAvatar: true,
          },
        },
        audios: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (existingPage) {
      return existingPage;
    }

    // Cria uma página padrão se for o primeiro acesso do usuário
    const defaultSlug = `${userName
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Math.random().toString(36).substring(2, 6)}`;

    return this.prisma.page.create({
      data: {
        userId,
        slug: defaultSlug,
        title: `${userName}'s Page`,
      },
      include: {
        links: {
          orderBy: { order: "asc" },
        },
        audios: true,
        user: {
          select: {
            discordAvatarUrl: true,
            useDiscordAvatar: true,
          },
        },
      },
    });
  }

  // Atualiza a página do usuário logado
  async updateMyPage(userId: string, data: Prisma.PageUpdateInput) {
    // Primeiro, busca a página para garantir que ela pertence ao usuário
    const page = await this.prisma.page.findUnique({ where: { userId } });
    if (!page) {
      throw new Error("Página não encontrada."); // Será tratado como 404 no controller
    }

    return this.prisma.page.update({
      where: { id: page.id },
      data,
      include: {
        links: { orderBy: { order: "asc" } },
        audios: {
          orderBy: { order: "asc" },
        },
        user: {
          select: {
            discordAvatarUrl: true,
            useDiscordAvatar: true,
          },
        },
      },
    });
  }
}
