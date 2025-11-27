import { PrismaClient } from "@prisma/client";
import geoip from "geoip-lite";
import { subDays } from "date-fns";
import { TimePeriod } from "./analytics.schema";

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  public async recordPageView(
    pageId: string,
    ip: string,
    referrer: string | null
  ) {
    const geo = geoip.lookup(ip);

    // Roda as duas operações em paralelo para performance
    await Promise.all([
      // 1. Cria o registro de evento detalhado
      this.prisma.pageView.create({
        data: {
          pageId,
          referrer: referrer ? new URL(referrer).hostname : "direct",
          country: geo?.country ?? "Unknown",
        },
      }),
      // 2. Incrementa o contador simples na página
      this.prisma.page.update({
        where: { id: pageId },
        data: { viewCount: { increment: 1 } },
      }),
    ]);
  }

  public async recordLinkClick(
    linkId: string,
    ip: string,
    referrer: string | null
  ) {
    const geo = geoip.lookup(ip);

    // Registra o evento de clique
    await this.prisma.linkClick.create({
      data: {
        linkId,
        referrer: referrer ? new URL(referrer).hostname : "direct",
        country: geo?.country ?? "Unknown",
      },
    });

    // Incrementa o contador simples no link (bom para exibições rápidas)
    await this.prisma.link.update({
      where: { id: linkId },
      data: { clickCount: { increment: 1 } },
    });
  }
  public async getAnalyticsForUser(userId: string, period: TimePeriod) {
    const page = await this.prisma.page.findUnique({
      where: { userId },
      select: {
        id: true,
        viewCount: true,
        links: {
          select: { id: true, title: true, url: true, clickCount: true },
        },
      },
    });

    if (!page) {
      throw new Error("Página não encontrada para este usuário.");
    }

    // 3. Criar a data de início baseada no período
    let startDate: Date | undefined = undefined;
    if (period === "7d") startDate = subDays(new Date(), 7);
    if (period === "30d") startDate = subDays(new Date(), 30);
    if (period === "90d") startDate = subDays(new Date(), 90);
    // Se for 'all', startDate permanece undefined, buscando tudo

    // 4. Criar um objeto de filtro de tempo para reutilizar
    const timeFilter = startDate ? { timestamp: { gte: startDate } } : {};

    // As contagens totais (totalViews, totalClicks) agora refletirão o período selecionado
    const totalViews = await this.prisma.pageView.count({
      where: { pageId: page.id, ...timeFilter },
    });
    const totalClicks = await this.prisma.linkClick.count({
      where: { link: { pageId: page.id }, ...timeFilter },
    });
    const clickThroughRate =
      totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

    // As queries de gráfico agora usam o filtro dinâmico
    const viewsOverTimeRaw = await this.prisma.pageView.groupBy({
      by: ["timestamp"],
      where: { pageId: page.id, ...timeFilter },
      _count: { timestamp: true },
      orderBy: { timestamp: "asc" },
    });
    const viewsOverTime = this.groupDataByDay(viewsOverTimeRaw, "views");

    const clicksOverTimeRaw = await this.prisma.linkClick.groupBy({
      by: ["timestamp"],
      where: { link: { pageId: page.id }, ...timeFilter },
      _count: { timestamp: true },
      orderBy: { timestamp: "asc" },
    });
    const clicksOverTime = this.groupDataByDay(clicksOverTimeRaw, "clicks");

    // As listas de "Top" também usarão o filtro de tempo
    // Para Top Links, teremos que recalcular os cliques baseados no período
    const topLinksClicksInPeriod = await this.prisma.linkClick.groupBy({
      by: ["linkId"],
      where: { link: { pageId: page.id }, ...timeFilter },
      _count: { linkId: true },
    });

    const topLinks = topLinksClicksInPeriod
      .map((item) => {
        const linkInfo = page.links.find((l) => l.id === item.linkId);
        return {
          title: linkInfo?.title || "Link Deletado",
          url: linkInfo?.url || "#",
          clicks: item._count.linkId,
        };
      })
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    const topReferrersRaw = await this.prisma.pageView.groupBy({
      by: ["referrer"],
      where: { pageId: page.id, ...timeFilter },
      _count: { referrer: true },
      orderBy: { _count: { referrer: "desc" } },
      take: 5,
    });
    const topReferrers = topReferrersRaw.map((r) => ({
      source: r.referrer ?? "Direct",
      views: r._count.referrer,
    }));

    const topCountriesRaw = await this.prisma.pageView.groupBy({
      by: ["country"],
      where: { pageId: page.id, ...timeFilter },
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
      take: 5,
    });
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

  // Helper para agrupar dados por dia
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
