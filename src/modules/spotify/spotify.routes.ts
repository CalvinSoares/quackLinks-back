import { FastifyPluginAsync } from "fastify";
import axios from "axios";
import { z } from "zod";
import { User as PrismaUser } from "@prisma/client";
import { authenticateJwt } from "../../plugins/authenticate";

const spotifyApiRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const { prisma } = fastify;

  fastify.get(
    "/search",
    {
      preHandler: [authenticateJwt],
      schema: {
        querystring: z.object({
          q: z.string().min(1, "O termo de busca é obrigatório."),
        }),
      },
    },
    async (req, reply) => {
      const { q } = req.query as { q: string };
      if (!req.user) {
        return reply.code(401).send({ message: "Não autorizado." });
      }
      const user = req.user as PrismaUser;
      const userId = user.id;

      const spotifyAccount = await prisma.account.findFirst({
        where: { userId, provider: "spotify" },
      });

      if (!spotifyAccount || !spotifyAccount.access_token) {
        return reply.code(403).send({
          message: "Conta do Spotify não conectada ou token inválido.",
        });
      }

      try {
        const response = await axios.get("https://api.spotify.com/v1/search", {
          headers: {
            Authorization: `Bearer ${spotifyAccount.access_token}`,
          },
          params: {
            q,
            type: "track",
            limit: 10,
          },
        });

        return reply.send(response.data.tracks.items);
      } catch (error: any) {
        console.error("Erro ao buscar no Spotify:", error.response?.data);
        return reply
          .code(500)
          .send({ message: "Erro ao se comunicar com a API do Spotify." });
      }
    }
  );

  fastify.get(
    "/status",
    {
      preHandler: [authenticateJwt],
    },
    async (req, reply) => {
      if (!req.user) {
        return reply.code(401).send({ message: "Não autorizado." });
      }
      const user = req.user as PrismaUser;
      const spotifyAccount = await prisma.account.findFirst({
        where: { userId: user.id, provider: "spotify" },
      });
      return reply.send({ isConnected: !!spotifyAccount });
    }
  );
};

export default spotifyApiRoutes;
