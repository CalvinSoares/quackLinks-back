import { FastifyRequest, FastifyReply } from "fastify";
import { PageService } from "./pages.service";
import { UpdatePageInput } from "./pages.schema";
import { AnalyticsService } from "../analytics/analytics.service";
import { User as PrismaUser } from "@prisma/client";

type UpdatePageRequest = FastifyRequest<{
  Body: UpdatePageInput;
}>;

export class PageController {
  constructor(
    private pageService: PageService,
    private analyticsService: AnalyticsService
  ) {}

  getPageBySlugHandler = async (
    req: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply
  ) => {
    const request = req as FastifyRequest<{ Params: { slug: string } }>;

    const page = await this.pageService.getPageBySlug(request.params.slug);
    if (!page) {
      return reply.code(404).send({ message: "Página não encontrada." });
    }

    this.analyticsService
      .recordPageView(page.id, request.ip, request.headers.referer || null)
      .catch((err) => console.error("Failed to record page view:", err));

    return page;
  };

  getMyPageHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = req.user as PrismaUser;
    const page = await this.pageService.getOrCreateMyPage(user.id, user.name);
    return page;
  };

  updateMyPageHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const request = req as UpdatePageRequest;

    if (!request.user) {
      return reply.code(401).send({ message: "Não autorizado." });
    }
    const user = request.user as PrismaUser;

    try {
      const updatedPage = await this.pageService.updateMyPage(
        user.id,
        request.body
      );
      return updatedPage;
    } catch (error: any) {
      if (error.message && error.message.includes("Página não encontrada")) {
        return reply
          .code(404)
          .send({ message: "Página não encontrada para o usuário." });
      }
      if (error?.code === "P2002") {
        return reply.code(409).send({ message: "Este slug já está em uso." });
      }
      console.error("Erro ao atualizar a página:", error);
      return reply
        .code(500)
        .send({ message: "Não foi possível atualizar a página." });
    }
  };
}
