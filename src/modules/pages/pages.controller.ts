import { FastifyRequest, FastifyReply } from "fastify";
import { PageService } from "./pages.service";
import { UpdatePageInput } from "./pages.schema";
import { AnalyticsService } from "../analytics/analytics.service";

export class PageController {
  constructor(
    private pageService: PageService,
    private analyticsService: AnalyticsService
  ) {}

  getPageBySlugHandler = async (
    req: FastifyRequest<{ Params: { slug: string } }>,
    reply: FastifyReply
  ) => {
    const page = await this.pageService.getPageBySlug(req.params.slug);
    if (!page) {
      return reply.code(404).send({ message: "Página não encontrada." });
    }

    this.analyticsService
      .recordPageView(page.id, req.ip, req.headers.referer || null)
      .catch((err) => console.error("Failed to record page view:", err));

    return page;
  };

  getMyPageHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const page = await this.pageService.getOrCreateMyPage(
      req.user.id,
      req.user.name
    );
    return page;
  };

  updateMyPageHandler = async (
    req: FastifyRequest<{ Body: UpdatePageInput }>,
    reply: FastifyReply
  ) => {
    try {
      const updatedPage = await this.pageService.updateMyPage(
        req.user.id,
        req.body
      );
      return updatedPage;
    } catch (error: any) {
      if (error.message.includes("Página não encontrada")) {
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
