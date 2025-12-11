import { PrismaClient } from "@prisma/client";

export class RedirectRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Encontra um link pelo seu ID e retorna apenas a URL de destino.
   * @param linkId O ID do link.
   * @returns Um objeto contendo a URL, ou null se não for encontrado.
   */
  async findUrlById(linkId: string): Promise<{ url: string } | null> {
    return this.prisma.link.findUnique({
      where: { id: linkId },
      select: { url: true },
    });
  }
}
