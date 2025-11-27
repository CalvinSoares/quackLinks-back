import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { RedirectService } from "./redirect.service";

export class RedirectController {
  private redirectService: RedirectService;

  constructor(fastify: FastifyInstance) {
    this.redirectService = new RedirectService(fastify.prisma);
  }

  /**
   * Handler para a rota de redirecionamento.
   */
  redirectHandler = async (
    req: FastifyRequest<{ Params: { linkId: string } }>,
    reply: FastifyReply
  ) => {
    const { linkId } = req.params;

    const destinationUrl = await this.redirectService.trackAndGetUrl(
      linkId,
      req.ip, // Passa o IP
      req.headers.referer || null // Passa o referrer
    );

    if (!destinationUrl) {
      return reply.code(404).send({ message: "Link não encontrado." });
    }

    // Usar 302 (Found) é geralmente melhor para redirecionamentos temporários/rastreáveis
    return reply.redirect(destinationUrl, 302);
  };
}
