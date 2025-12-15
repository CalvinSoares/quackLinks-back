import { PrismaClient, Block } from "@prisma/client";
import { CreateBlockInput, UpdateBlockInput } from "./blocks.schema";

export class BlockRepository {
  constructor(private prisma: PrismaClient) {}

  async create(
    pageId: string,
    data: CreateBlockInput,
    order: number
  ): Promise<Block> {
    return this.prisma.block.create({
      data: {
        pageId,
        type: data.type,
        content: data.content ?? {}, // Garante que não seja null se undefined
        isVisible: data.isVisible,
        order,
      },
    });
  }

  async findById(id: string): Promise<Block | null> {
    return this.prisma.block.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: UpdateBlockInput): Promise<Block> {
    // Filtra undefined para não sobrescrever com null
    return this.prisma.block.update({
      where: { id },
      data: {
        content: data.content ?? undefined,
        isVisible: data.isVisible,
        type: data.type,
      },
    });
  }

  async delete(id: string): Promise<Block> {
    return this.prisma.block.delete({
      where: { id },
    });
  }

  // Transação para atualizar a ordem de vários blocos de uma vez
  async reorder(items: { id: string; order: number }[]): Promise<void> {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.block.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );
  }

  // Pega o maior 'order' atual da página para adicionar novos no final
  async getMaxOrder(pageId: string): Promise<number> {
    const result = await this.prisma.block.findFirst({
      where: { pageId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    return result?.order ?? -1;
  }
}
