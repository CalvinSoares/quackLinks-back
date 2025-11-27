import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { FastifyRequest, FastifyReply } from "fastify";

export default fp(async (fastify, opts) => {
  // Registra o plugin @fastify/jwt
  fastify.register(jwt, {
    secret:
      process.env.JWT_SECRET || "super-secret-key-change-this-in-production",
  });

  // Decora a instância do Fastify com a função 'authenticate'
  fastify.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        // Este método verifica o token JWT no header 'Authorization'
        // Se for válido, continua. Se não, lança um erro.
        await request.jwtVerify();
      } catch (err) {
        // Se a verificação falhar, envia uma resposta de não autorizado
        reply.send(err);
      }
    }
  );
});
