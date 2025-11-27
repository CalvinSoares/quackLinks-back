import { PrismaClient } from "@prisma/client";
import {
  CreateLinkInput,
  ReorderLinkInput,
  UpdateLinkInput,
} from "./links.schema";

export class LinkService {
  constructor(private prisma: PrismaClient) {}

  async createLink(userId: string, data: CreateLinkInput) {
    const page = await this.prisma.page.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!page) throw new Error("Página do usuário não encontrada.");

    const linkCount = await this.prisma.link.count({
      where: { pageId: page.id },
    });

    return this.prisma.link.create({
      data: {
        ...data,
        pageId: page.id,
        order: linkCount, // Adiciona o novo link no final da lista
      },
    });
  }

  // Atualiza um link, garantindo que ele pertence ao usuário logado
  async updateLink(userId: string, linkId: string, data: UpdateLinkInput) {
    // A query aninhada `page: { userId }` garante a permissão
    return this.prisma.link.update({
      where: { id: linkId, page: { userId } },
      data,
    });
  }

  // Deleta um link, garantindo que ele pertence ao usuário logado
  async deleteLink(userId: string, linkId: string) {
    return this.prisma.link.delete({
      where: { id: linkId, page: { userId } },
    });
  }

  // Reordena os links em uma única transação
  async reorderLinks(userId: string, updates: ReorderLinkInput) {
    // Validação: Garante que todos os IDs de link fornecidos realmente pertencem ao usuário
    const userLinks = await this.prisma.link.findMany({
      where: { page: { userId } },
      select: { id: true },
    });
    const userLinkIds = new Set(userLinks.map((link) => link.id));
    const allUpdatesAreValid = updates.every((update) =>
      userLinkIds.has(update.id)
    );

    if (!allUpdatesAreValid) {
      throw new Error(
        "Permissão negada: um ou mais links não pertencem a este usuário."
      );
    }

    const updatePromises = updates.map((update) =>
      this.prisma.link.update({
        where: { id: update.id },
        data: { order: update.order },
      })
    );

    return this.prisma.$transaction(updatePromises);
  }
}
