import { UserRole } from "@prisma/client";
import { CreateAudioInput, UpdateAudioInput } from "./audio.schema";
import { IAudioRepository } from "./audios.repository";
import { IPageRepository } from "../pages/pages.repository";

export class PageNotFoundError extends Error {
  constructor() {
    super("Página do usuário não encontrada.");
  }
}
export class AudioLimitReachedError extends Error {
  constructor(message: string) {
    super(message);
  }
}
export class AudioNotFoundError extends Error {
  constructor() {
    super("Áudio não encontrado ou não pertence a você.");
  }
}

export class AudioService {
  constructor(
    private audioRepository: IAudioRepository,
    private pageRepository: IPageRepository
  ) {}
  private async getUserPage(userId: string) {
    const page = await this.pageRepository.findByUserId(userId);
    if (!page) {
      throw new PageNotFoundError();
    }
    return page;
  }

  async create(userId: string, data: CreateAudioInput) {
    const page = await this.getUserPage(userId);
    const audioCount = await this.audioRepository.countByPageId(page.id);
    const limit = page.user.role === UserRole.PREMIUM ? 4 : 1;
    if (audioCount >= limit) {
      throw new AudioLimitReachedError(`Limite de ${limit} áudio(s) atingido.`);
    }
    return this.audioRepository.create(page.id, data);
  }

  async update(userId: string, audioId: string, data: UpdateAudioInput) {
    const page = await this.getUserPage(userId);
    const audio = await this.audioRepository.findByIdAndPageId(
      audioId,
      page.id
    );
    if (!audio) {
      throw new AudioNotFoundError();
    }
    return this.audioRepository.update(audioId, data);
  }

  async delete(userId: string, audioId: string) {
    const page = await this.getUserPage(userId);
    const audio = await this.audioRepository.findByIdAndPageId(
      audioId,
      page.id
    );
    if (!audio) {
      throw new AudioNotFoundError();
    }
    await this.audioRepository.delete(audioId);
    return { message: "Áudio deletado com sucesso." };
  }

  async setActive(userId: string, audioId: string) {
    const page = await this.getUserPage(userId);
    const audio = await this.audioRepository.findByIdAndPageId(
      audioId,
      page.id
    );
    if (!audio) {
      throw new AudioNotFoundError();
    }
    return this.audioRepository.setActive(audioId, page.id);
  }

  async listByPage(userId: string) {
    const page = await this.getUserPage(userId);
    return this.audioRepository.findByPageId(page.id);
  }
}
