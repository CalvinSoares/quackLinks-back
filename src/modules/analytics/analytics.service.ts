import geoip from "geoip-lite";
import { subDays } from "date-fns";
import { TimePeriod } from "./analytics.schema";
import { IPageRepository } from "../pages/pages.repository";
import { IAnalyticsRepository } from "./analytics.repository";

export class PageNotFoundError extends Error {
  constructor() {
    super("Página não encontrada para este usuário.");
  }
}

export class AnalyticsService {
  constructor(
    private analyticsRepository: IAnalyticsRepository,
    private pageRepository: IPageRepository
  ) {}

  async recordPageView(pageId: string, ip: string, referrer: string | null) {
    const geo = geoip.lookup(ip);
    await Promise.all([
      this.analyticsRepository.createPageView({
        pageId,
        referrer: referrer ? new URL(referrer).hostname : "direct",
        country: geo?.country ?? "Unknown",
      }),
      this.analyticsRepository.incrementPageViewCount(pageId),
    ]);
  }

  async recordLinkClick(linkId: string, ip: string, referrer: string | null) {
    const geo = geoip.lookup(ip);
    await Promise.all([
      this.analyticsRepository.createLinkClick({
        linkId,
        referrer: referrer ? new URL(referrer).hostname : "direct",
        country: geo?.country ?? "Unknown",
      }),
      this.analyticsRepository.incrementLinkClickCount(linkId),
    ]);
  }

  async getAnalyticsForUser(userId: string, period: TimePeriod) {
    const page = await this.pageRepository.findByUserId(userId);
    if (!page) {
      throw new PageNotFoundError();
    }

    let startDate: Date | undefined = undefined;
    if (period === "7d") startDate = subDays(new Date(), 7);
    if (period === "30d") startDate = subDays(new Date(), 30);
    if (period === "90d") startDate = subDays(new Date(), 90);

    const [
      totalViews,
      totalClicks,
      viewsOverTimeRaw,
      clicksOverTimeRaw,
      topLinksClicksInPeriod,
      topReferrersRaw,
      topCountriesRaw,
    ] = await Promise.all([
      this.analyticsRepository.countPageViews(page.id, startDate),
      this.analyticsRepository.countLinkClicks(page.id, startDate),
      this.analyticsRepository.getViewsOverTime(page.id, startDate),
      this.analyticsRepository.getClicksOverTime(page.id, startDate),
      this.analyticsRepository.getTopLinkClicksInPeriod(page.id, startDate),
      this.analyticsRepository.getTopReferrers(page.id, startDate),
      this.analyticsRepository.getTopCountries(page.id, startDate),
    ]);

    const clickThroughRate =
      totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
    const viewsOverTime = this.groupDataByDay(viewsOverTimeRaw, "views");
    const clicksOverTime = this.groupDataByDay(clicksOverTimeRaw, "clicks");
    const topLinks = topLinksClicksInPeriod
      .map((item) => ({
        ...page.links.find((l) => l.id === item.linkId),
        clicks: item._count.linkId,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);
    const topReferrers = topReferrersRaw.map((r) => ({
      source: r.referrer ?? "Direct",
      views: r._count.referrer,
    }));
    const topCountries = topCountriesRaw.map((c) => ({
      country: c.country ?? "Unknown",
      views: c._count.country,
    }));

    return {
      totalViews,
      totalClicks,
      clickThroughRate,
      viewsOverTime,
      clicksOverTime,
      topLinks,
      topReferrers,
      topCountries,
    };
  }

  private groupDataByDay(
    data: { timestamp: Date; _count: { timestamp: number } }[],
    key: "views" | "clicks"
  ) {
    const grouped = new Map<string, number>();
    data.forEach((item) => {
      const day = item.timestamp.toISOString().split("T")[0];
      grouped.set(day, (grouped.get(day) || 0) + item._count.timestamp);
    });
    return Array.from(grouped.entries()).map(([date, count]) => ({
      date,
      [key]: count,
    }));
  }
}
