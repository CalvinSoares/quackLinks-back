import { Prisma, PrismaClient } from "@prisma/client";

const pageInclude = {
  links: { orderBy: { order: "asc" } as const },
  audios: { orderBy: { order: "asc" } as const },
  user: {
    select: {
      discordAvatarUrl: true,
      useDiscordAvatar: true,
      role: true,
    },
  },
};

export type PageWithDetails = Prisma.PageGetPayload<{
  include: typeof pageInclude;
}>;

export interface IPageRepository {
  findBySlug(slug: string): Promise<PageWithDetails | null>;
  findByUserId(userId: string): Promise<PageWithDetails | null>;
  create(data: Prisma.PageCreateInput): Promise<PageWithDetails>;
  update(
    pageId: string,
    data: Prisma.PageUpdateInput
  ): Promise<PageWithDetails>;
}

export class PageRepository implements IPageRepository {
  constructor(private prisma: PrismaClient) {}

  async findBySlug(slug: string): Promise<PageWithDetails | null> {
    return this.prisma.page.findUnique({
      where: { slug },
      include: pageInclude,
    });
  }

  async findByUserId(userId: string): Promise<PageWithDetails | null> {
    return this.prisma.page.findUnique({
      where: { userId },
      include: pageInclude,
    });
  }

  async create(data: Prisma.PageCreateInput): Promise<PageWithDetails> {
    return this.prisma.page.create({
      data,
      include: pageInclude,
    });
  }

  async update(
    pageId: string,
    data: Prisma.PageUpdateInput
  ): Promise<PageWithDetails> {
    return this.prisma.page.update({
      where: { id: pageId },
      data,
      include: pageInclude,
    });
  }
}
