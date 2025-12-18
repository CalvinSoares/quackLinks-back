import { Prisma, PrismaClient } from "@prisma/client";

const pageInclude = {
  links: { orderBy: { order: "asc" } as const },
  audios: { orderBy: { order: "asc" } as const },
  blocks: { orderBy: { order: "asc" } as const },
  user: {
    select: {
      image: true,
      imageProvider: true,
      name: true,
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
  findAllByUser(
    userId: string,
    skip: number,
    take: number,
    search?: string
  ): Promise<PageWithDetails[]>;
  countByUser(userId: string, search?: string): Promise<number>;
  delete(id: string): Promise<PageWithDetails>;
  findById(id: string): Promise<PageWithDetails | null>;
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
    return this.prisma.page.findFirst({
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

  async findById(id: string): Promise<PageWithDetails | null> {
    return this.prisma.page.findUnique({
      where: { id },
      include: pageInclude,
    });
  }

  async findAllByUser(
    userId: string,
    skip: number,
    take: number,
    search: string = ""
  ): Promise<PageWithDetails[]> {
    return this.prisma.page.findMany({
      where: {
        userId,
        title: { contains: search, mode: "insensitive" },
      },
      skip,
      take,
      orderBy: { updatedAt: "desc" },
      include: pageInclude,
    });
  }

  async countByUser(userId: string, search: string = ""): Promise<number> {
    return this.prisma.page.count({
      where: {
        userId,
        title: { contains: search, mode: "insensitive" },
      },
    });
  }

  async delete(id: string): Promise<PageWithDetails> {
    return this.prisma.page.delete({
      where: { id },
      include: pageInclude,
    });
  }
}
