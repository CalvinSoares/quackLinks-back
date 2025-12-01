import { PrismaClient } from "@prisma/client";

// Tipos para os retornos brutos das queries groupBy
type GroupByResult = { timestamp: Date; _count: { timestamp: number } }[];
type TopSourceResult = {
  referrer: string | null;
  _count: { referrer: number };
}[];
type TopCountryResult = {
  country: string | null;
  _count: { country: number };
}[];
type TopLinkClickResult = { linkId: string; _count: { linkId: number } }[];

export interface IAnalyticsRepository {
  createPageView(data: {
    pageId: string;
    referrer: string;
    country: string;
  }): Promise<void>;
  incrementPageViewCount(pageId: string): Promise<void>;
  createLinkClick(data: {
    linkId: string;
    referrer: string;
    country: string;
  }): Promise<void>;
  incrementLinkClickCount(linkId: string): Promise<void>;
  countPageViews(pageId: string, startDate?: Date): Promise<number>;
  countLinkClicks(pageId: string, startDate?: Date): Promise<number>;
  getViewsOverTime(pageId: string, startDate?: Date): Promise<GroupByResult>;
  getClicksOverTime(pageId: string, startDate?: Date): Promise<GroupByResult>;
  getTopReferrers(pageId: string, startDate?: Date): Promise<TopSourceResult>;
  getTopCountries(pageId: string, startDate?: Date): Promise<TopCountryResult>;
  getTopLinkClicksInPeriod(
    pageId: string,
    startDate?: Date
  ): Promise<TopLinkClickResult>;
}

export class AnalyticsRepository implements IAnalyticsRepository {
  constructor(private prisma: PrismaClient) {}

  // --- Métodos de Gravação ---
  async createPageView(data: {
    pageId: string;
    referrer: string;
    country: string;
  }): Promise<void> {
    await this.prisma.pageView.create({ data });
  }
  async incrementPageViewCount(pageId: string): Promise<void> {
    await this.prisma.page.update({
      where: { id: pageId },
      data: { viewCount: { increment: 1 } },
    });
  }
  async createLinkClick(data: {
    linkId: string;
    referrer: string;
    country: string;
  }): Promise<void> {
    await this.prisma.linkClick.create({ data });
  }
  async incrementLinkClickCount(linkId: string): Promise<void> {
    await this.prisma.link.update({
      where: { id: linkId },
      data: { clickCount: { increment: 1 } },
    });
  }

  // --- Métodos de Leitura/Agregação ---
  private getTimeFilter(startDate?: Date) {
    return startDate ? { timestamp: { gte: startDate } } : {};
  }

  async countPageViews(pageId: string, startDate?: Date): Promise<number> {
    return this.prisma.pageView.count({
      where: { pageId, ...this.getTimeFilter(startDate) },
    });
  }
  async countLinkClicks(pageId: string, startDate?: Date): Promise<number> {
    return this.prisma.linkClick.count({
      where: { link: { pageId }, ...this.getTimeFilter(startDate) },
    });
  }
  async getViewsOverTime(
    pageId: string,
    startDate?: Date
  ): Promise<GroupByResult> {
    return this.prisma.pageView.groupBy({
      by: ["timestamp"],
      where: { pageId, ...this.getTimeFilter(startDate) },
      _count: { timestamp: true },
      orderBy: { timestamp: "asc" },
    }) as unknown as GroupByResult;
  }
  async getClicksOverTime(
    pageId: string,
    startDate?: Date
  ): Promise<GroupByResult> {
    return this.prisma.linkClick.groupBy({
      by: ["timestamp"],
      where: { link: { pageId }, ...this.getTimeFilter(startDate) },
      _count: { timestamp: true },
      orderBy: { timestamp: "asc" },
    }) as unknown as GroupByResult;
  }
  async getTopReferrers(
    pageId: string,
    startDate?: Date
  ): Promise<TopSourceResult> {
    return this.prisma.pageView.groupBy({
      by: ["referrer"],
      where: { pageId, ...this.getTimeFilter(startDate) },
      _count: { referrer: true },
      orderBy: { _count: { referrer: "desc" } },
      take: 5,
    }) as unknown as TopSourceResult;
  }
  async getTopCountries(
    pageId: string,
    startDate?: Date
  ): Promise<TopCountryResult> {
    return this.prisma.pageView.groupBy({
      by: ["country"],
      where: { pageId, ...this.getTimeFilter(startDate) },
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
      take: 5,
    }) as unknown as TopCountryResult;
  }
  async getTopLinkClicksInPeriod(
    pageId: string,
    startDate?: Date
  ): Promise<TopLinkClickResult> {
    return this.prisma.linkClick.groupBy({
      by: ["linkId"],
      where: { link: { pageId }, ...this.getTimeFilter(startDate) },
      _count: { linkId: true },
    }) as unknown as TopLinkClickResult;
  }
}
