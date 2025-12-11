import { User as PrismaUser } from "@prisma/client";
import { FastifyRequest, FastifyReply } from "fastify";

declare module "@fastify/passport" {
  interface PassportUser extends PrismaUser {}
}

declare module "fastify" {
  export interface FastifyRequest {
    user?: PrismaUser;
  }
}
