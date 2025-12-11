import { FastifyRequest, FastifyReply } from "fastify";
import { AnalyticsService } from "./analytics.service";
import { User as PrismaUser } from "@prisma/client";
import { GetAnalyticsQuery } from "./analytics.schema";

type AnalyticsRequest = FastifyRequest<{
  Querystring: GetAnalyticsQuery;
}>;

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  getMyPageAnalyticsHandler = async (
    req: FastifyRequest, // Alterado para genérico na assinatura
    reply: FastifyReply
  ) => {
    // Cast para tipagem específica dentro da função
    const request = req as AnalyticsRequest;

    try {
      if (!request.user) {
        return reply.code(401).send({ message: "Não autorizado." });
      }
      const user = request.user as PrismaUser;

      const analyticsData = await this.analyticsService.getAnalyticsForUser(
        user.id,
        request.query.period
      );
      return analyticsData;
    } catch (error: any) {
      console.error("Error fetching analytics data:", error);

      // Pequena melhoria de segurança para evitar crash se error.message for undefined
      if (error.message && error.message.includes("Página não encontrada")) {
        return reply.code(404).send({ message: error.message });
      }
      return reply
        .code(500)
        .send({ message: "Não foi possível buscar os dados de analytics." });
    }
  };
}
