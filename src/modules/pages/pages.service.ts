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
}
