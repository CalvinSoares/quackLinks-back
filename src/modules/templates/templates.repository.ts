import { Prisma, PrismaClient, Template } from "@prisma/client";

export interface ITemplateRepository {
  create(data: Prisma.TemplateCreateArgs): Promise<Template>;
  findUserTemplates(userId: string): Promise<TemplateListItem[]>;
  findPublicTemplates(args: {
    where: Prisma.TemplateWhereInput;
    orderBy: Prisma.TemplateOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<TemplateListItem[]>;
  countPublicTemplates(where: Prisma.TemplateWhereInput): Promise<number>;
  findById(id: string): Promise<Template | null>;
  findPublicById(id: string): Promise<Template | null>;
  findFavoriteTemplates(userId: string): Promise<TemplateListItem[]>;
  findRecentTemplates(): Promise<TemplateListItem[]>;
  findPopularTags(
    limit: number
  ): Promise<{ name: string; _count: { templates: number } }[]>;
  favorite(userId: string, templateId: string): Promise<void>;
  unfavorite(userId: string, templateId: string): Promise<void>;
  deleteByIdAndCreator(templateId: string, userId: string): Promise<Template>;
}

const templateListSelect = {
  id: true,
  name: true,
  previewImageUrl: true,
  visibility: true,
  createdAt: true,
  creatorId: true,
  creator: {
    select: {
      id: true,
      name: true,
    },
  },
  tags: {
    select: {
      name: true,
    },
  },
  _count: {
    select: {
      favoritedBy: true,
    },
  },
};

export type TemplateListItem = Prisma.TemplateGetPayload<{
  select: typeof templateListSelect;
}>;

export class TemplateRepository implements ITemplateRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.TemplateCreateArgs): Promise<Template> {
    return this.prisma.template.create(data);
  }

  async findUserTemplates(userId: string): Promise<TemplateListItem[]> {
    return this.prisma.template.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
      select: templateListSelect,
    });
  }

  async findPublicTemplates(args: {
    where: Prisma.TemplateWhereInput;
    orderBy: Prisma.TemplateOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<TemplateListItem[]> {
    return this.prisma.template.findMany({
      ...args,
      select: templateListSelect,
    });
  }

  async findFavoriteTemplates(userId: string): Promise<TemplateListItem[]> {
    return this.prisma.template.findMany({
      where: {
        favoritedBy: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      select: templateListSelect,
    });
  }

  async findRecentTemplates(): Promise<TemplateListItem[]> {
    return this.prisma.template.findMany({
      where: {
        visibility: "PUBLIC",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
      select: templateListSelect,
    });
  }

  async countPublicTemplates(
    where: Prisma.TemplateWhereInput
  ): Promise<number> {
    return this.prisma.template.count({ where });
  }

  async findById(id: string): Promise<Template | null> {
    return this.prisma.template.findUnique({ where: { id } });
  }

  async findPublicById(id: string): Promise<Template | null> {
    return this.prisma.template.findFirst({
      where: { id, visibility: "PUBLIC" },
      include: {
        creator: { select: { id: true, name: true } },
        tags: true,
        _count: { select: { favoritedBy: true } },
      },
    });
  }

  async findPopularTags(
    limit: number = 10
  ): Promise<{ name: string; _count: { templates: number } }[]> {
    return this.prisma.tag.findMany({
      take: limit,
      select: {
        name: true,
        _count: {
          select: { templates: true },
        },
      },
      orderBy: {
        templates: {
          _count: "desc",
        },
      },
    });
  }

  async favorite(userId: string, templateId: string): Promise<void> {
    await this.prisma.userFavoriteTemplate.upsert({
      where: { userId_templateId: { userId, templateId } },
      create: { userId, templateId },
      update: {},
    });
  }

  async unfavorite(userId: string, templateId: string): Promise<void> {
    await this.prisma.userFavoriteTemplate.delete({
      where: { userId_templateId: { userId, templateId } },
    });
  }

  async deleteByIdAndCreator(
    templateId: string,
    userId: string
  ): Promise<Template> {
    return this.prisma.template.delete({
      where: { id: templateId, creatorId: userId },
    });
  }
}
