import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { AnalyticsService } from "./analytics.service";
import { TimePeriod } from "./analytics.schema";

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor(fastify: FastifyInstance) {
    this.analyticsService = new AnalyticsService(fastify.prisma);
  }

  getMyPageAnalyticsHandler = async (
    req: FastifyRequest<{ Querystring: { period: TimePeriod } }>,
    reply: FastifyReply
  ) => {
    try {
      // req.user.id vem do hook de autenticação
      const analyticsData = await this.analyticsService.getAnalyticsForUser(
        req.user.id,
        req.query.period
      );
      return analyticsData;
    } catch (error: any) {
      console.error("Error fetching analytics data:", error);
      if (error.message.includes("Página não encontrada")) {
        return reply.code(404).send({ message: error.message });
      }
      return reply
        .code(500)
        .send({ message: "Não foi possível buscar os dados de analytics." });
    }
  };
}
