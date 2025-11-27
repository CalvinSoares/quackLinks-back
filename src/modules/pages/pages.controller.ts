import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PageService } from "./pages.service";
import { UpdatePageInput } from "./pages.schema";
import { Prisma } from "@prisma/client";
import { AnalyticsService } from "../analytics/analytics.service";

export class PageController {
  private pageService: PageService;
  private analyticsService: AnalyticsService;

  constructor(fastify: FastifyInstance) {
    this.pageService = new PageService(fastify.prisma);
    this.analyticsService = new AnalyticsService(fastify.prisma);
  }

  // GET /:slug - Rota pública
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

  // GET /my-page - Rota privada
  getMyPageHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    // request.user vem do hook de autenticação
    const page = await this.pageService.getOrCreateMyPage(
      req.user.id,
      req.user.name
    );
    return page;
  };

  // PUT /my-page - Rota privada
  updateMyPageHandler = async (
    req: FastifyRequest<{ Body: UpdatePageInput }>,
    reply: FastifyReply
  ) => {
    try {
      const dataToUpdate: Prisma.PageUpdateInput = {};
      const body = req.body;

      Object.keys(body).forEach((key) => {
        const typedKey = key as keyof UpdatePageInput;
        if (body[typedKey] !== null) {
          (dataToUpdate as any)[typedKey] = body[typedKey];
        }
      });

      const updatedPage = await this.pageService.updateMyPage(
        req.user.id,
        dataToUpdate
      );
      return updatedPage;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return reply.code(409).send({ message: "Este slug já está em uso." });
      }
      console.error("Erro ao atualizar a página:", error);
      return reply
        .code(500)
        .send({ message: "Não foi possível atualizar a página." });
    }
  };
}
