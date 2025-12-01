import { Prisma, PrismaClient, Template } from "@prisma/client";

export interface ITemplateRepository {
  create(data: Prisma.TemplateCreateArgs): Promise<Template>;
  findUserTemplates(userId: string): Promise<Template[]>;
  findPublicTemplates(args: {
    where: Prisma.TemplateWhereInput;
    orderBy: Prisma.TemplateOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<Template[]>;
  countPublicTemplates(where: Prisma.TemplateWhereInput): Promise<number>;
  findById(id: string): Promise<Template | null>;
  findPublicById(id: string): Promise<Template | null>;
  favorite(userId: string, templateId: string): Promise<void>;
  unfavorite(userId: string, templateId: string): Promise<void>;
  deleteByIdAndCreator(templateId: string, userId: string): Promise<Template>;
}

export class TemplateRepository implements ITemplateRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Prisma.TemplateCreateArgs): Promise<Template> {
    return this.prisma.template.create(data);
  }

  async findUserTemplates(userId: string): Promise<Template[]> {
    return this.prisma.template.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true } },
        tags: { select: { name: true } },
        _count: { select: { favoritedBy: true } },
      },
    });
  }

  async findPublicTemplates(args: {
    where: Prisma.TemplateWhereInput;
    orderBy: Prisma.TemplateOrderByWithRelationInput;
    skip: number;
    take: number;
  }): Promise<Template[]> {
    return this.prisma.template.findMany({
      ...args,
      include: {
        creator: { select: { id: true, name: true } },
        tags: { select: { name: true } },
        _count: { select: { favoritedBy: true } },
      },
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
