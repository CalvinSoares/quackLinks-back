import { Prisma, TemplateVisibility } from "@prisma/client";
import { CreateTemplateInput, ListTemplatesQuery } from "./templates.schema";
import { ITemplateRepository } from "./templates.repository";
import { IPageRepository, PageWithDetails } from "../pages/pages.repository";

export class TemplateNotFoundError extends Error {
  constructor() {
    super("Template não encontrado.");
  }
}
export class PageNotFoundError extends Error {
  constructor() {
    super("Página do usuário não encontrada.");
  }
}
export class InsufficientPermissionsError extends Error {
  constructor() {
    super("Permissões insuficientes.");
  }
}

export class TemplateService {
  constructor(
    private templateRepository: ITemplateRepository,
    private pageRepository: IPageRepository
  ) {}

  private buildPageData(page: PageWithDetails): Prisma.JsonObject {
    return {
      title: page.title,
      bio: page.bio,
      avatarUrl: page.avatarUrl,
      backgroundUrl: page.backgroundUrl,
      backgroundColor: page.backgroundColor,
      location: page.location,
      cursorUrl: page.cursorUrl,
      theme: page.theme,
    };
  }

  async createTemplate(userId: string, data: CreateTemplateInput) {
    const userPage = await this.pageRepository.findByUserId(userId);
    if (!userPage) throw new PageNotFoundError();

    const pageData = this.buildPageData(userPage);

    return this.templateRepository.create({
      data: {
        name: data.name,
        previewImageUrl: data.previewImageUrl,
        visibility: data.visibility as TemplateVisibility,
        pageData: pageData,
        creator: { connect: { id: userId } },
        tags: {
          connectOrCreate: data.tags.map((tagName) => ({
            where: { name: tagName.toLowerCase() },
            create: { name: tagName.toLowerCase() },
          })),
        },
      },
    });
  }

  async listUserTemplates(userId: string) {
    return this.templateRepository.findUserTemplates(userId);
  }

  async listPublicTemplates(query: ListTemplatesQuery) {
    const { search, creatorName, tags, sortBy, page, limit } = query;
    const where: Prisma.TemplateWhereInput = { visibility: "PUBLIC" };

    if (search) where.name = { contains: search, mode: "insensitive" };
    if (creatorName)
      where.creator = { name: { contains: creatorName, mode: "insensitive" } };
    if (tags)
      where.tags = {
        some: {
          name: { in: tags.split(",").map((t) => t.trim().toLowerCase()) },
        },
      };

    const orderBy: Prisma.TemplateOrderByWithRelationInput =
      sortBy === "newest"
        ? { createdAt: "desc" }
        : sortBy === "oldest"
        ? { createdAt: "asc" }
        : { favoritedBy: { _count: "desc" } };

    const [templates, total] = await Promise.all([
      this.templateRepository.findPublicTemplates({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.templateRepository.countPublicTemplates(where),
    ]);

    return { templates, total, page, limit };
  }

  async getTemplateById(id: string) {
    return this.templateRepository.findPublicById(id);
  }

  async applyTemplate(userId: string, templateId: string) {
    const template = await this.templateRepository.findById(templateId);
    if (!template) throw new TemplateNotFoundError();
    if (typeof template.pageData !== "object" || template.pageData === null)
      throw new Error("Dados do template inválidos.");

    const dataToUpdate = template.pageData as Prisma.JsonObject;
    return this.pageRepository.update(userId, dataToUpdate);
  }

  async favoriteTemplate(userId: string, templateId: string) {
    await this.templateRepository.favorite(userId, templateId);
  }

  async unfavoriteTemplate(userId: string, templateId: string) {
    await this.templateRepository.unfavorite(userId, templateId);
  }

  async deleteTemplate(userId: string, templateId: string) {
    try {
      await this.templateRepository.deleteByIdAndCreator(templateId, userId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new InsufficientPermissionsError();
      }
      throw error;
    }
  }
}
