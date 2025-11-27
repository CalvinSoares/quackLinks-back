import { PrismaClient, UserRole } from "@prisma/client";
import { CreateAudioInput, UpdateAudioInput } from "./audio.schema";

export class AudioService {
  constructor(private prisma: PrismaClient) {}

  // Busca a página de um usuário para garantir que ele é o dono
  private async getUserPage(userId: string) {
    const page = await this.prisma.page.findUnique({
      where: { userId },
      select: { id: true, user: { select: { role: true } } },
    });
    if (!page) {
      throw new Error("Página não encontrada.");
    }
    return page;
  }

  // Criar um novo áudio
  async create(userId: string, data: CreateAudioInput) {
    const page = await this.getUserPage(userId);

    // Lógica de limite de áudios (FREE vs PREMIUM)
    const audioCount = await this.prisma.audio.count({
      where: { pageId: page.id },
    });
    const limit = page.user.role === UserRole.PREMIUM ? 4 : 1;
    if (audioCount >= limit) {
      throw new Error(`Limite de ${limit} áudio(s) atingido.`);
    }

    const newAudio = await this.prisma.audio.create({
      data: {
        ...data,
        pageId: page.id,
      },
    });
    return newAudio;
  }

  // Atualizar um áudio
  async update(userId: string, audioId: string, data: UpdateAudioInput) {
    const page = await this.getUserPage(userId);
    // Garante que o áudio a ser atualizado pertence à página do usuário
    const audio = await this.prisma.audio.findFirstOrThrow({
      where: { id: audioId, pageId: page.id },
    });

    const updatedAudio = await this.prisma.audio.update({
      where: { id: audio.id },
      data,
    });
    return updatedAudio;
  }

  // Deletar um áudio
  async delete(userId: string, audioId: string) {
    const page = await this.getUserPage(userId);
    // Garante que o áudio a ser deletado pertence à página do usuário
    const audio = await this.prisma.audio.findFirstOrThrow({
      where: { id: audioId, pageId: page.id },
    });

    await this.prisma.audio.delete({ where: { id: audio.id } });
    return { message: "Áudio deletado com sucesso." };
  }

  // Definir um áudio como ativo (e desativar os outros)
  async setActive(userId: string, audioId: string) {
    const page = await this.getUserPage(userId);
    // Garante que o áudio existe e pertence à página do usuário
    await this.prisma.audio.findFirstOrThrow({
      where: { id: audioId, pageId: page.id },
    });

    // Usa uma transação para garantir a atomicidade das operações
    const transaction = await this.prisma.$transaction([
      // 1. Desativa todos os outros áudios da página
      this.prisma.audio.updateMany({
        where: { pageId: page.id, NOT: { id: audioId } },
        data: { isActive: false },
      }),
      // 2. Ativa o áudio selecionado
      this.prisma.audio.update({
        where: { id: audioId },
        data: { isActive: true },
      }),
    ]);

    return transaction[1]; // Retorna o áudio que foi ativado
  }

  // Listar todos os áudios de uma página
  async listByPage(userId: string) {
    const page = await this.getUserPage(userId);
    return this.prisma.audio.findMany({
      where: { pageId: page.id },
      orderBy: { order: "asc" },
    });
  }
}
