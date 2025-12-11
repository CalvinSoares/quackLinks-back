import { FastifyReply, FastifyRequest } from "fastify";
import passport from "@fastify/passport";
import { User as PrismaUser } from "@prisma/client";

export const authenticateJwt = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: (error?: Error) => void
) => {
  const handler = passport.authenticate(
    "jwt",
    { session: false },
    async (req, res, err, user, info, status) => {
      if (err || !user) {
        return reply.code(401).send({ message: "Token inválido ou expirado." });
      }

      request.user = user as PrismaUser;

      done();
    }
  );

  handler.call(request.server, request, reply);
};
