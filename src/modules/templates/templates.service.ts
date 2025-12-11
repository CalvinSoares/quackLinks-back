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
    const {
      id,
      slug,
      userId,
      viewCount,
      createdAt,
      updatedAt,
      user,
      links,
      audios,
      ...restOfPageData
    } = page;

    const templateLinks = links?.map((link) => ({
      title: link.title,
      url: link.url,
      order: link.order,
    }));

    const templateAudios = audios?.map((audio) => ({
      title: audio.title,
      url: audio.url,
      coverUrl: audio.coverUrl,
      order: audio.order,
      isActive: audio.isActive,
    }));

    const finalPageData = {
      ...restOfPageData,
      links: templateLinks,
      audios: templateAudios,
    };

    return finalPageData as unknown as Prisma.JsonObject;
  }

  async createTemplate(userId: string, data: CreateTemplateInput) {
    const userPage = await this.pageRepository.findByUserId(userId);
    if (!userPage) throw new PageNotFoundError();

    console.log(
      "DADOS DA PÁGINA RECEBIDOS PELO SERVIÇO:",
      JSON.stringify(userPage, null, 2)
    );

    const pageData = this.buildPageData(userPage);

    console.log(
      "DADOS FINAIS A SEREM SALVOS NO TEMPLATE:",
      JSON.stringify(pageData, null, 2)
    );

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

  async listFavoriteTemplates(userId: string) {
    return this.templateRepository.findFavoriteTemplates(userId);
  }

  async listRecentTemplates() {
    return this.templateRepository.findRecentTemplates();
  }

  async listPopularTags() {
    return this.templateRepository.findPopularTags(10);
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
