import { Prisma, PrismaClient, TemplateVisibility } from "@prisma/client";
import { CreateTemplateInput, ListTemplatesQuery } from "./templates.schema";

export class TemplateService {
  constructor(private prisma: PrismaClient) {}

  async createTemplate(userId: string, data: CreateTemplateInput) {
    // 1. Buscar a página atual do usuário para pegar os dados
    const userPage = await this.prisma.page.findUnique({
      where: { userId },
    });

    if (!userPage) {
      throw new Error(
        "Página do usuário não encontrada para criar o template."
      );
    }

    // 2. Montar o objeto `pageData` com os campos relevantes
    const pageData = {
      title: userPage.title,
      bio: userPage.bio,
      avatarUrl: userPage.avatarUrl,
      backgroundUrl: userPage.backgroundUrl,
      backgroundColor: userPage.backgroundColor,
      location: userPage.location,

      cursorUrl: userPage.cursorUrl,
      theme: userPage.theme,
    };

    // 3. Criar o template no banco
    const template = await this.prisma.template.create({
      data: {
        name: data.name,
        previewImageUrl: data.previewImageUrl,
        visibility: data.visibility as TemplateVisibility,
        pageData: pageData,
        creatorId: userId,
        // Conecta ou cria as tags fornecidas
        tags: {
          connectOrCreate: data.tags.map((tagName) => ({
            where: { name: tagName.toLowerCase() },
            create: { name: tagName.toLowerCase() },
          })),
        },
      },
      include: {
        creator: { select: { name: true } },
        tags: true,
      },
    });

    return template;
  }

  async listUserTemplates(userId: string) {
    const templates = await this.prisma.template.findMany({
      where: {
        creatorId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        creator: { select: { id: true, name: true } },
        tags: { select: { name: true } },
        _count: { select: { favoritedBy: true } },
      },
    });

    return { templates };
  }

  async listPublicTemplates(query: ListTemplatesQuery) {
    const { search, creatorName, tags, sortBy, page, limit } = query;
    const where: Prisma.TemplateWhereInput = {
      visibility: "PUBLIC",
    };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (creatorName) {
      where.creator = { name: { contains: creatorName, mode: "insensitive" } };
    }

    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
      where.tags = { some: { name: { in: tagList } } };
    }

    const orderBy: Prisma.TemplateOrderByWithRelationInput = {};
    if (sortBy === "newest") {
      orderBy.createdAt = "desc";
    } else if (sortBy === "oldest") {
      orderBy.createdAt = "asc";
    } else {
      // 'popular' é o default
      orderBy.favoritedBy = { _count: "desc" };
    }

    const templates = await this.prisma.template.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        creator: { select: { id: true, name: true } },
        tags: { select: { name: true } },
        _count: { select: { favoritedBy: true } }, // Conta quantos favoritos tem
      },
    });

    const total = await this.prisma.template.count({ where });

    return { templates, total, page, limit };
  }

  async getTemplateById(id: string) {
    return this.prisma.template.findFirst({
      where: { id, visibility: "PUBLIC" },
      include: {
        creator: { select: { id: true, name: true } },
        tags: true,
        _count: { select: { favoritedBy: true } },
      },
    });
  }

  async applyTemplate(userId: string, templateId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error("Template não encontrado.");
    }
    // Garante que o pageData seja um objeto válido antes de aplicar
    if (typeof template.pageData !== "object" || template.pageData === null) {
      throw new Error("Dados do template inválidos.");
    }

    const dataToUpdate = template.pageData as Prisma.JsonObject;

    return this.prisma.page.update({
      where: { userId },
      data: {
        title: dataToUpdate.title as string | undefined,
        bio: dataToUpdate.bio as string | undefined,
        avatarUrl: dataToUpdate.avatarUrl as string | undefined,
        backgroundUrl: dataToUpdate.backgroundUrl as string | undefined,
        backgroundColor: dataToUpdate.backgroundColor as string | undefined,
        location: dataToUpdate.location as string | undefined,

        cursorUrl: dataToUpdate.cursorUrl as string | undefined,
        theme: dataToUpdate.theme as string | undefined,
      },
    });
  }

  async favoriteTemplate(userId: string, templateId: string) {
    // Usamos upsert para evitar erro se o registro já existir
    return this.prisma.userFavoriteTemplate.upsert({
      where: { userId_templateId: { userId, templateId } },
      create: { userId, templateId },
      update: {},
    });
  }

  async unfavoriteTemplate(userId: string, templateId: string) {
    return this.prisma.userFavoriteTemplate.delete({
      where: { userId_templateId: { userId, templateId } },
    });
  }

  async deleteTemplate(userId: string, templateId: string) {
    return this.prisma.template.delete({
      where: {
        id: templateId,
        creatorId: userId,
      },
    });
  }
}
