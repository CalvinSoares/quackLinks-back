import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { FastifyRequest, FastifyReply } from "fastify";

export default fp(async (fastify, opts) => {
  fastify.register(jwt, {
    secret:
      process.env.JWT_SECRET || "super-secret-key-change-this-in-production",
  });

  fastify.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  );
});
