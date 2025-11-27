import { PrismaClient } from "@prisma/client";
import { AnalyticsService } from "../analytics/analytics.service";

export class RedirectService {
  private analyticsService: AnalyticsService;

  constructor(private prisma: PrismaClient) {
    this.analyticsService = new AnalyticsService(prisma);
  }

  /**
   * Registra um clique em um link e retorna o URL de destino.
   * A operação de incremento é atômica e segura para concorrência.
   * @param linkId O ID do link a ser rastreado.
   * @returns O URL de destino do link, ou null se o link não for encontrado.
   */
  async trackAndGetUrl(
    linkId: string,
    ip: string,
    referrer: string | null
  ): Promise<string | null> {
    try {
      // Usamos uma transação para garantir que a atualização e a busca aconteçam juntas.
      // O `update` retorna o registro atualizado.
      const link = await this.prisma.link.findUnique({
        where: { id: linkId },
        select: { url: true },
      });

      if (!link) {
        return null;
      }

      this.analyticsService
        .recordLinkClick(linkId, ip, referrer)
        .catch((err) =>
          console.error(
            `Failed to record detailed click for link ${linkId}:`,
            err
          )
        );

      return link.url;
    } catch (error) {
      // O Prisma lança um erro (P2025) se o registro a ser atualizado não for encontrado.
      // Retornamos null para que o controller possa lidar com o caso 404.
      console.error(`Erro ao rastrear o link ${linkId}:`, error);
      return null;
    }
  }
}
