import { AnalyticsService } from "../analytics/analytics.service";
import { RedirectRepository } from "./redirect.repository";

export class RedirectService {
  constructor(
    private redirectRepository: RedirectRepository,
    private analyticsService: AnalyticsService
  ) {}

  async trackAndGetUrl(
    linkId: string,
    ip: string,
    referrer: string | null
  ): Promise<string | null> {
    try {
      const link = await this.redirectRepository.findUrlById(linkId);

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
      console.error(`Erro ao rastrear o link ${linkId}:`, error);
      return null;
    }
  }
}
