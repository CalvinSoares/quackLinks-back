import { PrismaClient, Audio } from "@prisma/client";
import { CreateAudioInput, UpdateAudioInput } from "./audio.schema";

export interface IAudioRepository {
  findByPageId(pageId: string): Promise<Audio[]>;
  findByIdAndPageId(audioId: string, pageId: string): Promise<Audio | null>;
  countByPageId(pageId: string): Promise<number>;
  create(pageId: string, data: CreateAudioInput): Promise<Audio>;
  update(audioId: string, data: UpdateAudioInput): Promise<Audio>;
  delete(audioId: string): Promise<void>;
  setActive(audioId: string, pageId: string): Promise<Audio>;
}

export class AudioRepository implements IAudioRepository {
  constructor(private prisma: PrismaClient) {}

  async findByPageId(pageId: string): Promise<Audio[]> {
    return this.prisma.audio.findMany({
      where: { pageId },
      orderBy: { order: "asc" },
    });
  }

  async findByIdAndPageId(
    audioId: string,
    pageId: string
  ): Promise<Audio | null> {
    return this.prisma.audio.findFirst({
      where: { id: audioId, pageId },
    });
  }

  async countByPageId(pageId: string): Promise<number> {
    return this.prisma.audio.count({
      where: { pageId },
    });
  }

  async create(pageId: string, data: CreateAudioInput): Promise<Audio> {
    return this.prisma.audio.create({
      data: { ...data, pageId },
    });
  }

  async update(audioId: string, data: UpdateAudioInput): Promise<Audio> {
    return this.prisma.audio.update({
      where: { id: audioId },
      data,
    });
  }

  async delete(audioId: string): Promise<void> {
    await this.prisma.audio.delete({ where: { id: audioId } });
  }

  async setActive(audioId: string, pageId: string): Promise<Audio> {
    const [, activeAudio] = await this.prisma.$transaction([
      this.prisma.audio.updateMany({
        where: { pageId, NOT: { id: audioId } },
        data: { isActive: false },
      }),
      this.prisma.audio.update({
        where: { id: audioId },
        data: { isActive: true },
      }),
    ]);
    return activeAudio;
  }
}
