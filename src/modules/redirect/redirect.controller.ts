import { FastifyRequest, FastifyReply } from "fastify";
import { RedirectService } from "./redirect.service";

export class RedirectController {
  constructor(private redirectService: RedirectService) {}

  redirectHandler = async (
    req: FastifyRequest<{ Params: { linkId: string } }>,
    reply: FastifyReply
  ) => {
    const { linkId } = req.params;

    const destinationUrl = await this.redirectService.trackAndGetUrl(
      linkId,
      req.ip,
      req.headers.referer || null
    );

    if (!destinationUrl) {
      return reply.code(404).send({ message: "Link não encontrado." });
    }

    return reply.redirect(destinationUrl, 302);
  };
}
