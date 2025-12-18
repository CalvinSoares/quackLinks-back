import { PageRepository } from "./pages.repository";
import { UpdatePageInput } from "./pages.schema";

export class PageService {
  constructor(private pageRepository: PageRepository) {}

  async getPageBySlug(slug: string) {
    return this.pageRepository.findBySlug(slug);
  }

  async getOrCreateMyPage(userId: string, userName: string) {
    const existingPage = await this.pageRepository.findByUserId(userId);

    if (existingPage) {
      return existingPage;
    }

    const defaultSlug = `${userName
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Math.random().toString(36).substring(2, 6)}`;

    return this.pageRepository.create({
      slug: defaultSlug,
      title: `${userName}'s Page`,
      user: {
        connect: {
          id: userId,
        },
      },
    });
  }

  async updateMyPage(userId: string, data: UpdatePageInput) {
    const page = await this.pageRepository.findByUserId(userId);
    if (!page) {
      throw new Error("Página não encontrada.");
    }

    const dataToUpdate: Partial<UpdatePageInput> = {};
    Object.keys(data).forEach((key) => {
      const typedKey = key as keyof UpdatePageInput;
      if (data[typedKey] !== undefined && data[typedKey] !== null) {
        (dataToUpdate as any)[typedKey] = data[typedKey];
      }
    });

    return this.pageRepository.update(page.id, dataToUpdate);
  }

  async getUserPages(userId: string, page = 1, limit = 10, search = "") {
    const skip = (page - 1) * limit;

    const [pages, total] = await Promise.all([
      this.pageRepository.findAllByUser(userId, skip, limit, search),
      this.pageRepository.countByUser(userId, search),
    ]);

    return {
      pages,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async createPage(userId: string, title: string, slug: string) {
    // Conta quantas páginas o usuário tem (sem filtro de busca)
    const count = await this.pageRepository.countByUser(userId);

    if (count >= 5) {
      throw new Error("Limite máximo de 5 páginas atingido.");
    }

    // Verifica se slug já existe
    const existingPage = await this.pageRepository.findBySlug(slug);
    if (existingPage) throw new Error("Este link já está em uso.");

    return this.pageRepository.create({
      slug,
      title,
      user: { connect: { id: userId } },
      theme: "default",
    });
  }

  async deletePage(userId: string, pageId: string) {
    // Verifica propriedade antes de deletar
    const page = await this.pageRepository.findById(pageId);

    if (!page || page.userId !== userId) {
      throw new Error("Página não encontrada ou não autorizada.");
    }

    return this.pageRepository.delete(pageId);
  }
}
