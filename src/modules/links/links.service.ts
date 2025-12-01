import { Prisma } from "@prisma/client";
import { IPageRepository } from "../pages/pages.repository";
import { ILinkRepository } from "./links.repository";
import {
  CreateLinkInput,
  ReorderLinkInput,
  UpdateLinkInput,
} from "./links.schema";

export class PageNotFoundError extends Error {
  constructor() {
    super("Página do usuário não encontrada.");
  }
}
export class LinkNotFoundError extends Error {
  constructor() {
    super("Link não encontrado ou não pertence a você.");
  }
}
export class PermissionDeniedError extends Error {
  constructor() {
    super("Permissão negada: um ou mais links não pertencem a este usuário.");
  }
}

export class LinkService {
  constructor(
    private linkRepository: ILinkRepository,
    private pageRepository: IPageRepository
  ) {}

  async createLink(userId: string, data: CreateLinkInput) {
    const page = await this.pageRepository.findByUserId(userId);
    if (!page) throw new PageNotFoundError();

    const linkCount = await this.linkRepository.countByPageId(page.id);

    return this.linkRepository.create(page.id, {
      ...data,
      order: linkCount,
    });
  }

  async updateLink(userId: string, linkId: string, data: UpdateLinkInput) {
    try {
      return await this.linkRepository.updateByUserId(linkId, userId, data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new LinkNotFoundError();
      }
      throw error;
    }
  }

  async deleteLink(userId: string, linkId: string) {
    try {
      await this.linkRepository.deleteByUserId(linkId, userId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new LinkNotFoundError();
      }
      throw error;
    }
  }

  async reorderLinks(userId: string, updates: ReorderLinkInput) {
    // Lógica de negócio: Validar que todos os links pertencem ao usuário
    const userLinks = await this.linkRepository.findByUserId(userId);
    const userLinkIds = new Set(userLinks.map((link) => link.id));
    const allUpdatesAreValid = updates.every((update) =>
      userLinkIds.has(update.id)
    );

    if (!allUpdatesAreValid) {
      throw new PermissionDeniedError();
    }

    await this.linkRepository.reorder(updates);
  }
}
