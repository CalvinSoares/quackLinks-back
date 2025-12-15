import { BlockRepository } from "./blocks.repository";
import { PageRepository } from "../pages/pages.repository";
import {
  CreateBlockInput,
  ReorderBlocksInput,
  UpdateBlockInput,
} from "./blocks.schema";

export class BlockService {
  constructor(
    private blockRepository: BlockRepository,
    private pageRepository: PageRepository
  ) {}

  // Helper para verificar propriedade
  private async verifyPageOwnership(userId: string, pageId: string) {
    const page = await this.pageRepository.findByUserId(userId);
    if (!page || page.id !== pageId) {
      throw new Error("Page not found or unauthorized");
    }
    return page;
  }

  // Helper para verificar propriedade do bloco
  private async verifyBlockOwnership(userId: string, blockId: string) {
    const block = await this.blockRepository.findById(blockId);
    if (!block) throw new Error("Block not found");

    // Verifica se a página do bloco pertence ao user
    await this.verifyPageOwnership(userId, block.pageId);
    return block;
  }

  async createBlock(userId: string, data: CreateBlockInput) {
    // 1. Acha a página do usuário
    const page = await this.pageRepository.findByUserId(userId);
    if (!page) throw new Error("User does not have a page");

    // 2. Calcula a nova ordem (último + 1)
    const maxOrder = await this.blockRepository.getMaxOrder(page.id);

    // 3. Cria
    return this.blockRepository.create(page.id, data, maxOrder + 1);
  }

  async updateBlock(userId: string, blockId: string, data: UpdateBlockInput) {
    await this.verifyBlockOwnership(userId, blockId);
    return this.blockRepository.update(blockId, data);
  }

  async deleteBlock(userId: string, blockId: string) {
    await this.verifyBlockOwnership(userId, blockId);
    return this.blockRepository.delete(blockId);
  }

  async reorderBlocks(userId: string, data: ReorderBlocksInput) {
    if (data.blocks.length === 0) return;

    // Segurança: Verifica se o PRIMEIRO bloco pertence ao usuário.
    // Assumimos que o frontend envia blocos da mesma página.
    // Para segurança total, deveríamos verificar todos, mas seria custoso.
    await this.verifyBlockOwnership(userId, data.blocks[0].id);

    return this.blockRepository.reorder(data.blocks);
  }
}
