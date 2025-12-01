import { PrismaClient, Link } from "@prisma/client";
import {
  CreateLinkInput,
  ReorderLinkInput,
  UpdateLinkInput,
} from "./links.schema";

export interface ILinkRepository {
  create(
    pageId: string,
    data: CreateLinkInput & { order: number }
  ): Promise<Link>;
  updateByUserId(
    linkId: string,
    userId: string,
    data: UpdateLinkInput
  ): Promise<Link>;
  deleteByUserId(linkId: string, userId: string): Promise<Link>;
  countByPageId(pageId: string): Promise<number>;
  findByUserId(userId: string): Promise<{ id: string }[]>;
  reorder(updates: ReorderLinkInput): Promise<void>;
}

export class LinkRepository implements ILinkRepository {
  constructor(private prisma: PrismaClient) {}

  async create(
    pageId: string,
    data: CreateLinkInput & { order: number }
  ): Promise<Link> {
    return this.prisma.link.create({
      data: { ...data, pageId },
    });
  }

  async updateByUserId(
    linkId: string,
    userId: string,
    data: UpdateLinkInput
  ): Promise<Link> {
    return this.prisma.link.update({
      where: { id: linkId, page: { userId } },
      data,
    });
  }

  async deleteByUserId(linkId: string, userId: string): Promise<Link> {
    return this.prisma.link.delete({
      where: { id: linkId, page: { userId } },
    });
  }

  async countByPageId(pageId: string): Promise<number> {
    return this.prisma.link.count({
      where: { pageId },
    });
  }

  async findByUserId(userId: string): Promise<{ id: string }[]> {
    return this.prisma.link.findMany({
      where: { page: { userId } },
      select: { id: true },
    });
  }

  async reorder(updates: ReorderLinkInput): Promise<void> {
    const updatePromises = updates.map((update) =>
      this.prisma.link.update({
        where: { id: update.id },
        data: { order: update.order },
      })
    );
    await this.prisma.$transaction(updatePromises);
  }
}
